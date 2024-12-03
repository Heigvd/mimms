import { registerOpenSelectedActorPanelAfterMove } from '../../../gameInterface/afterUpdateCallbacks';
import { getEnv } from '../../../tools/WegasHelper';
import { entries, keys } from '../../../tools/helper';
import { mainSimLogger, resourceLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { ActionType } from '../actionType';
import { ActionBase, OnTheRoadAction } from '../actions/actionBase';
import { Actor, InterventionRole } from '../actors/actor';
import { getHighestAuthorityActorsByLocation } from '../actors/actorLogic';
import {
  ActionId,
  ActorId,
  GlobalEventId,
  ResourceContainerDefinitionId,
  ResourceId,
  SimDuration,
  SimTime,
  TaskId,
  TemplateId,
  TranslationKey,
} from '../baseTypes';
import { FailedRessourceArrivalDelay, TimeSliceDuration } from '../constants';
import { getHospitalsByProximity } from '../evacuation/hospitalController';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../events/casuMessageEvent';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import { computeNewPatientsState } from '../patients/handleState';
import { formatStandardPretriageReport } from '../patients/pretriageUtils';
import { getContainerDef, resolveResourceRequest } from '../resources/emergencyDepartment';
import { Resource } from '../resources/resource';
import { ResourceContainerType } from '../resources/resourceContainer';
import * as ResourceLogic from '../resources/resourceLogic';
import { resourceArrivalLocationResolution } from '../resources/resourceLogic';
import { ResourceType } from '../resources/resourceType';
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
import { localEventManager } from './localEventManager';

export interface LocalEvent {
  type: string;
  parentEventId: GlobalEventId;
  simTimeStamp: SimTime;
  priority: number;
}

export abstract class LocalEventBase implements LocalEvent {
  private static eventCounter = 0;

  /**
   * Used for ordering
   */
  public readonly eventNumber: number;

  protected constructor(
    readonly parentEventId: GlobalEventId,
    readonly type: string,
    readonly simTimeStamp: number,
    readonly priority: number = 0
  ) {
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
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly action: ActionBase) {
    super(parentEventId, 'PlanActionLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.actions.push(this.action);
    // init action
    this.action.update(state);
  }
}

// Update status of action
export class CancelActionLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly templateId: TemplateId,
    readonly actorUid: ActorId,
    readonly planTime: SimTime
  ) {
    super(parentEventId, 'CancelActionLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const now = state.getSimTime();
    const action = so.actions.find(
      a =>
        a.getTemplateId() === this.templateId && a.ownerId === this.actorUid && a.startTime == now
    );

    if (action && action.startTime === this.planTime) {
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
    parentEventId: GlobalEventId,
    type: string,
    readonly actors: ActorId[],
    timeStamp: SimTime,
    override priority: number = 1
  ) {
    super(parentEventId, type, timeStamp, priority);
  }

  protected updateCurrentTimeFrame(state: MainSimulationState, modifier: number) {
    updateCurrentTimeFrame(state, this.actors, modifier, this.simTimeStamp);
  }
}

/**
 * When applied to state, bumps the readiness of the provided actors.
 * If all actors are ready, time forwards
 */
export class TimeForwardLocalEvent extends TimeForwardLocalBaseEvent {
  constructor(
    parentEventId: GlobalEventId,
    readonly timeStamp: SimTime,
    actors: ActorId[],
    readonly timeJump: number
  ) {
    super(parentEventId, 'TimeForwardLocalEvent', actors, timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    this.updateCurrentTimeFrame(state, 1);
    if (isTimeForwardReady(state)) {
      state.incrementSimulationTime(this.timeJump);

      // update patients
      this.updatePatients(state, this.timeJump);

      // update all actions
      this.updateActions(state);

      // update all tasks
      this.updateTasks(state);

      registerOpenSelectedActorPanelAfterMove();

      state.updateForwardTimeFrame();

      // auto-continue if all actors are still awaiting
      if (isTimeForwardReady(state)) {
        const tfw = new TimeForwardLocalEvent(
          this.parentEventId,
          state.getSimTime(),
          [],
          TimeSliceDuration
        );
        localEventManager.queueLocalEvent(tfw);
      }
    }
  }

  private updatePatients(state: MainSimulationState, timeJump: number) {
    const patients = state.getInternalStateObject().patients;
    computeNewPatientsState(patients, timeJump, getEnv());
  }

  private updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  private updateTasks(state: MainSimulationState) {
    TaskState.getAllTasks(state).forEach(t => t.update(state, this.timeJump));
  }
}

/**
 * When applied, bumps down being readiness for a time forward for the provided actors
 */
export class TimeForwardCancelLocalEvent extends TimeForwardLocalBaseEvent {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, actors: ActorId[]) {
    super(parentEventId, 'TimeForwardCancelLocalEvent', actors, timeStamp);
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
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly fixedMapEntity: FixedMapEntity
  ) {
    super(parentEventId, 'AddFixedEntityLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.push(this.fixedMapEntity);
  }
}

export class RemoveFixedEntityLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly fixedMapEntity: FixedMapEntity
  ) {
    super(parentEventId, 'RemoveFixedEntityLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.splice(
      so.mapLocations.findIndex(
        f => f.id === this.fixedMapEntity.id && f.ownerId === this.fixedMapEntity.ownerId
      ),
      1
    );
  }
}

export class CompleteBuildingFixedEntityLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly fixedMapEntity: FixedMapEntity
  ) {
    super(parentEventId, 'CompleteBuildingFixedEntityLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations
      .filter(mapEntity => mapEntity.id === this.fixedMapEntity.id)
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
   * @param parentEventId
   * @param timeStamp
   * @param role spawned role
   * @param location if undefined automatically resolved
   * @param travelTime if 0 no travel time, if greater, a travel action is planned
   */
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    private role: InterventionRole,
    private location: LOCATION_ENUM | undefined = undefined,
    private travelTime: SimDuration = 0
  ) {
    super(parentEventId, 'AddActorLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const actor = new Actor(this.role);
    const loc = this.location || actor.getComputedSymbolicLocation(state);
    actor.setLocation(loc);
    state.getInternalStateObject().actors.push(actor);

    if (this.travelTime > 0) {
      actor.setLocation(LOCATION_ENUM.remote);
      const now = state.getSimTime();
      const travelAction = new OnTheRoadAction(
        now,
        this.travelTime,
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
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly actorUid: ActorId,
    readonly location: LOCATION_ENUM
  ) {
    super(parentEventId, 'MoveActorLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    if (!canMoveToLocation(state, 'Actors', this.location)) {
      mainSimLogger.warn('The actor could not be moved as the target location is invalid');
    } else {
      so.actors.filter(a => a.Uid === this.actorUid).forEach(a => (a.Location = this.location));
    }
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class AddRadioMessageLocalEvent extends LocalEventBase {
  private static RadioIdProvider = 1;

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId,
    public readonly emitter: TranslationKey,
    public readonly message: TranslationKey,
    public readonly channel: ActionType | undefined = undefined,
    public readonly isRadioMessage: boolean = false,
    private readonly omitTranslation: boolean = false,
    private readonly messageValues: (string | number)[] = []
  ) {
    super(parentId, 'AddRadioMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const msg = this.omitTranslation
      ? this.message
      : getTranslation('mainSim-actions-tasks', this.message, undefined, this.messageValues);

    state.getInternalStateObject().radioMessages.push({
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp,
      emitter: this.emitter,
      message: msg,
      uid: AddRadioMessageLocalEvent.RadioIdProvider++,
      isRadioMessage: this.isRadioMessage,
      channel: this.channel,
      pending: false,
    });
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
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    private actorUid: ActorId,
    private request: CasuMessagePayload
  ) {
    super(parentEventId, 'ResourceRequestResolutionLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    // check that the payload subtypes to MethaneMessagePayload
    if (this.request.messageType !== 'R' && this.request.resourceRequest) {
      resolveResourceRequest(
        state,
        this.parentEventId,
        this.actorUid,
        this.request.resourceRequest
      );
    }
  }
}

export class AutoSendACSMCSLocalEvent extends ResourceRequestResolutionLocalEvent {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, actorUid: ActorId) {
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
    super(parentEventId, timeStamp, actorUid, casuMessage);
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
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly actorId: ActorId,
    public readonly departureTime: SimTime,
    public readonly travelTime: SimDuration,
    public readonly containerDefId: ResourceContainerDefinitionId,
    public readonly amount: number,
    public readonly configName: string
  ) {
    super(parentId, 'ResourceMobilizationEvent', timeStamp);
  }

  override applyStateUpdate(_state: MainSimulationState): void {
    const containerDef = getContainerDef(this.containerDefId);
    // We assume that containers are well configured
    // and thus that there are no duplicates

    // actors are created right away (they need to appear in the timeline)
    // Note : Actor creation ignores the "amount" value
    containerDef.roles.forEach(role => {
      const evt = new AddActorLocalEvent(
        this.parentEventId,
        this.departureTime,
        role,
        undefined,
        this.travelTime
      );
      localEventManager.queueLocalEvent(evt);
    });

    if (
      Object.keys(containerDef.resources).length > 0 ||
      Object.keys(containerDef.flags).length > 0
    ) {
      // schedule resource arrival event
      const evt = new ResourcesArrivalLocalEvent(
        this.parentEventId,
        this.departureTime + this.travelTime,
        this.containerDefId,
        this.amount,
        this.configName
      );
      localEventManager.queueLocalEvent(evt);
    }
  }
}

/**
 * Resources arrival on site
 * Resources are assigned to the highest hierarchy level present by default
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly containerDefId: ResourceContainerDefinitionId,
    public readonly amount: number,
    public readonly squadName: string
  ) {
    super(parentId, 'ResourcesArrivalLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const containerDef = getContainerDef(this.containerDefId);

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
            const resourcesAmount = qty! * this.amount;
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
            localEventManager.queueLocalEvent(
              new ResourceArrivalAnnouncementLocalEvent(
                this.parentEventId,
                this.simTimeStamp,
                actorId,
                sentResourcesByLocations[location]!
              )
            );
          });
        });
      }
    } else {
      // missing ambulance or helicopter park location
      // radio message to the user
      localEventManager.queueLocalEvent(
        this.buildArrivalFailureRadioEvent(containerDef.type, state)
      );
      // TODO later : we might want to make the ressources arrive as soon as the park is defined
      // TODO if more than one container of a given type fails, do we want to aggregate the warning messages?
      // try again X minutes later
      localEventManager.queueLocalEvent(
        new ResourcesArrivalLocalEvent(
          this.parentEventId,
          this.simTimeStamp + FailedRessourceArrivalDelay,
          this.containerDefId,
          this.amount,
          this.squadName
        )
      );
    }
  }

  private buildArrivalFailureRadioEvent(
    rtype: ResourceContainerType,
    state: MainSimulationState
  ): AddRadioMessageLocalEvent {
    let parkKey = '';
    if (rtype === 'Ambulance') parkKey = 'location-ambulancePark';
    else if (rtype === 'Helicopter') parkKey = 'location-helicopterPark';
    else
      resourceLogger.warn('The ressources that are unable to arrive are ambulance and helicopter');
    const park = getTranslation('mainSim-locations', parkKey, false);
    const message = getTranslation('mainSim-locations', 'missingLocation', true, [
      park,
      this.squadName,
    ]);
    return new AddRadioMessageLocalEvent(
      this.parentEventId,
      state.getSimTime(),
      0,
      this.squadName,
      message,
      ActionType.CASU_RADIO,
      true,
      true
    );
  }
}

export class ResourceArrivalAnnouncementLocalEvent extends LocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    readonly recipientActor: ActorId,
    readonly resources: Partial<Record<ResourceType, number>>
  ) {
    super(parentId, 'ResourceArrivalAnnouncementLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.parentEventId,
        state.getSimTime(),
        this.recipientActor,
        'resources',
        'incoming-resources',
        undefined,
        false,
        false,
        [ResourceLogic.formatResourceTypesAndNumber(this.resources).join(',<br/>')]
      )
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
    parentId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourcesId: ResourceId[],
    readonly actionId: ActionId
  ) {
    super(parentId, 'ReserveResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.reserveResources(state, this.resourcesId, this.actionId);
  }
}

export class UnReserveResourcesLocalEvent extends LocalEventBase {
  constructor(parentId: GlobalEventId, timeStamp: SimTime, readonly resourcesId: ResourceId[]) {
    super(parentId, 'UnReserveResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.unReserveResources(state, this.resourcesId);
  }
}

abstract class MoveResourcesLocalEventBase extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    type: string,
    timeStamp: SimTime,
    readonly ownerUid: ActorId,
    readonly targetLocation: LOCATION_ENUM
  ) {
    super(parentEventId, type, timeStamp);
  }

  abstract getInvolvedResources(state: MainSimulationState): Resource[];

  applyStateUpdate(state: MainSimulationState): void {
    if (!canMoveToLocation(state, 'Resources', this.targetLocation)) {
      resourceLogger.warn('The resources could not be moved as the target location is invalid');
      return;
    }

    const resources = this.getInvolvedResources(state);
    ResourceState.sendResourcesToLocation(resources, this.targetLocation);
  }
}

export class MoveResourcesLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    ownerUid: ActorId,
    readonly resourcesId: ResourceId[],
    targetLocation: LOCATION_ENUM
  ) {
    super(parentEventId, 'MoveResourcesLocalEvent', timeStamp, ownerUid, targetLocation);
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return this.resourcesId.map(resourceId => ResourceState.getResourceById(state, resourceId));
  }
}

export class MoveFreeHumanResourcesByLocationLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    ownerUid: ActorId,
    readonly sourceLocation: LOCATION_ENUM,
    targetLocation: LOCATION_ENUM
  ) {
    super(
      parentId,
      'MoveFreeHumanResourcesByLocationLocalEvent',
      timeStamp,
      ownerUid,
      targetLocation
    );
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeHumanResourcesByLocation(state, this.sourceLocation);
  }
}

export class MoveFreeWaitingResourcesByTypeLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    ownerUid: ActorId,
    readonly resourceType: ResourceType,
    targetLocation: LOCATION_ENUM
  ) {
    super(
      parentId,
      'MoveFreeWaitingResourcesByTypeLocalEvent',
      timeStamp,
      ownerUid,
      targetLocation
    );
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeWaitingResourcesByType(state, this.resourceType);
  }
}

export class MoveResourcesAtArrivalLocationLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourcesIds: ResourceId[]
  ) {
    super(parentEventId, 'MoveResourcesAtArrivalLocationLocalEvent', timeStamp);
  }

  override applyStateUpdate(state: MainSimulationState) {
    this.resourcesIds.forEach(resourceId => {
      const resource: Resource = ResourceState.getResourceById(state, resourceId);
      const location = ResourceLogic.resourceArrivalLocationResolution(state, resource.type);
      ResourceState.sendResourcesToLocation([resource], location);
    });
  }
}

export class AssignResourcesToTaskLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourcesId: ResourceId[],
    readonly taskId: TaskId
  ) {
    super(parentEventId, 'AssignResourcesToTaskLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.resourcesId, this.taskId);
  }
}

export class AssignResourcesToWaitingTaskLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourcesId: ResourceId[]
  ) {
    super(parentEventId, 'AssignResourcesToWaitingTaskLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.resourcesId, getIdleTaskUid(state));
  }
}

export class ReleaseResourcesFromTaskLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly taskId: TaskId) {
    super(parentEventId, 'ReleaseResourcesFromTaskLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const involvedResources: Resource[] = ResourceState.getFreeResourcesByTask(state, this.taskId);
    const involvedResourcesId: ResourceId[] = involvedResources.map(
      (resource: Resource) => resource.Uid
    );
    const location: LOCATION_ENUM = TaskState.getTaskResponsibleActorSymbolicLocation(
      state,
      this.taskId
    );

    ResourceState.assignResourcesToTask(state, involvedResourcesId, getIdleTaskUid(state));
    ResourceState.sendResourcesToLocation(involvedResources, location);
  }
}

export class DeleteResourceLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly resourceId: ResourceId) {
    super(parentEventId, 'DeleteResourceLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.deleteResource(state, this.resourceId);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// TASKS
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class TaskStatusChangeLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly status: TaskStatus
  ) {
    super(parentEventId, 'TaskStatusChangeLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    TaskState.changeTaskStatus(state, this.taskId, this.status);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// PATIENT
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class MovePatientLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly patientId: string,
    readonly location: PatientLocation
  ) {
    super(parentEventId, 'MovePatientLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    changePatientLocation(state, this.patientId, this.location);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// HOSPITAL
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class HospitalRequestUpdateLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    private readonly senderId: ActorId,
    private readonly hospitalRequestPayload: HospitalRequestPayload
  ) {
    super(parentEventId, 'HospitalRequestUpdateLocalEvent', timeStamp);
  }

  private formatHospitalResponse(message: HospitalRequestPayload): string {
    const hospitals = getHospitalsByProximity(message.proximity);

    let casuMessage = '';
    for (const hospital of hospitals) {
      casuMessage += `${hospital.shortName}: \n`;
      for (const unit of hospital.units) {
        casuMessage += `${unit.availableCapacity}: ${unit.placeType.typology} \n`;
      }
      casuMessage += '\n';
    }
    return casuMessage;
  }

  applyStateUpdate(state: MainSimulationState): void {
    updateHospitalProximityRequest(state, this.hospitalRequestPayload.proximity);
    const evt = new AddRadioMessageLocalEvent(
      this.parentEventId,
      this.simTimeStamp,
      this.senderId,
      'CASU',
      this.formatHospitalResponse(this.hospitalRequestPayload),
      ActionType.CASU_RADIO,
      true,
      true
    );
    localEventManager.queueLocalEvent(evt);
  }
}

/*
Pretriage Report calculations and radio response
*/
export class PretriageReportResponseLocalEvent extends LocalEventBase {
  private channel = ActionType.RESOURCES_RADIO;

  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    private readonly senderId: string,
    private readonly recipient: number,
    private pretriageLocation: LOCATION_ENUM,
    private feedbackWhenReport: TranslationKey
  ) {
    super(parentEventId, 'PretriageReportResponseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const taskStatus: TaskStatus = getTaskCurrentStatus(
      state,
      getTaskByTypeAndLocation(state, TaskType.Pretriage, this.pretriageLocation).Uid
    );

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.parentEventId,
        this.simTimeStamp,
        this.recipient,
        this.senderId,
        taskStatus === 'Uninitialized'
          ? getTranslation('mainSim-actions-tasks', 'pretriage-task-notStarted', true, [
              getTranslation('mainSim-locations', 'location-' + this.pretriageLocation),
            ])
          : formatStandardPretriageReport(
              state,
              this.pretriageLocation,
              this.feedbackWhenReport,
              false,
              true
            ),
        this.channel,
        true,
        true
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
