import { group } from '../../../tools/groupBy';
import { ActionBase } from '../actions/actionBase';
import { SimFlag } from '../actions/actionTemplateBase';
import { Actor } from '../actors/actor';
import { ActorId, SimDuration, SimTime } from '../baseTypes';
import { FixedMapEntity } from '../events/defineMapObjectEvent';
import { IClonable } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { RadioMessage } from '../radio/radioMessage';
import { getAllContainerDefs } from '../resources/emergencyDepartment';
import { Resource } from '../resources/resource';
import { ResourceContainerConfig, ResourceContainerType } from '../resources/resourceContainer';
import { buildNewTimeFrame, TimeFrame } from '../simulationState/timeState';
import { TaskBase } from '../tasks/taskBase';
import { PatientState } from './patientState';
import { HospitalState } from './hospitalState';
import { DashboardTeamGameState, makeReducedState } from '../../../dashboard/dashboardState';

export class MainSimulationState implements IClonable {
  private static stateCounter = 0;

  private readonly internalState: MainStateObject;
  /**
   * Simulated time in seconds
   */
  private simulationTimeSec: number;

  /**
   * Handles time forward for multiplayer
   */
  private forwardTimeFrame: TimeFrame;

  public readonly stateCount;

  /**
   * Id of the last FullEvent that was applied to get this state
   */
  private lastEventId;

  public getLastEventId() {
    return this.lastEventId;
  }
  public static resetStateCounter() {
    MainSimulationState.stateCounter = 0;
  }

  public constructor(
    state: MainStateObject,
    simTime: number,
    lastEventId: number,
    timeFrame: TimeFrame | undefined = undefined
  ) {
    this.internalState = state;
    this.simulationTimeSec = simTime;
    this.lastEventId = lastEventId;
    this.forwardTimeFrame = timeFrame || buildNewTimeFrame(this);
    this.stateCount = MainSimulationState.stateCounter++;
  }

  clone(): this {
    return new MainSimulationState(
      Helpers.cloneDeep(this.internalState),
      this.simulationTimeSec,
      this.lastEventId,
      Helpers.cloneDeep(this.forwardTimeFrame)
    ) as this;
  }

  /**
   * applies the event to the current state
   * @param event event to be applied
   */
  public applyEvent(event: LocalEventBase, lastEventId: number): void {
    this.lastEventId = lastEventId;
    event.applyStateUpdate(this);
  }

  /**
   * Only use this function if you will not modify the state or while applying an event
   */
  public getInternalStateObject(): Readonly<MainStateObject> {
    return this.internalState;
  }

  /**
   * Get map of containers
   */
  public getResourceContainersByType(): Record<ResourceContainerType, ResourceContainerConfig[]> {
    const defs = getAllContainerDefs();
    return group(this.internalState.resourceContainers, c => defs[c.templateId]!.type);
  }

  /**
   * Only use when applying events
   * @param jump jump in seconds
   */
  public incrementSimulationTime(jump: SimDuration): void {
    this.simulationTimeSec += jump;
  }

  /**
   * Only use when applying events
   */
  public updateForwardTimeFrame(): void {
    // init a new time frame forward
    this.forwardTimeFrame = buildNewTimeFrame(this);
  }

  public getCurrentTimeFrame(): TimeFrame {
    return this.forwardTimeFrame;
  }

  public getReducedState(): DashboardTeamGameState {
    const { patients, ...clone } = Helpers.cloneDeep(this.internalState);
    const reducedState: DashboardTeamGameState = {
      ...clone,
      patients: patients.map(p => makeReducedState(p)),
      simulationTime: this.simulationTimeSec,
    };

    return reducedState;
  }

  /************ IMMUTABLE GETTERS ***************/
  public getSimTime(): SimTime {
    return this.simulationTimeSec;
  }

  public getActorById(actorId: ActorId | undefined): Readonly<Actor | undefined> {
    // don't do ===, typescript seems to play tricks between string and number with records
    return this.internalState.actors.find(a => a.Uid == actorId);
  }

  public getOnSiteActors(): Readonly<Actor[]> {
    return this.getAllActors().filter(a => a.isOnSite());
  }

  public hasFlag(simFlag: SimFlag): boolean {
    return this.internalState.flags[simFlag] || false;
  }

  public getAllActors(): Readonly<Actor[]> {
    return this.internalState.actors;
  }

  public getAllActions(): Readonly<ActionBase[]> {
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
  public getMapLocations(): FixedMapEntity[] {
    return this.internalState.mapLocations;
  }

  public getSimFlags(): Partial<Record<SimFlag, boolean>> {
    return this.internalState.flags;
  }

  public isSimFlagEnabled(flag: SimFlag): boolean {
    if (this.internalState.flags[flag]) return this.internalState.flags[flag]!;
    return false;
  }

  /**
   * @returns True if the zones are defined
   */
  // deprecated - loc.name === 'Triage Zone' won't work anymore
  public areZonesAlreadyDefined(): boolean {
    // TODO make it stronger when zones, PMA, PC, ... are more thant just places
    return (
      this.internalState.mapLocations.filter(
        loc =>
          loc.name === 'Triage Zone' &&
          (loc.startTimeSec || 0) + (loc.durationTimeSec || 0) <= this.simulationTimeSec
      ).length > 0
    );
  }

  /**
   * @returns an array of all patients
   */
  public getAllPatients(): Readonly<PatientState[]> {
    return this.internalState.patients;
  }

  /**
   * @returns An array of all radio messages
   */
  public getRadioMessages(): RadioMessage[] {
    return this.internalState.radioMessages;
  }
}

export interface MainStateObject {
  /**
   * All actions that have been created
   */
  actions: ActionBase[];
  cancelledActions: ActionBase[];
  tasks: TaskBase[];
  mapLocations: FixedMapEntity[];
  patients: PatientState[];
  actors: Actor[];
  radioMessages: RadioMessage[];
  resources: Resource[];
  /**
   * Resources containers that can be dispatched by the emergency dept.
   */
  resourceContainers: ResourceContainerConfig[];
  flags: Partial<Record<SimFlag, boolean>>;
  hospital: HospitalState;
}
