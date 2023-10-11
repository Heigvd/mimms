import { HumanBody } from "../../../HUMAn/human";
import { getTranslation } from "../../../tools/translation";
import { getEnv } from "../../../tools/WegasHelper";
import { ActionBase, OnTheRoadgAction } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, GlobalEventId, SimTime, TaskId, TemplateId, TranslationKey } from "../baseTypes";
import { TimeSliceDuration } from "../constants";
import { MapFeature } from "../events/defineMapObjectEvent";
import { computeNewPatientsState } from "../patients/handleState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as PatientState from "../simulationState/patientStateAccess";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";
import { TaskStatus } from "../tasks/taskBase";
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';

export type EventStatus = 'Pending' | 'Processed' | 'Cancelled' | 'Erroneous'

export interface LocalEvent {
  type: string;
  parentEventId: GlobalEventId;
  simTimeStamp: SimTime
}

export abstract class LocalEventBase implements LocalEvent{

  private static eventCounter = 0;

  /**
   * Used for ordering
   */
  public readonly eventNumber: number;

  protected constructor(
    readonly parentEventId: GlobalEventId, 
    readonly type: string, 
    readonly simTimeStamp: number){
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
 * @returns true if e1 precedes e2
 */
export function compareLocalEvents(e1 : LocalEventBase, e2: LocalEventBase): boolean {
  if(e1.simTimeStamp === e2.simTimeStamp){
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

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly action: ActionBase){
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

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly templateId: TemplateId, readonly actorUid: ActorId, readonly planTime: SimTime){
    super(parentEventId, 'CancelActionEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
      const so = state.getInternalStateObject();

      const action = so.actions.find(a => a.getTemplateId() === this.templateId && a.ownerId === this.actorUid);

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
// TODO dynamic time progression (continue advancing until something relevant happens)
export class TimeForwardLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly timeJump: number){
    super(parentEventId, 'TimeForwardEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.incrementSimulationTime(this.timeJump);
    const so = state.getInternalStateObject();

    // update patients
    this.updatePatients(so.patients, this.timeJump);

    // update all actions =>
    this.updateActions(state);

    // update all tasks
    this.updateTasks(state);
  }

  updatePatients(patients: Readonly<HumanBody[]>, timeJump: number) {
    computeNewPatientsState(patients as HumanBody[], timeJump, getEnv());
  }

  updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  updateTasks(state: MainSimulationState) {
    TaskState.getAllTasks(state).forEach(t => t.update(state));
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// map items
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/////////// TODO in own file
export class AddMapItemLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly feature: MapFeature){
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.push(this.feature);
  }

}

export class RemoveMapItemLocalEvent extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly feature: MapFeature) {
		super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const so = state.getInternalStateObject();
		so.mapLocations.splice(so.mapLocations.findIndex(f => f.name === this.feature.name && f.ownerId === this.feature.ownerId), 1);
	}
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// actors
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------


export class AddActorLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime){
    super(parentEventId, 'AddActorLocalEvent', timeStamp);
  }

  // TODO create actor from parameters
  applyStateUpdate(state: MainSimulationState): void {
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "ACS" ) == undefined) {
      const acs = new Actor('ACS', 'actor-acs', 'actor-acs-long');
      state.getInternalStateObject().actors.push(acs);
      const acsAction = new OnTheRoadAction(state.getSimTime(), TimeSliceDuration * 3, 'methane-acs-arrived', 'on-the-road', 0, acs.Uid, 0);
      state.getInternalStateObject().actions.push(acsAction);
    }
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "MCS" ) == undefined) {
      const mcs = new Actor('MCS', 'actor-mcs', 'actor-mcs-long');
      state.getInternalStateObject().actors.push(mcs);
      const mcsAction = new OnTheRoadAction(state.getSimTime(), TimeSliceDuration * 3, 'methane-mcs-arrived', 'on-the-road', 0, mcs.Uid, 0);
      state.getInternalStateObject().actions.push(mcsAction);
    }
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class AddRadioMessageLocalEvent extends LocalEventBase {

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId, 
    public readonly emitter: TranslationKey,
    public readonly message: TranslationKey)
  {
      super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
	
    state.getInternalStateObject().radioMessages.push({
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp,
      emitter: this.emitter,
      message: getTranslation('mainSim-actions-tasks', this.message),
    })
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// tasks and resources
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Local event to transfer resources from an actor to another
 */
export class TransferResourcesLocalEvent extends LocalEventBase {
  constructor(parentId: GlobalEventId,
              timeStamp: SimTime,
              public readonly senderActor: ActorId,
              public readonly receiverActor: ActorId,
              public readonly sentResources: ResourceTypeAndNumber[],
  ) {
    super(parentId, 'TransferResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.transferResourcesBetweenActors(state, this.senderActor, this.receiverActor, this.sentResources);
  }
}

/**
 * Local event to receive new resources for an actor.
 */
export class IncomingResourcesLocalEvent extends LocalEventBase {

  constructor(parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly actorId: ActorId,
    public readonly resourceType: ResourceType,
    public readonly nb: number) {
      super(parentId, 'IncomingResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.addIncomingResourcesToActor(state, this.actorId, this.resourceType, this.nb);
  }

}

/**
 * Local event to allocate resources to a task.
 */
export class ResourcesAllocationLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly actorId: ActorId,
    readonly resourceType: ResourceType,
    readonly nb: number) {
    super(parentEventId, 'ResourcesAllocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.allocateResourcesToTask(state, this.taskId, this.actorId, this.resourceType, this.nb);
  }

}

/**
 * Local event to release (deallocate) resources from a task.
 */
export class ResourcesReleaseLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly actorId: ActorId,
    readonly resourceType: ResourceType,
    readonly nb: number) {
    super(parentEventId, 'ResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.releaseResourcesFromTask(state, this.taskId, this.actorId, this.resourceType, this.nb);
  }

}

export class AllResourcesReleaseLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId) {
    super(parentEventId, 'AllResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.releaseAllResourcesFromTask(state, this.taskId);
  }

}

export class TaskStatusChangeLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly status: TaskStatus) {
      super(parentEventId, 'TaskStatusChangeLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    TaskState.changeTaskStatus(state, this.taskId, this.status);
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// patients
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class CategorizePatientLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly zone: string) {
    super(parentEventId, 'CategorizePatientLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    PatientState.categorizeOnePatient(state, this.zone)
  }

}
