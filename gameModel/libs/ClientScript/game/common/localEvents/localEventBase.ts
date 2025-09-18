import { registerOpenSelectedActorPanelAfterMove } from '../../../gameInterface/afterUpdateCallbacks';
import { entries, keys } from '../../../tools/helper';
import { activableLogger, mainSimLogger, resourceLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { ActionBase, OnTheRoadAction } from '../actions/actionBase';
import { Actor, InterventionRole } from '../actors/actor';
import { getCasuActorId, getHighestAuthorityActorsByLocation } from '../actors/actorLogic';
import {
  ActionId,
  ActorId,
  GlobalEventId,
  PatientUnitId,
  ResourceContainerDefinitionId,
  ResourceId,
  SimDuration,
  SimTime,
  TaskId,
  TemplateId,
  TranslationKey,
} from '../baseTypes';
import { FailedRessourceArrivalDelay, TimeSliceDuration } from '../constants';
import {
  getHospitalsByProximity,
  getPatientUnitById,
  getPatientUnitIdsSorted,
} from '../evacuation/hospitalController';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../events/casuMessageEvent';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import { GameOptions } from '../gameOptions';
import { ActivationOperator } from '../impacts/implementation/activationImpact';
import { Uid } from '../interfaces';
import { computeNewPatientsState } from '../patients/handleState';
import { formatStandardPretriageReport } from '../patients/pretriageUtils';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { getContainerDef, resolveResourceRequest } from '../resources/emergencyDepartment';
import { Resource } from '../resources/resource';
import { ResourceContainerType } from '../resources/resourceContainer';
import * as ResourceLogic from '../resources/resourceLogic';
import { resourceArrivalLocationResolution } from '../resources/resourceLogic';
import { ResourceType } from '../resources/resourceType';
import { Activable } from '../simulationState/activableState';
import { updateHospitalProximityRequest } from '../simulationState/hospitalState';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { changePatientLocation, PatientLocation } from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { getTaskByTypeAndLocation, getTaskCurrentStatus } from '../simulationState/taskStateAccess';
import { isTimeForwardReady, updateCurrentTimeFrame } from '../simulationState/timeState';
import { TaskStatus, TaskType } from '../tasks/taskBase';
import { getIdleTaskUid } from '../tasks/taskLogic';
import { evaluateAllTriggers } from '../triggers/trigger';
import { getLocalEventManager } from './localEventManager';

export interface LocalEvent {
  type: string;
  parentEventId: GlobalEventId; // The Global Event that causes this local event
  parentTriggerId?: Uid; // The Trigger that causes this local event, (most of the time, there is none)
  simTimeStamp: SimTime; // The time at which it happens
  priority?: number; // The smaller priority is the first to be processed
}

export abstract class LocalEventBase {
  private static eventCounter = 0;

  /**
   * Used for ordering
   */
  public readonly eventNumber: number;

  readonly type: string;
  readonly parentEventId: GlobalEventId;
  readonly parentTriggerId: Uid | undefined;
  readonly simTimeStamp: number;
  readonly priority: number;

  protected constructor(props: LocalEvent) {
    this.type = props.type;
    this.parentEventId = props.parentEventId;
    this.parentTriggerId = props.parentTriggerId ?? undefined;
    this.simTimeStamp = props.simTimeStamp;
    this.priority = props.priority ?? 0;

    this.eventNumber = LocalEventBase.eventCounter++;
  }

  /**
   * Applies the effects of this event to the state
   * @param state In this function, state changes are allowed
   */
  abstract applyStateUpdate(state: MainSimulationState): void;
}

/**
 * @param e1
 * @param e2
 * @returns true if e1 precedes e2, ordering by timestamps (trigger time)
 * if equal timestamps priority is used instead
 * if equal priority order (eventCounter) is used instead
 */
export function compareLocalEvents(e1: LocalEventBase, e2: LocalEventBase): boolean {
  if (e1.simTimeStamp === e2.simTimeStamp) {
    if (e1.priority === e2.priority) {
      return e1.eventNumber < e2.eventNumber;
    }
    return e1.priority < e2.priority;
  }
  return e1.simTimeStamp < e2.simTimeStamp;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// immutable
/**
 * Creates an action to be inserted in the timeline and inits it
 */
export class PlanActionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly action: ActionBase;
    }
  ) {
    super({ ...props, type: 'PlanActionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.actions.push(this.props.action);
    // init action
    this.props.action.update(state);
  }
}

// Update status of action
export class CancelActionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly templateId: TemplateId;
      readonly actorUid: ActorId;
      readonly planTime: SimTime;
    }
  ) {
    super({ ...props, type: 'CancelActionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const now = state.getSimTime();
    const action = so.actions.find(
      a =>
        a.getTemplateId() === this.props.templateId &&
        a.ownerId === this.props.actorUid &&
        a.startTime == now
    );

    if (action && action.startTime === this.props.planTime) {
      // We remove the action and place it in cancelled actions
      so.actions.splice(so.actions.indexOf(action), 1);
      so.cancelledActions.push(action);
      action.cancel(state);
    } else {
      // err.log
    }
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// time
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export abstract class TimeForwardLocalBaseEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly priority?: number;
      readonly type: string;
      readonly actors: ActorId[];
    }
  ) {
    const defaultProps = { priority: 1 };
    super({ ...defaultProps, ...props });
  }

  protected updateCurrentTimeFrame(state: MainSimulationState, modifier: number) {
    updateCurrentTimeFrame(state, this.props.actors, modifier, this.props.simTimeStamp);
  }
}

/**
 * When applied to state, bumps the readiness of the provided actors.
 * If all actors are ready, time forwards
 */
export class TimeForwardLocalEvent extends TimeForwardLocalBaseEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly actors: ActorId[];
      readonly timeJump: number;
    }
  ) {
    super({ ...extensionProps, type: 'TimeForwardLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    this.updateCurrentTimeFrame(state, 1);
    if (isTimeForwardReady(state)) {
      state.incrementSimulationTime(this.extensionProps.timeJump);

      // update patients
      this.updatePatients(state, this.extensionProps.timeJump);

      // update all actions
      this.updateActions(state);

      // update all tasks
      this.updateTasks(state);

      // run the triggers
      const generatedLocalEvents = evaluateAllTriggers(state);
      getLocalEventManager().queueLocalEvents(generatedLocalEvents);

      registerOpenSelectedActorPanelAfterMove();

      state.updateForwardTimeFrame();

      // auto-continue if all actors are still awaiting
      if (isTimeForwardReady(state)) {
        const tfw = new TimeForwardLocalEvent({
          parentEventId: this.extensionProps.parentEventId,
          simTimeStamp: state.getSimTime(),
          actors: [],
          timeJump: TimeSliceDuration,
        });
        getLocalEventManager().queueLocalEvent(tfw);
      }
    }
  }

  private updatePatients(state: MainSimulationState, timeJump: number) {
    const patients = state.getInternalStateObject().patients;
    computeNewPatientsState(patients, timeJump);
  }

  private updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  private updateTasks(state: MainSimulationState) {
    TaskState.getAllTasks(state).forEach(t => t.update(state, this.extensionProps.timeJump));
  }
}

/**
 * When applied, bumps down being readiness for a time forward for the provided actors
 */
export class TimeForwardCancelLocalEvent extends TimeForwardLocalBaseEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly actors: ActorId[];
    }
  ) {
    super({ ...extensionProps, type: 'TimeForwardCancelLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    // decrement timeforward 'readiness'
    this.updateCurrentTimeFrame(state, -1);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// map items
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/////////// TODO in own file
export class AddFixedEntityLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly fixedMapEntity: FixedMapEntity;
    }
  ) {
    super({ ...props, type: 'AddFixedEntityLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.push(this.props.fixedMapEntity);
  }
}

export class RemoveFixedEntityLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly fixedMapEntity: FixedMapEntity;
    }
  ) {
    super({ ...props, type: 'RemoveFixedEntityLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.splice(
      so.mapLocations.findIndex(
        f =>
          f.id === this.props.fixedMapEntity.id && f.ownerId === this.props.fixedMapEntity.ownerId
      ),
      1
    );
  }
}

export class CompleteBuildingFixedEntityLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly fixedMapEntity: FixedMapEntity;
    }
  ) {
    super({ ...props, type: 'CompleteBuildingFixedEntityLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations
      .filter(mapEntity => mapEntity.id === this.props.fixedMapEntity.id)
      .forEach(mapEntity => (mapEntity.buildingStatus = BuildingStatus.ready));
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// actors
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class AddActorLocalEvent extends LocalEventBase {
  /**
   * Adds an actor in the game
   */
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly role: InterventionRole; // spawned role
      readonly location?: LOCATION_ENUM | undefined; // if undefined automatically resolved
      readonly travelTime?: SimDuration; // if 0 no travel time, if greater, a travel action is planned
    }
  ) {
    super({ ...props, type: 'AddActorLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const actor = new Actor(this.props.role);
    const loc = this.props.location || actor.getComputedSymbolicLocation(state);
    actor.setLocation(loc);
    state.getInternalStateObject().actors.push(actor);

    if (this.props.travelTime != undefined && this.props.travelTime > 0) {
      actor.setLocation(LOCATION_ENUM.remote);
      const now = state.getSimTime();
      const travelAction = new OnTheRoadAction(
        now,
        this.props.travelTime,
        'actor-arrival',
        'on-the-road',
        0,
        actor.Uid,
        0
      );
      state.getInternalStateObject().actions.push(travelAction);
    }
  }
}

export class MoveActorLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly actorUid: ActorId;
      readonly location: LOCATION_ENUM;
    }
  ) {
    super({ ...props, type: 'MoveActorLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    if (!canMoveToLocation(state, 'Actors', this.props.location)) {
      mainSimLogger.warn('The actor could not be moved as the target location is invalid');
    } else {
      so.actors
        .filter(a => a.Uid === this.props.actorUid)
        .forEach(a => (a.Location = this.props.location));
    }
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class AddMessageLocalEvent extends LocalEventBase {
  private static RadioIdProvider = 1;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly parentTriggerId?: Uid;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId?: ActorId | undefined;
      readonly message: TranslationKey;
      readonly channel?: RadioType | undefined;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
  ) {
    super({ ...props, type: 'AddMessageLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const msg = this.props.omitTranslation
      ? this.props.message
      : getTranslation(
          'mainSim-actions-tasks',
          this.props.message,
          undefined,
          this.props.messageValues
        );

    state.getInternalStateObject().radioMessages.push({
      senderId: this.props.senderId,
      senderName: this.props.senderName,
      recipientId: this.props.recipientId,
      timeStamp: this.props.simTimeStamp,
      message: msg,
      uid: AddMessageLocalEvent.RadioIdProvider++,
      isRadioMessage: this.props.channel != undefined,
      channel: this.props.channel,
      pending: false,
    });
  }
}

export class AddRadioMessageLocalEvent extends AddMessageLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly parentTriggerId?: Uid;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId?: ActorId | undefined;
      readonly message: TranslationKey;
      readonly channel: RadioType;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
  ) {
    super({ ...extensionProps });
  }
}

export class AddNotificationLocalEvent extends AddMessageLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly parentTriggerId?: Uid;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId: ActorId;
      readonly message: TranslationKey;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
  ) {
    super({ ...extensionProps });
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// EMERGENCY DEPARTMENT - RESOURCE ARRIVAL
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Takes a player formulated request and resolves it given
 * the emergency center's available resources
 */
export class ResourceRequestResolutionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly actorUid: ActorId | undefined;
      readonly request: CasuMessagePayload;
    }
  ) {
    super({ ...props, type: 'ResourceRequestResolutionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    // check that the payload subtypes to MethaneMessagePayload
    if (this.props.request.messageType !== 'R' && this.props.request.resourceRequest) {
      resolveResourceRequest(
        state,
        this.props.parentEventId,
        this.props.actorUid,
        this.props.request.resourceRequest
      );
    }
  }
}

export class AutoSendACSMCSLocalEvent extends ResourceRequestResolutionLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
    }
  ) {
    //Request ACS-MCS
    const casuMessage: MethaneMessagePayload = {
      messageType: 'E',
      resourceRequest: {
        'ACS-MCS': 1,
        Ambulance: 0,
        SMUR: 0,
        PMA: 0,
        PICA: 0,
        'PC-San': 0,
        Helicopter: 0,
      },
    };
    super({ ...extensionProps, actorUid: undefined, request: casuMessage });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    resourceLogger.info('Force requesting ACS-MCS if needed');
    super.applyStateUpdate(state);
  }
}

/**
 * Spawned when the emergency dept sends resource containers
 */
export class ResourceMobilizationEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly departureTime: SimTime;
      readonly travelTime: SimDuration;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly configName: string;
    }
  ) {
    super({ ...props, type: 'ResourceMobilizationEvent' });
  }

  override applyStateUpdate(_state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);
    // We assume that containers are well configured
    // and thus that there are no duplicates

    // actors are created right away (they need to appear in the timeline)
    // Note : Actor creation ignores the "amount" value
    containerDef.roles.forEach(role => {
      const evt = new AddActorLocalEvent({
        parentEventId: this.props.parentEventId,
        simTimeStamp: this.props.departureTime,
        role,
        travelTime: this.props.travelTime,
      });
      getLocalEventManager().queueLocalEvent(evt);
    });

    if (
      Object.keys(containerDef.resources).length > 0 ||
      Object.keys(containerDef.flags).length > 0
    ) {
      // schedule resource arrival event
      const evt = new ResourcesArrivalLocalEvent({
        parentEventId: this.props.parentEventId,
        simTimeStamp: this.props.departureTime + this.props.travelTime,
        containerDefId: this.props.containerDefId,
        amount: this.props.amount,
        squadName: this.props.configName,
      });
      getLocalEventManager().queueLocalEvent(evt);
    }
  }
}

/**
 * Resources arrival on site
 * Resources are assigned to the highest hierarchy level present by default
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly squadName: string;
    }
  ) {
    super({ ...props, type: 'ResourcesArrivalLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);

    if (ResourceLogic.resourceContainerCanArrive(state, containerDef.type)) {
      // add flags to state if any
      if (containerDef.flags) {
        containerDef.flags.forEach(f => (state.getInternalStateObject().flags[f] = true));
      }

      if (containerDef.resources) {
        const sentResourcesByLocations: Partial<
          Record<LOCATION_ENUM, Partial<Record<ResourceType, number>>>
        > = {};

        entries(containerDef.resources)
          .filter(([_resourceType, qty]) => qty && qty > 0)
          .forEach(([resourceType, qty]) => {
            const resourcesAmount = qty! * this.props.amount;
            const location: LOCATION_ENUM = resourceArrivalLocationResolution(state, resourceType);

            if (!sentResourcesByLocations[location]) {
              sentResourcesByLocations[location] = {};
            }
            sentResourcesByLocations[location]![resourceType] = resourcesAmount;

            ResourceState.addIncomingResources(state, resourceType, resourcesAmount, location);
          });

        keys(sentResourcesByLocations).forEach((location: LOCATION_ENUM) => {
          const greetingActors = getHighestAuthorityActorsByLocation(state, location);

          greetingActors.forEach((actorId: ActorId) => {
            getLocalEventManager().queueLocalEvent(
              new ResourceArrivalAnnouncementLocalEvent({
                parentEventId: this.props.parentEventId,
                simTimeStamp: this.props.simTimeStamp,
                recipientActor: actorId,
                resources: sentResourcesByLocations[location]!,
              })
            );
          });
        });
      }
    } else {
      // missing ambulance or helicopter park location
      // radio message to the user
      getLocalEventManager().queueLocalEvent(
        this.buildArrivalFailureRadioEvent(containerDef.type, state)
      );
      // TODO later : we might want to make the ressources arrive as soon as the park is defined
      // TODO if more than one container of a given type fails, do we want to aggregate the warning messages?
      // try again X minutes later
      getLocalEventManager().queueLocalEvent(
        new ResourcesArrivalLocalEvent({
          parentEventId: this.props.parentEventId,
          simTimeStamp: this.props.simTimeStamp + FailedRessourceArrivalDelay,
          containerDefId: this.props.containerDefId,
          amount: this.props.amount,
          squadName: this.props.squadName,
        })
      );
    }
  }

  private buildArrivalFailureRadioEvent(
    rtype: ResourceContainerType,
    state: MainSimulationState
  ): AddMessageLocalEvent {
    let parkKey = '';
    if (rtype === 'Ambulance') parkKey = 'location-ambulancePark';
    else if (rtype === 'Helicopter') parkKey = 'location-helicopterPark';
    else
      resourceLogger.warn('The ressources that are unable to arrive are ambulance and helicopter');
    const park = getTranslation('mainSim-locations', parkKey, false);
    const message = getTranslation('mainSim-locations', 'missingLocation', true, [
      park,
      this.props.squadName,
    ]);
    return new AddRadioMessageLocalEvent({
      parentEventId: this.props.parentEventId,
      simTimeStamp: state.getSimTime(),
      senderName: this.props.squadName,
      message,
      channel: RadioType.CASU,
      omitTranslation: true,
    });
  }
}

export class ResourceArrivalAnnouncementLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly recipientActor: ActorId;
      readonly resources: Partial<Record<ResourceType, number>>;
    }
  ) {
    super({ ...props, type: 'ResourceArrivalAnnouncementLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    getLocalEventManager().queueLocalEvent(
      new AddNotificationLocalEvent({
        parentEventId: this.props.parentEventId,
        simTimeStamp: state.getSimTime(),
        senderName: RadioLogic.getResourceAsSenderName(),
        recipientId: this.props.recipientActor,
        message: 'incoming-resources',
        messageValues: [
          ResourceLogic.formatResourceTypesAndNumber(this.props.resources).join(',<br/>'),
        ],
      })
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// RESOURCES
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class ReserveResourcesLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
      readonly actionId: ActionId;
    }
  ) {
    super({ ...props, type: 'ReserveResourcesLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.reserveResources(state, this.props.resourcesId, this.props.actionId);
  }
}

export class UnReserveResourcesLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
    }
  ) {
    super({ ...props, type: 'UnReserveResourcesLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.unReserveResources(state, this.props.resourcesId);
  }
}

abstract class MoveResourcesLocalEventBase extends LocalEventBase {
  constructor(
    private readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly type: string;
      readonly ownerUid: ActorId;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({ ...props });
  }

  abstract getInvolvedResources(state: MainSimulationState): Resource[];

  applyStateUpdate(state: MainSimulationState): void {
    if (!canMoveToLocation(state, 'Resources', this.props.targetLocation)) {
      resourceLogger.warn('The resources could not be moved as the target location is invalid');
      return;
    }

    const resources = this.getInvolvedResources(state);
    ResourceState.sendResourcesToLocation(resources, this.props.targetLocation);
  }
}

export class MoveResourcesLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly resourcesId: ResourceId[];
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({ ...extensionProps, type: 'MoveResourcesLocalEvent' });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return this.extensionProps.resourcesId.map(resourceId =>
      ResourceState.getResourceById(state, resourceId)
    );
  }
}

export class MoveFreeHumanResourcesByLocationLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly sourceLocation: LOCATION_ENUM;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({
      ...extensionProps,
      type: 'MoveFreeHumanResourcesByLocationLocalEvent',
    });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeHumanResourcesByLocation(state, this.extensionProps.sourceLocation);
  }
}

export class MoveFreeWaitingResourcesByTypeLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly resourceType: ResourceType;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({
      ...extensionProps,
      type: 'MoveFreeWaitingResourcesByTypeLocalEvent',
    });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeWaitingResourcesByType(state, this.extensionProps.resourceType);
  }
}

export class MoveResourcesAtArrivalLocationLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourcesIds: ResourceId[];
    }
  ) {
    super({ ...props, type: 'MoveResourcesAtArrivalLocationLocalEvent' });
  }

  override applyStateUpdate(state: MainSimulationState) {
    this.props.resourcesIds.forEach(resourceId => {
      const resource: Resource = ResourceState.getResourceById(state, resourceId);
      const location = ResourceLogic.resourceArrivalLocationResolution(state, resource.type);
      ResourceState.sendResourcesToLocation([resource], location);
    });
  }
}

export class AssignResourcesToTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
      readonly taskId: TaskId;
    }
  ) {
    super({ ...props, type: 'AssignResourcesToTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.props.resourcesId, this.props.taskId);
  }
}

export class AssignResourcesToWaitingTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
    }
  ) {
    super({ ...props, type: 'AssignResourcesToWaitingTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.props.resourcesId, getIdleTaskUid(state));
  }
}

export class ReleaseResourcesFromTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly taskId: TaskId;
    }
  ) {
    super({ ...props, type: 'ReleaseResourcesFromTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const involvedResources: Resource[] = ResourceState.getFreeResourcesByTask(
      state,
      this.props.taskId
    );
    const involvedResourcesId: ResourceId[] = involvedResources.map(
      (resource: Resource) => resource.Uid
    );
    const location: LOCATION_ENUM = TaskState.getTaskResponsibleActorSymbolicLocation(
      state,
      this.props.taskId
    );

    ResourceState.assignResourcesToTask(state, involvedResourcesId, getIdleTaskUid(state));
    ResourceState.sendResourcesToLocation(involvedResources, location);
  }
}

export class DeleteResourceLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly resourceId: ResourceId;
    }
  ) {
    super({ ...props, type: 'DeleteResourceLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.deleteResource(state, this.props.resourceId);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// TASKS
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class TaskStatusChangeLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly taskId: TaskId;
      readonly status: TaskStatus;
    }
  ) {
    super({ ...props, type: 'TaskStatusChangeLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    TaskState.changeTaskStatus(state, this.props.taskId, this.props.status);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// PATIENT
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class MovePatientLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly patientId: string;
      readonly location: PatientLocation;
    }
  ) {
    super({ ...props, type: 'MovePatientLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    changePatientLocation(state, this.props.patientId, this.props.location);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// HOSPITAL
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class HospitalRequestUpdateLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly senderId: ActorId | undefined;
      readonly hospitalRequestPayload: HospitalRequestPayload;
    }
  ) {
    super({ ...props, type: 'HospitalRequestUpdateLocalEvent' });
  }

  private formatHospitalResponse(message: HospitalRequestPayload): string {
    const hospitals = Object.values(getHospitalsByProximity(message.proximity));
    const units: PatientUnitId[] = getPatientUnitIdsSorted();

    let casuMessage = '';
    let qty = 0;
    for (const hospital of hospitals) {
      casuMessage += `${hospital.shortName}: \n`;

      for (const unitId of units) {
        qty = hospital.units[unitId] ?? 0;
        if (qty > 0) {
          casuMessage += `${qty} ${I18n.translate(getPatientUnitById(unitId).name)} \n`;
        }
      }

      casuMessage += '\n';
    }
    return casuMessage;
  }

  applyStateUpdate(state: MainSimulationState): void {
    updateHospitalProximityRequest(state, this.props.hospitalRequestPayload.proximity);
    const evt = new AddRadioMessageLocalEvent({
      parentEventId: this.props.parentEventId,
      simTimeStamp: this.props.simTimeStamp,
      senderId: getCasuActorId(),
      recipientId: this.props.senderId,
      message: this.formatHospitalResponse(this.props.hospitalRequestPayload),
      channel: RadioType.CASU,
      omitTranslation: true,
    });
    getLocalEventManager().queueLocalEvent(evt);
  }
}

/*
Pretriage Report calculations and radio response
*/
export class PretriageReportResponseLocalEvent extends LocalEventBase {
  private channel: RadioType = RadioType.RESOURCES;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly senderName: string;
      readonly recipient: number;
      readonly pretriageLocation: LOCATION_ENUM;
      readonly feedbackWhenReport: TranslationKey;
    }
  ) {
    super({ ...props, type: 'PretriageReportResponseLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const taskStatus: TaskStatus = getTaskCurrentStatus(
      state,
      getTaskByTypeAndLocation(state, TaskType.Pretriage, this.props.pretriageLocation).Uid
    );

    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.props.parentEventId,
        simTimeStamp: this.props.simTimeStamp,
        senderName: this.props.senderName,
        recipientId: this.props.recipient,
        message:
          taskStatus === 'Uninitialized'
            ? getTranslation('mainSim-actions-tasks', 'pretriage-task-notStarted', true, [
                getTranslation('mainSim-locations', 'location-' + this.props.pretriageLocation),
              ])
            : formatStandardPretriageReport(
                state,
                this.props.pretriageLocation,
                this.props.feedbackWhenReport,
                false,
                true
              ),
        channel: this.channel,
        omitTranslation: true,
      })
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// ACTIVABLE
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Change the active status of an activable
 */
export class ChangeActivableStatusLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly parentTriggerId?: Uid;
      readonly simTimeStamp: SimTime;
      readonly target: Uid;
      readonly option: ActivationOperator;
    }
  ) {
    super({ ...props, type: 'PlanActionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const target: Activable | undefined = so.activables[this.props.target];
    if (target != undefined) {
      if (this.props.option === 'activate') {
        target.active = true;
      } else if (this.props.option === 'deactivate') {
        target.active = false;
      } else {
        activableLogger.error('Unhandled option for changing an activable status', this.props);
      }
    } else {
      activableLogger.error('Could not find activable', this.props);
    }
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// GAME OPTIONS
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class GameOptionsUpdateLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly simTimeStamp: SimTime;
      readonly options: GameOptions;
    }
  ) {
    super({ ...props, type: 'GameOptionsUpdateLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.getInternalStateObjectUnsafe().gameOptions = this.props.options;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * This local event is to be emitted and evaluated right after the creation of an evaluation context
 */
export class T0TriggerEvaluationLocalEvent extends LocalEventBase {
  constructor() {
    super({
      type: 'T0TriggerEvaluationLocalEvent',
      parentEventId: 0,
      simTimeStamp: 0,
      parentTriggerId: 'T0 initial trigger evaluation',
    });
  }

  applyStateUpdate(state: MainSimulationState): void {
    if (state.getLastEventId() === 0) {
      getLocalEventManager().queueLocalEvents(evaluateAllTriggers(state));
    } else {
      mainSimLogger.warn(
        'Ignoring the T0 trigger evaluation event. It is only applied on the initial state',
        state.getLastEventId()
      );
    }
  }
}
