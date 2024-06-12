import { getTranslation } from '../../../tools/translation';
import { getEnv } from '../../../tools/WegasHelper';
import { ActionBase, OnTheRoadAction } from '../actions/actionBase';
import { Actor, InterventionRole } from '../actors/actor';
import {
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
import { computeNewPatientsState } from '../patients/handleState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { changePatientLocation, PatientLocation } from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { TaskStatus } from '../tasks/taskBase';
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceContainerType } from '../resources/resourceContainer';
import { getContainerDef, resolveResourceRequest } from '../resources/emergencyDepartment';
import { localEventManager } from './localEventManager';
import { entries } from '../../../tools/helper';
import { CasuMessagePayload, HospitalRequestPayload } from '../events/casuMessageEvent';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ActionType } from '../actionType';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import { resourceArrivalResolution, resourceContainerCanArrive } from '../resources/resourceLogic';
import {
  deleteIdleResource,
  getUnoccupiedResources,
  sendResourcesToLocation,
} from '../simulationState/resourceStateAccess';
import { updateHospitalProximityRequest } from '../simulationState/hospitalState';
import { isTimeForwardReady, updateCurrentTimeFrame } from '../simulationState/timeState';
import { FailedRessourceArrivalDelay } from '../constants';
import { resourceLogger } from '../../../tools/logger';
import { getHospitalsByProximity } from '../evacuation/hospitalController';

export type EventStatus = 'Pending' | 'Processed' | 'Cancelled' | 'Erroneous';

export interface LocalEvent {
  type: string;
  parentEventId: GlobalEventId;
  simTimeStamp: SimTime;
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
    readonly simTimeStamp: number
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
 * if equal creation order (eventCounter) is used instead
 */
export function compareLocalEvents(e1: LocalEventBase, e2: LocalEventBase): boolean {
  if (e1.simTimeStamp === e2.simTimeStamp) {
    return e1.eventNumber < e2.eventNumber;
  }
  return e1.simTimeStamp < e2.simTimeStamp;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// TODO move in own file
// immutable
/**
 * Creates an action to be inserted in the timeline and inits it
 */
export class PlanActionLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly action: ActionBase) {
    super(parentEventId, 'PlanActionEvent', timeStamp);
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
    super(parentEventId, 'CancelActionEvent', timeStamp);
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

/////////// TODO in own file

export abstract class TimeForwardLocalBaseEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    type: string,
    readonly actors: ActorId[],
    timeStamp: SimTime
  ) {
    super(parentEventId, type, timeStamp);
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
    readonly parentEventId: GlobalEventId,
    readonly timeStamp: SimTime,
    readonly actors: ActorId[],
    readonly timeJump: number
  ) {
    super(parentEventId, 'TimeForwardEvent', actors, timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    this.updateCurrentTimeFrame(state, 1);
    if (isTimeForwardReady(state)) {
      // TODO dynamic time progression (continue advancing until something relevant happens)
      state.incrementSimulationTime(this.timeJump);

      // update patients
      this.updatePatients(state, this.timeJump);

      // update all actions
      this.updateActions(state);

      // update all tasks
      this.updateTasks(state);
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
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly actors: ActorId[]) {
    super(parentEventId, 'TimeForwardCancelEvent', actors, timeStamp);
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
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
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
    super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
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
    super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations
      .filter(mapEntity => mapEntity.id === this.fixedMapEntity.id)
      .map(mapEntity => (mapEntity.buildingStatus = BuildingStatus.ready));
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
    so.actors.filter(a => a.Uid === this.actorUid).map(a => (a.Location = this.location));
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
    private readonly omitTranslation: boolean = false
  ) {
    super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const msg = this.omitTranslation
      ? this.message
      : getTranslation('mainSim-actions-tasks', this.message);

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
// tasks and resources
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// /**
//  * Local event to transfer resources from a location to another
//  */
export class TransferResourcesToLocationLocalEvent extends LocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly sourceLocation: LOCATION_ENUM,
    public readonly targetLocation: LOCATION_ENUM,
    public readonly sentResources: ResourceTypeAndNumber,
    public sourceTaskId: TaskId
  ) {
    super(parentId, 'TransferResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.transferResourcesFromToLocation(
      state,
      this.sourceLocation,
      this.targetLocation,
      this.sentResources,
      this.sourceTaskId
    );
  }
}

export class MoveAllIdleResourcesToLocationLocalEvent extends LocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourceType: ResourceType,
    readonly targetLocation: LOCATION_ENUM
  ) {
    super(parentId, 'MoveAllResourcesToLocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const idleResources = getUnoccupiedResources(state, this.resourceType);
    ResourceState.sendResourcesToLocation(idleResources, this.targetLocation);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// EMERGENCY DEPARTMENT
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
        this.parentEventId,
        this.request.resourceRequest,
        this.actorUid,
        state
      );
    }
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

    // schedule messages when the emergency center has new ressources that are sent
    const dptEvt = new ResourcesDepartureLocalEvent(
      this.parentEventId,
      this.departureTime,
      this.actorId,
      this.containerDefId,
      this.travelTime,
      this.amount,
      this.configName
    );
    localEventManager.queueLocalEvent(dptEvt);

    if (
      Object.keys(containerDef.resources).length > 0 ||
      Object.keys(containerDef.flags).length > 0
    ) {
      // schedule resource arrival event
      // TODO forced actor binding if any ?? (typically if PMA leader comes with other guys ?)
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
 * Spawned when the emergency center has a resource available and sends it to the incident site
 */
export class ResourcesDepartureLocalEvent extends LocalEventBase {
  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly senderId: ActorId,
    public readonly containerDef: ResourceContainerDefinitionId,
    public readonly travelTime: SimDuration,
    public readonly amount: number,
    public readonly configName: string
  ) {
    super(parentId, 'ResourcesDepartureLocalEvent', timeStamp);
  }

  override applyStateUpdate(_state: MainSimulationState): void {
    const t = Math.round(this.travelTime / 60);
    const msg = this.buildRadioText(t);
    const evt = new AddRadioMessageLocalEvent(
      this.parentEventId,
      this.simTimeStamp,
      this.senderId,
      'CASU',
      msg,
      ActionType.CASU_RADIO,
      true,
      true
    );
    localEventManager.queueLocalEvent(evt);
  }

  private buildRadioText(time: number): string {
    const c = getContainerDef(this.containerDef);
    const parts: string[] = [];
    parts.push(getTranslation('mainSim-resources', 'sending'));
    //parts.push(this.amount + '');
    parts.push(this.configName); // Specific name (e.g. AMB002)
    parts.push('(' + getTranslation('mainSim-resources', c.name) + ')'); // type
    parts.push(getTranslation('mainSim-resources', 'arrival-in', false));
    parts.push(time + '');
    parts.push(getTranslation('mainSim-resources', 'minutes', false));
    return parts.join(' ');
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

    if (resourceContainerCanArrive(state, containerDef.type)) {
      // add flags to state if any
      if (containerDef.flags) {
        containerDef.flags.forEach(f => (state.getInternalStateObject().flags[f] = true));
      }

      entries(containerDef.resources)
        .filter(([_, qt]) => qt && qt > 0)
        .forEach(([rType, qty]) => {
          const n = qty! * this.amount;
          ResourceState.addIncomingResourcesToLocation(
            state,
            rType,
            resourceArrivalResolution(state, rType),
            n
          );
        });
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
    if (rtype === 'Ambulance') parkKey = 'location-ambulance-park';
    else if (rtype === 'Helicopter') parkKey = 'location-helicopter-park';
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// RESOURCE ASSIGNATION
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Local event to allocate resources to a task.
 */
export class ResourcesAllocationLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly sourceLocation: LOCATION_ENUM,
    readonly resourceType: ResourceType,
    readonly nb: number
  ) {
    super(parentEventId, 'ResourcesAllocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.allocateResourcesToTask(
      state,
      this.taskId,
      this.sourceLocation,
      this.resourceType,
      this.nb
    );
  }
}

export class ResourceAllocationLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourceId: ResourceId,
    readonly taskId: TaskId
  ) {
    super(parentEventId, 'ResourceAllocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.allocateResourceToTask(state, this.resourceId, this.taskId);
  }
}

export class AllResourcesReleaseLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly taskId: TaskId) {
    super(parentEventId, 'AllResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.releaseAllResourcesFromTask(state, this.taskId);
  }
}

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

export class MoveResourcesLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly resourcesUids: ResourceId[],
    readonly location: LOCATION_ENUM
  ) {
    super(parentEventId, 'MoveResourcesLocalEvent', timeStamp);
  }

  override applyStateUpdate(state: MainSimulationState) {
    this.resourcesUids.forEach(resourceId => {
      const resource = state.getInternalStateObject().resources.find(res => res.Uid === resourceId);
      if (resource != undefined) {
        sendResourcesToLocation([resource], this.location);
      }
    });
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
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

export class DeleteIdleResourceLocalEvent extends LocalEventBase {
  constructor(
    parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly location: LOCATION_ENUM,
    readonly resourceType: ResourceType
  ) {
    super(parentEventId, 'AllResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    deleteIdleResource(state, this.location, this.resourceType);
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
      'CASU',
      this.senderId,
      this.formatHospitalResponse(this.hospitalRequestPayload),
      ActionType.CASU_RADIO,
      true,
      true
    );
    localEventManager.queueLocalEvent(evt);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
