import { HumanBody } from "../../../HUMAn/human";
import { group } from "../../../tools/groupBy";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, SimDuration, SimTime } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
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
      actors : [...this.internalState.actors],
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

    // TODO is that too much ?
    // Object.freeze(newState.internalState);
    return newState;
  }

  /**
   * Only use this function if you will not modify the state or while applying an event
   */
  public getInternalStateObject(): Readonly<MainStateObject> {
    return this.internalState;
  }

  // experimental, might be interesting to enforce immutability
  // but functions are not callable anymore
  // maybe this https://stackoverflow.com/questions/58210331/exclude-function-types-from-an-object-type
  /**
   * @returns a deep readonly main state object
   */
  public getImmutableStateObject(): Immutable<MainStateObject> {
    const imm : Immutable<MainStateObject>= {
      ...this.internalState
    }
    // const so = this.internalState;
    // so.actions[0]!.test.a = 2
    // so.actions.push()
    // imm.actions[0]!.test.a = 2
    // imm.actions.push()
    //imm.actions[0]?.cancel() non callable

    return imm;
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
    return this.internalState.actors.find(a => a.Uid === actorId);
  }

  public getAllActors(): Readonly<Actor[]> {
    return this.internalState.actors;
  }

  /**
   * @returns A map of action arrays grouped by actor ids
   */
  public getActionsByActorIds(): Record<ActorId, Readonly<ActionBase>[]> {
    return group(this.internalState.actions, (a: ActionBase) => a.ownerId);
  }
  
  /**
   * @returns A map of action arrays mapped by actor ids
   */
  public getTasksByActorIds(): Record<ActorId, Readonly<TaskBase>[]> {
    return group(this.internalState.tasks, (t: TaskBase) => t.ownerId);
  }

  /**
   * @returns An array of all map locations
   */
  public getMapLocations(): MapFeature[] {
	  return this.internalState.mapLocations;
  }

  /**
   * @returns An array of all radio messages
   */
  public getRadioMessages(): RadioMessage[] {
	  return this.internalState.radioMessages;
  }
}

interface MainStateObject {
  /**
   * All actions that have been created
   */
  actions: ActionBase[];
  tasks: TaskBase[]; // TODO
  mapLocations: MapFeature[];
  patients: HumanBody[];
  actors : Actor[];
  radioMessages: RadioMessage[];
}

// experimental to make an object immutable
type Immutable<T> = {
  readonly [K in keyof T ]: Immutable<T[K]>
}
