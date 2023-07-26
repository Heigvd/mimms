import { HumanBody } from "../../../HUMAn/human";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, SimDuration, SimTime } from "../baseTypes";
import { IClonable } from "../interfaces";
import { LocalEventBase } from "../localEvents/localEventBase";
import { RadioMessage } from "../radioMessage";
import { TaskBase } from "../tasks/taskBase";


export class MainSimulationState implements IClonable {

  private static stateCounter = 0;

  private readonly internalState: MainStateObject;
  /**
   * Simulated time in seconds
   */
  private simulationTimeSec : number;

  public readonly stateCount;

  public readonly baseEventId;

  public constructor(state : MainStateObject, simTime: number, baseEventId: number){
    this.internalState = state;
    this.simulationTimeSec = simTime;
    this.baseEventId = baseEventId;
    this.stateCount = MainSimulationState.stateCounter++;
  }

  clone(): this {
    return new MainSimulationState(this.deepCloneState(), this.simulationTimeSec, this.baseEventId) as this;
  }

  private deepCloneState(): MainStateObject {

    return {
      actions : this.internalState.actions.map((act) => act.clone()),
      actors : {...this.internalState.actors}, // same ref to immutable
      mapLocations: [...this.internalState.mapLocations],
      patients : this.internalState.patients.map((p) => Helpers.cloneDeep(p)),
      tasks : this.internalState.tasks.map((task) => task.clone()),
      radioMessages : [...this.internalState.radioMessages]
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

  /**
   * Only use when applying events
   * @param jump jump in seconds
   */
  public incrementSimulationTime(jump :SimDuration): void {
    this.simulationTimeSec += jump;
  }

  /************ IMMUTABLE GETTERS ***************/
  public getSimTime(): SimTime {return this.simulationTimeSec;}

  public getActorById(actorId: ActorId): Readonly<Actor | undefined> {
    return this.internalState.actors[actorId];
  }

  public getActionsByActorIds(): Record<ActorId, Readonly<ActionBase>[]> {
    const val = this.internalState.actions.reduce<Record<ActorId, Readonly<ActionBase>[]>>((map, act) =>{

      const id = act.ownerId;
      if(!map[id]){
        map[id] = []
      }
      map[id]!.push(act);
      return map;
    }, {});
  
    return val;
  }

  
}

interface MainStateObject {
  /**
   * All actions that have been created
   */
  actions: Readonly<ActionBase>[];
  tasks: Readonly<TaskBase>[]; // TODO
  mapLocations: Readonly<any>[]; // TODO type
  patients: Readonly<HumanBody>[];
  actors : Readonly<Record<ActorId,Actor>>;
  radioMessages: Readonly<RadioMessage>[];

}