import { HumanBody } from "../../../HUMAn/human";
import { group } from "../../../tools/groupBy";
import { mainSimStateLogger } from "../../../tools/logger";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, SimDuration, SimTime } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
import { IClonable } from "../interfaces";
import { LocalEventBase } from "../localEvents/localEventBase";
import { RadioMessage } from "../radioMessage";
import { ResourcePool, ResourceType } from "../resources/resourcePool";
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
      tmp: {
        nbForPreTriZoneA: this.internalState.tmp.nbForPreTriZoneA,
        nbForPreTriZoneB: this.internalState.tmp.nbForPreTriZoneB,
      },
      tasks : this.internalState.tasks.map((task) => task.clone()),
      radioMessages : [...this.internalState.radioMessages],
      resources : [...this.internalState.resources],
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

  public getAllTasks(): Readonly<TaskBase>[] {
    return this.internalState.tasks;
  }

  /**
   * @returns All pool resources matching actor id and type
   */
  public getResources(actorId: ActorId, type: ResourceType): Readonly<ResourcePool>[] {
    return this.internalGetResources(actorId, type);
  }

  public countNbPatientsForPreTri(zone: string): number {
    if (zone === "A") {
      return this.internalState.tmp.nbForPreTriZoneA;
    } else if (zone === "B") {
      return this.internalState.tmp.nbForPreTriZoneB;
    }

    return 0;
  }

  public categorizeOnePatient(zone: string): void {
    mainSimStateLogger.debug("categorize 1 patient in zone " + zone);

    if (zone === "A") {
      this.internalState.tmp.nbForPreTriZoneA -= 1;
      mainSimStateLogger.debug("still " + this.internalState.tmp.nbForPreTriZoneA + " patients to categorize " + zone);

    } else if (zone === "B") {
      this.internalState.tmp.nbForPreTriZoneB -= 1;
      mainSimStateLogger.debug("still " +this.internalState.tmp.nbForPreTriZoneB + " patients to categorize " + zone);
    }
  }

  /**
   * Get, but for internal use, return object can be updated
   *
   * @returns All pool resources matching actor id and type
   */
  private internalGetResources(actorId: ActorId, type: ResourceType): ResourcePool[] {
    return this.internalState.resources.filter(res => res.ownerId === actorId && res.type === type);
  }

  /**
   * Change the number of resources in the matching resource pool.
   * <p>
   * If none, create a resource pool.
   */
  public addResources(actorId: ActorId, type: ResourceType, nb: number): void {
    const allMatching = this.internalGetResources(actorId, type);

    if (allMatching != null && allMatching.length === 1 && allMatching[0] != null) {
      const matching = allMatching[0];
      matching.nbAvailable += nb;
    } else {
      this.internalState.resources.push(new ResourcePool(actorId, type, nb));
    }
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
  tasks: TaskBase[];
  mapLocations: MapFeature[];
  patients: HumanBody[];
  tmp: {
    nbForPreTriZoneA: number;
    nbForPreTriZoneB: number;
  };
  actors : Actor[];
  radioMessages: RadioMessage[];
  /**
   * All available resources
   */
  resources: ResourcePool[];
}

// experimental to make an object immutable
type Immutable<T> = {
  readonly [K in keyof T ]: Immutable<T[K]>
}
