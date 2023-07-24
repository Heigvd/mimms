import { SimTime } from "../baseTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";

export type EventStatus = 'Pending' | 'Processed' | 'Cancelled' | 'Erroneous'

export abstract class LocalEventBase implements LocalEvent{

  public type: string;

  public readonly ParentEventId : string;

  public readonly simTimeStamp: SimTime;

  protected constructor(parentEventId: string, type: string, simTimeStamp: number){
    this.ParentEventId = parentEventId;
    this.type = type;
    this.simTimeStamp = simTimeStamp;
  }

  /**
   * 
   * @param state In this function, state changes are allowed
   */
  abstract applyStateUpdate(state: MainSimulationState): void;
}



export interface LocalEvent {
  type: string;
  ParentEventId: string;
  simTimeStamp: SimTime
}

// TODO move in own file
// should be immutable
/**
 * Creates an action that will be inserted in the timeline
 */
export class PlanActionEvent extends LocalEventBase {
  
  
  constructor(){
    super();

  }

  applyStateUpdate(state: MainSimulationState): void {
    state.
  }

}

/////////// TODO in own file

export class TimeForwardEvent extends LocalEventBase {

  applyStateUpdate(state: MainSimulationState): void {
    // set new time
    // update patients
    // update all actions => 
    // update all tasks
  }

}