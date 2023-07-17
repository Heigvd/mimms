import { HumanBody } from "../../../HUMAn/human";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { LocalEvent } from "../localEvents/localEventBase";
import { TaskBase } from "../tasks/taskBase";


export class MainSimulationState {

  /**
   * Immutable state
   */
  private readonly internalState: MainStateObject;
  /**
   * Simulated time in seconds
   */
  public readonly simulationTimeSec : number;

  public readonly stateCount;

  private static stateCounter = 0;

  public constructor(state : MainStateObject, simTime: number){
    this.internalState = state;
    this.simulationTimeSec = simTime;
    MainSimulationState.stateCounter++;
    this.stateCount = MainSimulationState.stateCounter;
  }

  public static applyEvent(event: LocalEvent, currentState : MainSimulationState): MainSimulationState {
    
    const clone = {...currentState.internalState};
    // TODO apply state changes event changes

    return new MainSimulationState(clone, currentState.simulationTimeSec);
  }

}

interface MainStateObject {
  actions: ActionBase[];
  tasks: TaskBase[]; // TODO
  mapElements: any;
  patients: HumanBody[];
  actors : Actor[];
  
}