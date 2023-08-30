import { HumanBody } from "../../../HUMAn/human";
import { ActionBase, OnTheRoadgAction } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, GlobalEventId, SimTime, TaskId, TranslationKey } from "../baseTypes";
import { TimeSliceDuration } from "../constants";
import { MapFeature } from "../events/defineMapObjectEvent";
import { ResourceType } from "../resources/resourcePool";
import { MainSimulationState } from "../simulationState/mainSimulationState";

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

/////////// TODO in own file
// TODO dynamic time progression (continue advancing until something relevant happens)
export class TimeForwardLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly timeJump: number){
    super(parentEventId, 'TimeForwardEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.incrementSimulationTime(this.timeJump);
    const so = state.getInternalStateObject();

    // TODO update patients
    this.updatePatients(so.patients, state.getSimTime());

    // update all actions =>
    this.updateActions(state);

    // update all tasks
    this.updateTasks(state);
  }

  updatePatients(patients: Readonly<HumanBody[]>, currentTime: SimTime) {
    //TODO
  }

  updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  updateTasks(state: MainSimulationState) {
    state.getAllTasks().forEach(t => t.update(state));
  }

}

/////////// TODO in own file
export class AddMapItemLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly feature: MapFeature){
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
	wlog('-----PUSHING FEATURE------', this.feature)
    so.mapLocations.push(this.feature);
  }

}

export class AddActorLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime){
    super(parentEventId, 'AddActorLocalEvent', timeStamp);
  }

  // TODO !!! create actor from parameters
  applyStateUpdate(state: MainSimulationState): void {
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "ACS" ) == undefined) {
      const acs = new Actor('ACS', 'adasd', 'ACS');
      state.getInternalStateObject().actors.push(acs);
      const acsAction = new OnTheRoadgAction(state.getSimTime(), TimeSliceDuration * 3, 'message-key', 'on the road', 0, acs.Uid);
      state.getInternalStateObject().actions.push(acsAction);
    }
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "MCS" ) == undefined) {
      const mcs = new Actor('MCS', 'adasd', 'MCS');
      state.getInternalStateObject().actors.push(mcs);
      const mcsAction = new OnTheRoadgAction(state.getSimTime(), TimeSliceDuration * 3, 'message-key', 'on the road', 0, mcs.Uid);
      state.getInternalStateObject().actions.push(mcsAction);
    }
  }

}

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
      message: this.message,
    })
  }

}

/**
 * Change the nb of available resources.
 */
export class ChangeNbResourcesLocalEvent extends LocalEventBase {

  constructor(parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly actorId: ActorId,
    public readonly type: ResourceType,
    public readonly nb: number) {
      super(parentId, 'ChangeResourcesNbLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.addResources(this.actorId, this.type, this.nb);
  }

}

/**
 * Local event to change the nb of resources dedicated to a task
 */
export class TaskAllocationLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly nb: number) {
    super(parentEventId, 'TaskAllocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.changeTaskAllocation(this.taskId, this.nb);
  }

}

export class CategorizePatientLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly zone: string) {
    super(parentEventId, 'CategorizePatientLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.categorizeOnePatient(this.zone)
  }

}
