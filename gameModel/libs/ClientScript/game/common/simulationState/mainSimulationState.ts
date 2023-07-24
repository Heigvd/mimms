import { HumanBody } from "../../../HUMAn/human";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { IClonable } from "../interfaces";
import { LocalEventBase } from "../localEvents/localEventBase";
import { TaskBase } from "../tasks/taskBase";


export class MainSimulationState implements IClonable {

  private readonly internalState: MainStateObject;
  /**
   * Simulated time in seconds
   */
  public readonly simulationTimeSec : number;

  public readonly stateCount;

  public readonly baseEventId;

  private static stateCounter = 0;

  public constructor(state : MainStateObject, simTime: number, baseEventId: number){
    this.internalState = state;
    this.simulationTimeSec = simTime;
    this.baseEventId = baseEventId;
    this.stateCount = MainSimulationState.stateCounter;
    MainSimulationState.stateCounter++;
  }

  clone(): this {
    return new MainSimulationState(this.deepCloneState(), this.simulationTimeSec, this.baseEventId) as this;
  }

  private deepCloneState(): MainStateObject {

    return {
      actions : this.internalState.actions.map((act) => act.clone()),
      actors : [...this.internalState.actors], // same ref to immutable
      mapLocations: [...this.internalState.mapLocations],
      patients : this.internalState.patients.map((p) => Helpers.cloneDeep(p)),
      tasks : this.internalState.tasks.map((task) => task.clone()),
    }

  }

  /**
   * computes a new state with the applied events.
   * the current instance is not modified
   * @param events events to be applied
   * @returns a new state 
   */
  public applyEvents(events: LocalEventBase[]): MainSimulationState {
    
    const newState = this.clone();

    events.forEach(ev => {
      ev.applyStateUpdate(newState);
    })

    return newState;
  }

  /**
   * Only use this function if you will not modify the state or while applying an event
   */
  public getInternalStateObject(): MainStateObject {
    return this.internalState;
  }

}

interface MainStateObject {
  actions: Readonly<ActionBase>[];
  tasks: Readonly<TaskBase>[]; // TODO
  mapLocations: Readonly<any>[]; // TODO type
  patients: Readonly<HumanBody>[];
  actors : Readonly<Actor>[];

}