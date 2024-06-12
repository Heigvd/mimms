import {
  ActionId,
  ActionTemplateId,
  ActorId,
  GlobalEventId,
  ResourceId,
  SimDuration,
  SimTime,
  TaskId,
  TranslationKey,
} from '../baseTypes';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import {
  AddRadioMessageLocalEvent,
  AddFixedEntityLocalEvent,
  RemoveFixedEntityLocalEvent,
  CompleteBuildingFixedEntityLocalEvent,
  ResourceRequestResolutionLocalEvent,
  ResourcesAllocationLocalEvent,
  MoveActorLocalEvent,
  TransferResourcesToLocationLocalEvent,
  AddActorLocalEvent,
  DeleteIdleResourceLocalEvent,
  MoveAllIdleResourcesToLocationLocalEvent,
  HospitalRequestUpdateLocalEvent,
  ResourceAllocationLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  ResourceTypeAndNumber,
  ResourcesArray,
  ResourceType,
  HumanResourceTypeArray,
  VehicleType,
} from '../resources/resourceType';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../events/casuMessageEvent';
import { RadioMessagePayload } from '../events/radioMessageEvent';
import { entries } from '../../../tools/helper';
import { ActionType } from '../actionType';
import { SimFlag } from './actionTemplateBase';
import { LOCATION_ENUM } from '../simulationState/locationState';
import {
  enoughResourcesOfAllTypes,
  getInStateCountInactiveResourcesByLocationAndType,
  getResourcesAvailableByLocation,
} from '../simulationState/resourceStateAccess';
import { InterventionRole } from '../actors/actor';
import { getEvacuationTask, getIdleTaskUid } from '../tasks/taskLogic';
import { doesOrderRespectHierarchy } from '../resources/resourceDispatchResolution';
import { hospitalInfo } from '../../../gameInterface/mock_data';
import { getCurrentState } from '../../mainSimulationLogic';
import { computeTravelTime, getHospitalById } from '../evacuation/hospitalController';
import { Resource } from '../resources/resource';
import { getResourcesForEvacSquad, isEvacSquadAvailable } from '../evacuation/evacuationLogic';
import { EvacuationActionPayload } from '../events/evacuationMessageEvent';
import { HospitalDefinition, HospitalProximity } from '../evacuation/hospitalType';
import { getCurrentLanguageCode, getTranslation, knownLanguages } from '../../../tools/translation';
import { getSquadDef } from '../evacuation/evacuationSquadDef';

export type ActionStatus = 'Uninitialized' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined;

const ACTION_SEED_ID: ActionId = 3000;

/**
 * Instanciated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase {
  protected static slogger = Helpers.getLogger('actions-logger');

  private static idProvider: ActionId = ACTION_SEED_ID;

  public static resetIdSeed() {
    ActionBase.idProvider = ACTION_SEED_ID;
  }

  protected readonly logger = ActionBase.slogger;

  public readonly Uid: ActionId;

  protected status: ActionStatus;

  protected readonly templateId;

  public constructor(
    readonly startTime: SimTime,
    protected readonly eventId: GlobalEventId,
    public readonly ownerId: ActorId,
    protected readonly uuidTemplate: ActionTemplateId = -1
  ) {
    this.Uid = ++ActionBase.idProvider;
    this.status = 'Uninitialized';
    this.templateId = uuidTemplate;
  }

  /**
   * Will update the given status
   * @param state the current state that will be updated
   */
  public abstract update(state: Readonly<MainSimulationState>): void;

  public abstract duration(): SimDuration;

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  public cancel(state: MainSimulationState): boolean {
    if (this.status === 'Cancelled') {
      this.logger.warn('This action was already cancelled');
    } else if (this.status === 'Completed') {
      this.logger.error('This action is completed, it cannot be cancelled');
      return false;
    }
    this.status = 'Cancelled';
    this.cancelInternal(state);

    return true;
  }

  protected abstract cancelInternal(state: MainSimulationState): void;

  public getStatus(): ActionStatus {
    return this.status;
  }

  public getTemplateId(): ActionTemplateId {
    return this.templateId;
  }
}

/**
 * An action that has a fixed duration and only start and finish effects
 */
export abstract class StartEndAction extends ActionBase {
  protected readonly durationSec;
  /**
   * Translation key for the name of the action (displayed in the timeline)
   */
  public readonly actionNameKey: TranslationKey;
  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;
  /**
   * Adds SimFlags values to state at the end of the action
   */
  public provideFlagsToState: SimFlag[];

  public constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(startTimeSec, eventId, ownerId, uuidTemplate);
    this.durationSec = durationSeconds;
    this.actionNameKey = actionNameKey;
    this.messageKey = messageKey;
    this.provideFlagsToState = provideFlagsToState;
  }

  protected abstract dispatchInitEvents(state: MainSimulationState): void;

  protected abstract dispatchEndedEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {
    const simTime = state.getSimTime();
    switch (this.status) {
      case 'Cancelled': // should action do something ?
      case 'Completed':
        return;
      case 'Uninitialized':
        {
          if (simTime >= this.startTime) {
            // if action did start
            this.logger.debug('dispatching start events...');
            this.dispatchInitEvents(state);
            this.status = 'OnGoing';
          }
        }
        break;
      case 'OnGoing':
        {
          if (simTime >= this.startTime + this.duration()) {
            // if action did end
            this.logger.debug('dispatching end events...');
            // update flags in state as provided when action completes
            this.provideFlagsToState.forEach(
              flag => (state.getInternalStateObject().flags[flag] = true)
            );
            //execute dispatched events
            this.dispatchEndedEvents(state);
            this.status = 'Completed';
          }
        }
        break;
      default:
        this.logger.error('Undefined status cannot update action');
    }
  }

  public duration(): number {
    return this.durationSec;
  }

  public getTitle(): string {
    return this.actionNameKey;
  }
}

export abstract class RadioDrivenAction extends StartEndAction {
  public constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
  }

  public getEventId(): GlobalEventId {
    return this.eventId;
  }

  public abstract getChannel(): ActionType;

  public abstract getMessage(): string;

  public abstract getEmitter(): string;

  public abstract getRecipient(): number;
}

export class GetInformationAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event GetInformationAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event GetInformationAction');
    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        'ACS',
        this.messageKey
      )
    );
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

export class OnTheRoadAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event OnTheRoadAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event OnTheRoadAction');
    // Once actor arrives, we change location from remote
    const actor = state.getActorById(this.ownerId)!;
    actor.setLocation(actor.getComputedSymbolicLocation(state));

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        'ACS',
        this.messageKey
      )
    );
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

export class CasuMessageAction extends RadioDrivenAction {
  hospitalRequestPayload: HospitalRequestPayload | undefined;

  hospitals: HospitalDefinition[] | undefined;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    private casuMessagePayload: CasuMessagePayload
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    if (this.casuMessagePayload.messageType === 'R') {
      this.hospitalRequestPayload = this.casuMessagePayload;
      // Hardcoded, hospital data should be retrieve from scenarist inputs
      this.hospitals = hospitalInfo.filter(
        h => this.hospitalRequestPayload!.proximity!.valueOf() >= h.proximity
      );
    }
  }

  private computeCasuMessage(message: MethaneMessagePayload): string {
    let casuMessage = '';
    if (message.major) {
      casuMessage += `M - ${message.major} \n`;
    }
    if (message.exact) {
      casuMessage += `E - ${message.exact} \n`;
    }
    if (message.incidentType) {
      casuMessage += `T - ${message.incidentType} \n`;
    }
    if (message.hazards) {
      casuMessage += `H - ${message.hazards} \n`;
    }
    if (message.access) {
      casuMessage += `A - ${message.access} \n`;
    }
    if (message.victims) {
      casuMessage += `N - ${message.victims} \n`;
    }
    if (message.resourceRequest) {
      let requestResource = 'E - ';
      entries(message.resourceRequest)
        .filter(([_, a]) => a > 0)
        .forEach(([typeId, requestedAmount]) => {
          requestResource += `${typeId}: ${requestedAmount} \n`;
        });
      casuMessage += requestResource;
    }

    return casuMessage;
  }

  // TODO Add translation handling and better perhaps better formatting
  private formatHospitalRequest(message: HospitalRequestPayload): string {
    return (
      getTranslation('mainSim-actions-tasks', 'get-hospital-information-desc') +
      ': ' +
      HospitalProximity[message.proximity]
    );
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    //likely nothing to do
    this.logger.info('start event CasuMessageAction');
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event CasuMessageAction');
    const now = state.getSimTime();

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        now,
        this.getRecipient(),
        this.getEmitter(),
        this.getMessage(),
        this.getChannel(),
        true,
        true
      )
    );
    if (this.casuMessagePayload.messageType === 'R') {
      localEventManager.queueLocalEvent(
        new HospitalRequestUpdateLocalEvent(
          this.eventId,
          now,
          this.getRecipient(),
          this.casuMessagePayload
        )
      );
    } else if (this.casuMessagePayload.resourceRequest) {
      // Handle METHANE resource request
      const dispatchEvent = new ResourceRequestResolutionLocalEvent(
        this.eventId,
        now,
        state.getAllActors().find(actor => actor.Role == 'CASU')?.Uid || this.ownerId,
        this.casuMessagePayload
      );
      localEventManager.queueLocalEvent(dispatchEvent);
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  public override getTitle(): string {
    return this.actionNameKey + '-' + this.casuMessagePayload.messageType;
  }

  public getChannel(): ActionType {
    return ActionType.CASU_RADIO;
  }

  public getMessage(): string {
    if (this.casuMessagePayload.messageType === 'R') {
      return this.formatHospitalRequest(this.casuMessagePayload);
    } else {
      return this.computeCasuMessage(this.casuMessagePayload);
    }
  }

  public getEmitter(): string {
    if (this.casuMessagePayload.messageType === 'R') return 'CASU';
    else return getCurrentState().getActorById(this.ownerId)?.FullName || '';
  }

  public getRecipient(): number {
    return this.ownerId;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// place map items
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to select a FixedMapEntity
 */
export class SelectionFixedMapEntityAction extends StartEndAction {
  public readonly fixedMapEntity: FixedMapEntity;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    fixedMapEntity: FixedMapEntity,
    provideFlagsToState: SimFlag[]
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
    this.fixedMapEntity = fixedMapEntity;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    this.fixedMapEntity.buildingStatus = BuildingStatus.inProgress;

    localEventManager.queueLocalEvent(
      new AddFixedEntityLocalEvent(this.eventId, state.getSimTime(), this.fixedMapEntity)
    );
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    // ungrey the map element
    localEventManager.queueLocalEvent(
      new CompleteBuildingFixedEntityLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.fixedMapEntity
      )
    );
    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        'AL',
        this.messageKey
      )
    );
  }

  protected cancelInternal(state: MainSimulationState): void {
    localEventManager.queueLocalEvent(
      new RemoveFixedEntityLocalEvent(this.eventId, state.getSimTime(), this.fixedMapEntity)
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place PMA
// -------------------------------------------------------------------------------------------------

export class SelectionPMAAction extends SelectionFixedMapEntityAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    fixedMapEntity: FixedMapEntity,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      fixedMapEntity,
      provideFlagsToState
    );
  }

  protected override dispatchEndedEvents(state: MainSimulationState): void {
    super.dispatchEndedEvents(state);
    localEventManager.queueLocalEvent(
      new AddActorLocalEvent(this.eventId, state.getSimTime(), 'LEADPMA')
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place park
// -------------------------------------------------------------------------------------------------

export class SelectionParkAction extends SelectionFixedMapEntityAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    fixedMapEntity: FixedMapEntity,
    readonly vehicleType: VehicleType,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      fixedMapEntity,
      provideFlagsToState
    );
  }

  protected override dispatchEndedEvents(state: MainSimulationState): void {
    super.dispatchEndedEvents(state);

    localEventManager.queueLocalEvent(
      new MoveAllIdleResourcesToLocationLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.vehicleType,
        this.fixedMapEntity.id
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  Move actor
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to move actor from one location to another
 */
export class MoveActorAction extends StartEndAction {
  public readonly location: LOCATION_ENUM;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[] = [],
    location: LOCATION_ENUM
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
    this.location = location;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {}

  protected dispatchEndedEvents(state: MainSimulationState): void {
    localEventManager.queueLocalEvent(
      new MoveActorLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.location)
    );
  }

  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

export class AppointActorAction extends StartEndAction {
  public readonly actorRole: InterventionRole;
  private potentialActorCount: number = 0;
  private location: LOCATION_ENUM | undefined = undefined;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[] = [],
    actorRole: InterventionRole,
    readonly requiredResourceType: ResourceType,
    readonly failureMessageKey: TranslationKey
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
    this.actorRole = actorRole;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    this.location = state.getActorById(this.ownerId)?.Location;
    if (this.location) {
      this.potentialActorCount = getResourcesAvailableByLocation(
        state,
        this.location,
        this.requiredResourceType
      ).length;
    }
    if (this.potentialActorCount > 0) {
      // TODO reserve resource mecanism
    } else {
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          state.getActorById(this.ownerId)?.ShortName || '',
          this.failureMessageKey
        )
      );
    }
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    if (this.potentialActorCount) {
      localEventManager.queueLocalEvent(
        new AddActorLocalEvent(this.eventId, state.getSimTime(), this.actorRole, this.location)
      );
      localEventManager.queueLocalEvent(
        new DeleteIdleResourceLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.location!,
          this.requiredResourceType
        )
      );
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

/**
 * Action to send resources to a location and assign a task
 */
export class MoveResourcesAssignTaskAction extends StartEndAction {
  public static readonly TIME_REQUIRED_TO_MOVE_TO_LOCATION = 60;
  public readonly failMessageKey: TranslationKey;
  public readonly sourceLocation: LOCATION_ENUM;
  public readonly targetLocation: LOCATION_ENUM;
  public readonly sentResources: ResourceTypeAndNumber;
  public readonly sourceTaskId: TaskId;
  public readonly targetTaskId: TaskId;
  private compliantWithHierarchy: boolean;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    failMessageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    sourceLocation: LOCATION_ENUM,
    targetLocation: LOCATION_ENUM,
    sentResources: ResourceTypeAndNumber,
    sourceTaskId: TaskId,
    targetTaskId: TaskId
  ) {
    super(
      startTimeSec,
      durationSeconds,
      globalEventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate
    );
    this.failMessageKey = failMessageKey;
    this.sourceLocation = sourceLocation;
    this.targetLocation = targetLocation;
    this.sentResources = sentResources;
    this.sourceTaskId = sourceTaskId;
    this.targetTaskId = targetTaskId;
    this.compliantWithHierarchy = false;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event MoveResourcesAssignTaskAction');
    this.compliantWithHierarchy = doesOrderRespectHierarchy(
      this.ownerId,
      this.sourceLocation,
      state
    );
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event MoveResourcesAssignTaskAction');

    const actionOwnerActor = state.getActorById(this.ownerId)!;

    if (
      enoughResourcesOfAllTypes(
        state,
        this.sourceTaskId,
        this.sentResources,
        this.sourceLocation
      ) &&
      this.compliantWithHierarchy
    ) {
      const sameLocation = this.sourceLocation === this.targetLocation;
      let timeDelay = 0;
      //if source != target => emit a transfer event and delay resource allocation on task event
      if (!sameLocation) {
        localEventManager.queueLocalEvent(
          new TransferResourcesToLocationLocalEvent(
            this.eventId,
            state.getSimTime(),
            this.sourceLocation,
            this.targetLocation,
            this.sentResources,
            this.sourceTaskId
          )
        );
        timeDelay = MoveResourcesAssignTaskAction.TIME_REQUIRED_TO_MOVE_TO_LOCATION;
      }

      ResourcesArray.forEach(res => {
        const nbRes = this.sentResources[res] || 0;
        if (nbRes > 0) {
          localEventManager.queueLocalEvent(
            new ResourcesAllocationLocalEvent(
              this.eventId,
              state.getSimTime() + timeDelay,
              +this.targetTaskId,
              this.targetLocation,
              res,
              nbRes
            )
          );
        }
      });

      // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          actionOwnerActor.Role as unknown as TranslationKey,
          this.messageKey
        )
      );
    } else {
      // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          actionOwnerActor.Role as unknown as TranslationKey,
          this.failMessageKey
        )
      );
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

export class SendRadioMessageAction extends RadioDrivenAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    private radioMessagePayload: RadioMessagePayload
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event SendRadioMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event SendRadioMessageAction');
    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.radioMessagePayload.actorId,
        state.getActorById(this.radioMessagePayload.actorId)?.FullName || '',
        this.radioMessagePayload.message,
        this.radioMessagePayload.channel,
        true,
        true
      )
    );
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  public getRadioMessagePayload(): RadioMessagePayload {
    return this.radioMessagePayload;
  }

  public getChannel(): ActionType {
    return this.radioMessagePayload.channel;
  }

  public getMessage(): string {
    return this.radioMessagePayload.message;
  }

  public getEmitter(): string {
    return getCurrentState().getActorById(this.radioMessagePayload.actorId)?.FullName || '';
  }

  public getRecipient(): number {
    return this.radioMessagePayload.actorId;
  }
}

export class ArrivalAnnoucementAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[]
    /* do we need to list the flags here? It seems like it should be in the template but how does the class know she needs flags?
    private flags: SimFlag[]=[SimFlag.PCS_ARRIVED,
     */
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event ArrivalAnnoucementAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event ArrivalAnnoucementAction');
    const so = state.getInternalStateObject();

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        state.getActorById(this.ownerId)?.ShortName || '',
        this.messageKey,
        ActionType.CASU_RADIO,
        true,
        false
      )
    );

    const ownerActor = so.actors.find(a => a.Uid === this.ownerId)!;

    //transfer available human resources from each location to event owner location
    for (const location of so.mapLocations) {
      const availableResources = getInStateCountInactiveResourcesByLocationAndType(
        state,
        HumanResourceTypeArray,
        location.id
      );
      localEventManager.queueLocalEvent(
        new TransferResourcesToLocationLocalEvent(
          this.eventId,
          state.getSimTime(),
          location.id,
          ownerActor.Location,
          availableResources,
          getIdleTaskUid(state)
        )
      );
    }
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  Evacuation
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to evacuate a patient to a hospital
 */
export class EvacuationAction extends RadioDrivenAction {
  public readonly evacuationActionPayload: EvacuationActionPayload;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    readonly feedbackWhenStarted: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    evacuationActionPayload: EvacuationActionPayload,
    provideFlagsToState?: SimFlag[]
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      messageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
    this.evacuationActionPayload = evacuationActionPayload;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    this.logger.info('start event EvacuationAction');
  }

  private formatStartFeedbackMessage(payload: EvacuationActionPayload) {
    const currentLanguage = getCurrentLanguageCode().toLowerCase() as knownLanguages;

    const patientId: string = payload.patientId;
    const toHospital: string = getHospitalById(payload.hospitalId).nameAsDestination[
      currentLanguage
    ];
    const squadDef = getSquadDef(payload.transportSquad);
    const byVector: string = getTranslation(
      'mainSim-actions-tasks',
      squadDef.mainVehicleTranslation,
      false
    );
    const healerPresence: string = getTranslation(
      'mainSim-actions-tasks',
      squadDef.healerPresenceTranslation,
      false
    );

    return getTranslation('mainSim-actions-tasks', this.feedbackWhenStarted, true, [
      patientId,
      toHospital,
      byVector,
      healerPresence,
    ]);
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event EvacuationAction');

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.getRecipient(),
        this.getEmitter(),
        this.getMessage(),
        this.getChannel(),
        true,
        true
      )
    );

    const isEnoughResources = isEvacSquadAvailable(
      state,
      this.evacuationActionPayload.transportSquad
    );

    if (!isEnoughResources) {
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          0,
          getCurrentState().getActorById(this.ownerId)?.FullName || '',
          this.msgEvacuationAbort,
          this.getChannel(),
          true
        )
      );
    } else {
      const involvedResources: Resource[] = getResourcesForEvacSquad(
        state,
        this.evacuationActionPayload.transportSquad
      );

      const involvedResourceIds: ResourceId[] = involvedResources.map(resource => resource.Uid);

      const travelTime = computeTravelTime(
        this.evacuationActionPayload.hospitalId,
        this.evacuationActionPayload.transportSquad
      );

      const evacuationTask = getEvacuationTask(state);

      involvedResources.forEach(res => {
        localEventManager.queueLocalEvent(
          new ResourceAllocationLocalEvent(
            this.eventId,
            state.getSimTime(),
            res.Uid,
            evacuationTask.Uid
          )
        );
      });

      evacuationTask.createSubTask(
        this.eventId,
        involvedResourceIds,
        this.evacuationActionPayload.patientId,
        this.evacuationActionPayload.hospitalId,
        this.evacuationActionPayload.patientUnitAtHospital,
        !!this.evacuationActionPayload.doResourcesComeBack,
        travelTime
      );
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    // nothing done before the end of the action => nothing to cancel
    return;
  }

  public getChannel(): ActionType {
    return ActionType.EVASAN_RADIO;
  }

  public getMessage(): string {
    return this.formatStartFeedbackMessage(this.evacuationActionPayload);
  }

  public getEmitter(): string {
    return getCurrentState().getActorById(this.ownerId)?.FullName || '';
  }

  public getRecipient(): number {
    return this.ownerId;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
