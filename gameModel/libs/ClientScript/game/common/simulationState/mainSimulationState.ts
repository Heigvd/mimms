import { HumanBody } from "../../../HUMAn/human";
import { group } from "../../../tools/groupBy";
import { PreTriageResult } from "../../pretri/triage";
import { ActionBase } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { ActorId, SimDuration, SimTime } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
import { IClonable } from "../interfaces";
import { LocalEventBase } from "../localEvents/localEventBase";
import { RadioMessage } from "../radioMessage";
import { Resource } from "../resources/resource";
import { ResourceContainerConfig, ResourceContainerDefinitionId } from "../resources/resourceContainer";
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
      cancelledActions : this.internalState.cancelledActions.map((act) => act.clone()),
      actors : [...this.internalState.actors],
      mapLocations: [...this.internalState.mapLocations],
      patients: this.internalState.patients.map((p) => Helpers.cloneDeep(p)),
	  pretriageResults: Object.fromEntries(Object.entries(this.internalState.pretriageResults).map( entry => [entry[0], Helpers.cloneDeep(entry[1])])),
      tasks : [...this.internalState.tasks],
      radioMessages : [...this.internalState.radioMessages],
      resources : [...this.internalState.resources],
	  resourceContainers: Helpers.cloneDeep(this.internalState.resourceContainers)
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
   * Get map of containers
   */
  public getResourceContainersByDefId() : Record<ResourceContainerDefinitionId, ResourceContainerConfig[]>{
	return group(this.internalState.resourceContainers, (c =>  c.templateId));
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

  public getAllActions(): Readonly<ActionBase[]>{
    return this.internalState.actions;
  }

  public getAllCancelledActions(): Readonly<ActionBase[]> {
	  return this.internalState.cancelledActions;
  }

  /**
   * @returns A map of action arrays grouped by actor ids
   */
  public getActionsByActorIds(): Record<ActorId, Readonly<ActionBase>[]> {
    return group(this.internalState.actions, (a: ActionBase) => a.ownerId);
  }

  /**
   * @returns An array of all map locations
   */
  public getMapLocations(): MapFeature[] {
	  return this.internalState.mapLocations;
  }

  /**
   * @returns True if the zones are defined
   */
  public areZonesAlreadyDefined(): boolean {
    // TODO make it stronger when zones, PMA, PC, ... are more thant just places
    return this.internalState.mapLocations.filter(loc => loc.name === 'Triage Zone'
      && (((loc.startTimeSec || 0) + (loc.durationTimeSec || 0)) <= this.simulationTimeSec)).length > 0;
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
  cancelledActions: ActionBase[];
  tasks: TaskBase[];
  mapLocations: MapFeature[];
  patients: HumanBody[];
  pretriageResults: Record<string, PreTriageResult<string>>,
  actors : Actor[];
  radioMessages: RadioMessage[];
  resources: Resource[];
  /**
   * Resources containers that can be dispatched by the emergency dept.
   */
  resourceContainers: ResourceContainerConfig[];
}

// experimental to make an object immutable
type Immutable<T> = {
  readonly [K in keyof T ]: Immutable<T[K]>
}
