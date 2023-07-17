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


  abstract updateState(state: MainSimulationState): void;
}



export interface LocalEvent {
  type: string;
  ParentEventId: string;
  simTimeStamp: SimTime
}