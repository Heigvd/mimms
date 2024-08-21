import { hospitalInfo } from '../../../gameInterface/mock_data';
import { entries } from '../../../tools/helper';
import { getCurrentLanguageCode, getTranslation, knownLanguages } from '../../../tools/translation';
import { getCurrentState } from '../../mainSimulationLogic';
import { ActionType } from '../actionType';
import { InterventionRole } from '../actors/actor';
import * as ActorLogic from '../actors/actorLogic';
import {
  ActionId,
  ActionTemplateId,
  ActorId,
  GlobalEventId,
  HospitalId,
  PatientId,
  ResourceId,
  SimDuration,
  SimTime,
  TaskId,
  TranslationKey,
} from '../baseTypes';
import { ACSMCSAutoRequestDelay, PretriageReportResponseDelay } from '../constants';
import * as EvacuationLogic from '../evacuation/evacuationLogic';
import { EvacuationSquadType, getSquadDef } from '../evacuation/evacuationSquadDef';
import { computeTravelTime, getHospitalById } from '../evacuation/hospitalController';
import {
  HospitalDefinition,
  HospitalProximity,
  PatientUnitTypology,
} from '../evacuation/hospitalType';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../events/casuMessageEvent';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import { EvacuationActionPayload } from '../events/evacuationMessageEvent';
import { RadioMessagePayload } from '../events/radioMessageEvent';
import {
  AddActorLocalEvent,
  AddFixedEntityLocalEvent,
  AddRadioMessageLocalEvent,
  AssignResourcesToTaskLocalEvent,
  AssignResourcesToWaitingTaskLocalEvent,
  AutoSendACSMCSLocalEvent,
  CompleteBuildingFixedEntityLocalEvent,
  DeleteResourceLocalEvent,
  HospitalRequestUpdateLocalEvent,
  MoveActorLocalEvent,
  MoveFreeWaitingResourcesByLocationLocalEvent,
  MoveFreeWaitingResourcesByTypeLocalEvent,
  MoveResourcesLocalEvent,
  PretriageReportResponseLocalEvent,
  RemoveFixedEntityLocalEvent,
  ReserveResourcesLocalEvent,
  ResourceRequestResolutionLocalEvent,
  UnReserveResourcesLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { Resource } from '../resources/resource';
import { doesOrderRespectHierarchy } from '../resources/resourceLogic';
import { HumanResourceType, ResourceTypeAndNumber, VehicleType } from '../resources/resourceType';
import {
  canMoveToLocation,
  getMapLocationById,
  LOCATION_ENUM,
} from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getEvacuationTask } from '../tasks/taskLogic';
import { SimFlag } from './actionTemplateBase';

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

  protected constructor(
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

  protected constructor(
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
  protected constructor(
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

/**
 * The result of the action is to display a message in a radio channel or as a notification
 */
export class DisplayMessageAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState?: SimFlag[],
    readonly channel?: ActionType | undefined,
    readonly isRadioMessage?: boolean
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

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event DisplayMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event DisplayMessageAction');

    localEventManager.queueLocalEvent(
      new AddRadioMessageLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        state.getActorById(this.ownerId)?.ShortName || '',
        this.messageKey,
        this.channel,
        this.isRadioMessage
      )
    );
  }

  // TODO probably nothing
  protected cancelInternal(_state: MainSimulationState): void {
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

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
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
  protected cancelInternal(_state: MainSimulationState): void {
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

  protected dispatchInitEvents(_state: MainSimulationState): void {
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

      // Auto request ACS MCS if not requested within 5 mins after methane and ACS/MCS is not on site already
      // enough to test for presence, in case of multiple requests, only the first one is executed
      if (!state.getAllActors().some(actor => actor.Role === 'ACS' || actor.Role === 'MCS')) {
        // Scheduling automatic sending of ACS/MCS
        this.logger.info(
          'Auto scheduling request for ACS-MCS, executed in ' + ACSMCSAutoRequestDelay + ' secs'
        );
        localEventManager.queueLocalEvent(
          new AutoSendACSMCSLocalEvent(
            this.eventId,
            now + ACSMCSAutoRequestDelay,
            state.getAllActors().find(actor => actor.Role == 'CASU')?.Uid || this.ownerId
          )
        );
      }
    }
  }

  protected cancelInternal(_state: MainSimulationState): void {
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

export class ActivateRadioSchemaAction extends RadioDrivenAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    feedbackMessageKey: TranslationKey,
    readonly requestMessage: TranslationKey,
    readonly authorizedReplyMessage: TranslationKey,
    readonly unauthorizedReplyMessage: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    readonly channel: ActionType,
    provideFlagsToState?: SimFlag[]
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      feedbackMessageKey,
      ownerId,
      uuidTemplate,
      provideFlagsToState
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event ActivateRadioSchemaAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event ActivateRadioSchemaAction');

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

    const suitableActors = ActorLogic.getHighestAuthorityActorOnSite(state);
    if (suitableActors.includes(this.ownerId)) {
      state.getInternalStateObject().flags[SimFlag.RADIO_SCHEMA_ACTIVATED] = true;

      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          0, //this.ownerId,
          'CASU',
          this.authorizedReplyMessage,
          this.channel,
          true
        )
      );
    } else {
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          0, // this.ownerId,
          'CASU',
          this.unauthorizedReplyMessage,
          this.channel,
          true
        )
      );
    }
  }

  protected cancelInternal(_state: MainSimulationState): void {
    // nothing to do
    return;
  }

  public getChannel(): ActionType {
    return this.channel;
  }

  public getMessage(): string {
    return getTranslation('mainSim-actions-tasks', this.requestMessage);
  }

  public getEmitter(): string {
    return getCurrentState().getActorById(this.ownerId)?.ShortName || '';
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
// place PC Front
// -------------------------------------------------------------------------------------------------

export class SelectionPCFrontAction extends SelectionFixedMapEntityAction {
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
      new MoveActorLocalEvent(this.eventId, state.getSimTime(), this.ownerId, LOCATION_ENUM.pcFront)
    );

    // First and only resource on scene comes with
    const resourceUid = state.getInternalStateObject().resources[0]!.Uid;
    localEventManager.queueLocalEvent(
      new MoveResourcesLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        [resourceUid],
        LOCATION_ENUM.pcFront
      )
    );
    localEventManager.queueLocalEvent(
      new AssignResourcesToWaitingTaskLocalEvent(this.eventId, state.getSimTime(), [resourceUid])
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place PC
// -------------------------------------------------------------------------------------------------

export class SelectionPCAction extends SelectionFixedMapEntityAction {
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
    // Move actors to PC
    const actors = state
      .getInternalStateObject()
      .actors.filter(a => a.Location === LOCATION_ENUM.pcFront);

    for (const actor of actors) {
      localEventManager.queueLocalEvent(
        new MoveActorLocalEvent(this.eventId, state.getSimTime(), actor.Uid, this.fixedMapEntity.id)
      );
    }
    // Move resources to PC (resources can only be idle at PC Front)
    localEventManager.queueLocalEvent(
      new MoveFreeWaitingResourcesByLocationLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        LOCATION_ENUM.pcFront,
        this.fixedMapEntity.id
      )
    );
    // Remove PC Front once all actors and resources have been moved
    const pcFrontFixedEntity = getMapLocationById(state, LOCATION_ENUM.pcFront);
    pcFrontFixedEntity!.buildingStatus = BuildingStatus.removed;
    localEventManager.queueLocalEvent(
      new RemoveFixedEntityLocalEvent(this.eventId, state.getSimTime(), pcFrontFixedEntity!)
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
      new MoveFreeWaitingResourcesByTypeLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.ownerId,
        this.vehicleType,
        this.fixedMapEntity.id
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Move actor
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
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
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

  protected dispatchInitEvents(_state: MainSimulationState): void {}

  protected dispatchEndedEvents(state: MainSimulationState): void {
    if (!canMoveToLocation(state, 'Actors', this.location)) {
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          'ACS',
          'move-actor-no-location',
          undefined,
          false,
          false
        )
      );
    } else {
      localEventManager.queueLocalEvent(
        new MoveActorLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.location)
      );
    }
  }

  protected cancelInternal(_state: MainSimulationState): void {
    return;
  }
}

export class AppointActorAction extends StartEndAction {
  private location: LOCATION_ENUM | undefined = undefined;
  private involvedResourceId: ResourceId | undefined = undefined;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    provideFlagsToState: SimFlag[] = [],
    readonly actorRole: InterventionRole,
    readonly requiredResourceType: HumanResourceType[],
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
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    this.location = state.getActorById(this.ownerId)!.Location;

    const matchingResources = ResourceState.getFreeWaitingResourcesByTypeAndLocation(
      state,
      this.requiredResourceType,
      this.location
    );

    if (matchingResources.length > 0) {
      this.involvedResourceId = matchingResources[0]!.Uid;

      // we reserve the resources for this action so that they cannot be used by anything else
      localEventManager.queueLocalEvent(
        new ReserveResourcesLocalEvent(
          this.eventId,
          state.getSimTime(),
          [this.involvedResourceId],
          this.Uid
        )
      );
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
    if (this.involvedResourceId != undefined) {
      localEventManager.queueLocalEvent(
        new AddActorLocalEvent(this.eventId, state.getSimTime(), this.actorRole, this.location)
      );

      // no need to free the resource as long as it will be deleted

      localEventManager.queueLocalEvent(
        new DeleteResourceLocalEvent(this.eventId, state.getSimTime(), this.involvedResourceId)
      );
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    // we free the resources so that they are available for other actions
    if (this.involvedResourceId != undefined) {
      localEventManager.queueLocalEvent(
        new UnReserveResourcesLocalEvent(this.eventId, state.getSimTime(), [
          this.involvedResourceId,
        ])
      );
    }
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
  private isSameLocation: boolean;
  private timeDelay: number;
  private involvedResourcesId: ResourceId[];

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
    this.isSameLocation = false;
    this.timeDelay = 0;
    this.involvedResourcesId = [];
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event MoveResourcesAssignTaskAction');

    this.compliantWithHierarchy = doesOrderRespectHierarchy(
      state,
      this.ownerId,
      this.sourceLocation
    );

    this.isSameLocation = this.sourceLocation === this.targetLocation;

    if (!this.isSameLocation) {
      this.timeDelay = MoveResourcesAssignTaskAction.TIME_REQUIRED_TO_MOVE_TO_LOCATION;
    } else {
      this.timeDelay = 0;
    }

    this.involvedResourcesId = ResourceState.getFreeResourcesByNumberTypeLocationAndTask(
      state,
      this.sentResources,
      this.sourceLocation,
      this.sourceTaskId
    ).map(resource => resource.Uid);

    // we reserve the resources for this action so that they cannot be used by anything else
    localEventManager.queueLocalEvent(
      new ReserveResourcesLocalEvent(
        this.eventId,
        state.getSimTime(),
        this.involvedResourcesId,
        this.Uid
      )
    );
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event MoveResourcesAssignTaskAction');

    // we free the resources so that they are available again
    // ! but we free them only when everything is done !
    localEventManager.queueLocalEvent(
      new UnReserveResourcesLocalEvent(
        this.eventId,
        state.getSimTime() + this.timeDelay,
        this.involvedResourcesId
      )
    );

    const actionOwnerActor = state.getActorById(this.ownerId)!;

    if (!this.compliantWithHierarchy) {
      // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes
      // Resources refused the order due to hierarchy conflict
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          actionOwnerActor.Role as unknown as TranslationKey,
          'move-res-task-refused'
        )
      );
    } else if (!canMoveToLocation(state, 'Resources', this.targetLocation)) {
      // Resources cannot move to a non-existent location
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.ownerId,
          actionOwnerActor.Role as unknown as TranslationKey,
          'move-res-task-no-location'
        )
      );
    } else {
      if (!this.isSameLocation) {
        localEventManager.queueLocalEvent(
          new MoveResourcesLocalEvent(
            this.eventId,
            state.getSimTime(),
            this.ownerId,
            this.involvedResourcesId,
            this.targetLocation
          )
        );

        // during the travel set the resources as waiting
        localEventManager.queueLocalEvent(
          new AssignResourcesToWaitingTaskLocalEvent(
            this.eventId,
            state.getSimTime(),
            this.involvedResourcesId
          )
        );
      }

      // during the travel set the resources as waiting
      localEventManager.queueLocalEvent(
        new AssignResourcesToTaskLocalEvent(
          this.eventId,
          state.getSimTime() + this.timeDelay,
          this.involvedResourcesId,
          this.targetTaskId
        )
      );

      let nbResourcesNeeded: number = 0;
      // Note : please change code to be more straight forward
      entries(this.sentResources).forEach(([_resourceType, nbResources]) => {
        nbResourcesNeeded += nbResources || 0;
      });

      const isEnoughResources = this.involvedResourcesId.length === nbResourcesNeeded;

      if (this.involvedResourcesId.length === 0) {
        // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes
        localEventManager.queueLocalEvent(
          new AddRadioMessageLocalEvent(
            this.eventId,
            state.getSimTime(),
            this.ownerId,
            actionOwnerActor.Role as unknown as TranslationKey,
            'move-res-task-no-resource'
          )
        );
      } else if (!isEnoughResources) {
        // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes
        localEventManager.queueLocalEvent(
          new AddRadioMessageLocalEvent(
            this.eventId,
            state.getSimTime(),
            this.ownerId,
            actionOwnerActor.Role as unknown as TranslationKey,
            'move-res-task-not-enough-resources'
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
            this.messageKey
          )
        );
      }
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    // we free the resources so that they are available for other actions
    localEventManager.queueLocalEvent(
      new UnReserveResourcesLocalEvent(this.eventId, state.getSimTime(), this.involvedResourcesId)
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * The result of the action is to request state of pretriage in a specific location
 */
export class RequestPretriageReportAction extends RadioDrivenAction {
  private channel = ActionType.RESOURCES_RADIO;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    private feedbackWhenStarted: TranslationKey,
    private feedbackWhenReport: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    private pretriageLocation: LOCATION_ENUM
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      feedbackWhenStarted,
      ownerId,
      uuidTemplate
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event RequestPretriageReportAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
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

    localEventManager.queueLocalEvent(
      new PretriageReportResponseLocalEvent(
        this.eventId,
        state.getSimTime() + PretriageReportResponseDelay,
        'D424',
        0,
        this.pretriageLocation,
        this.feedbackWhenReport
      )
    );
  }

  // TODO probably nothing
  protected cancelInternal(_state: MainSimulationState): void {
    return;
  }

  private formatStartMessage(): string {
    return getTranslation('mainSim-actions-tasks', this.feedbackWhenStarted, true, [
      getTranslation('mainSim-locations', 'location-' + this.pretriageLocation),
    ]);
  }

  public getChannel(): ActionType {
    return this.channel;
  }

  public getMessage(): string {
    return this.formatStartMessage();
  }

  public getEmitter(): string {
    return getCurrentState().getActorById(this.ownerId)!.FullName;
  }

  public getRecipient(): number {
    return this.ownerId;
  }
}

/**
 * The result of the action is to spread a handwritten message from a player through a radio channel
 */
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

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
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
  protected cancelInternal(_state: MainSimulationState): void {
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Evacuation
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to evacuate a patient to a hospital
 */
export class EvacuationAction extends RadioDrivenAction {
  private readonly patientId: PatientId;
  private readonly hospitalId: HospitalId;
  private readonly patientUnitAtHospital: PatientUnitTypology;
  private readonly transportSquad: EvacuationSquadType;
  private readonly doResourcesComeBack: boolean;

  private isEnoughResources: boolean;
  private involvedResourcesId: ResourceId[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    readonly feedbackWhenStarted: TranslationKey,
    readonly feedbackWhenReturning: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    readonly evacuationActionPayload: EvacuationActionPayload,
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
    this.patientId = evacuationActionPayload.patientId;
    this.hospitalId = evacuationActionPayload.hospitalId;
    this.patientUnitAtHospital = evacuationActionPayload.patientUnitAtHospital;
    this.transportSquad = evacuationActionPayload.transportSquad;
    this.doResourcesComeBack = !!evacuationActionPayload.doResourcesComeBack;

    this.isEnoughResources = false;
    this.involvedResourcesId = [];
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    this.logger.info('start event EvacuationAction');

    this.isEnoughResources = EvacuationLogic.isEvacSquadAvailable(state, this.transportSquad);

    if (this.isEnoughResources) {
      this.involvedResourcesId = EvacuationLogic.getResourcesForEvacSquad(
        state,
        this.transportSquad
      ).map((resource: Resource) => resource.Uid);

      // we reserve the resources for this action so that they cannot be used by anything else
      localEventManager.queueLocalEvent(
        new ReserveResourcesLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.involvedResourcesId,
          this.Uid
        )
      );
    } else {
      this.involvedResourcesId = [];
    }
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event EvacuationAction');

    // we free the resources so that they are available again
    localEventManager.queueLocalEvent(
      new UnReserveResourcesLocalEvent(this.eventId, state.getSimTime(), this.involvedResourcesId)
    );

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

    if (!this.isEnoughResources) {
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
      const travelTime = computeTravelTime(this.hospitalId, this.transportSquad);

      const evacuationTask = getEvacuationTask(state);

      localEventManager.queueLocalEvent(
        new AssignResourcesToTaskLocalEvent(
          this.eventId,
          state.getSimTime(),
          this.involvedResourcesId,
          evacuationTask.Uid
        )
      );

      evacuationTask.createSubTask(
        this.eventId,
        this.ownerId,
        this.involvedResourcesId,
        this.patientId,
        this.hospitalId,
        this.patientUnitAtHospital,
        this.doResourcesComeBack,
        travelTime,
        this.feedbackWhenReturning,
        getSquadDef(this.evacuationActionPayload.transportSquad)
      );
    }
  }

  protected cancelInternal(state: MainSimulationState): void {
    // we free the resources so that they are available for other actions
    localEventManager.queueLocalEvent(
      new UnReserveResourcesLocalEvent(this.eventId, state.getSimTime(), this.involvedResourcesId)
    );
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
