import { HumanBody } from "../../../HUMAn/human";
import { ActionBase } from "../actions/actionBase";
import { GlobalEventId, SimTime } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
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
    // TODO update all tasks
  }

  updatePatients(patients: Readonly<HumanBody[]>, currentTime: SimTime) {
    //TODO
  }

  updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
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