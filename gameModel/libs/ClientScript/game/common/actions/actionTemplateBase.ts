import { getTranslation } from '../../../tools/translation';
import { ActionType } from '../actionType';
import { Actor, InterventionRole } from '../actors/actor';
import {
  ActionTemplateUid,
  ActorId,
  SimDuration,
  SimTime,
  TaskId,
  TranslationKey,
} from '../baseTypes';
import { initBaseEvent } from '../events/baseEvent';
import { CasuMessageActionEvent, CasuMessagePayload } from '../events/casuMessageEvent';
import { MapChoiceEvent } from '../events/defineMapObjectEvent';
import { EvacuationActionEvent, EvacuationActionPayload } from '../events/evacuationMessageEvent';
import {
  ActionCreationEvent,
  AppointActorEvent,
  ChoiceEvent,
  MoveActorEvent,
  MoveResourcesAssignTaskEvent,
  RequestPretriageReportEvent,
  StandardActionEvent,
} from '../events/eventTypes';
import { FullEvent } from '../events/eventUtils';
import { RadioMessageActionEvent, RadioMessagePayload } from '../events/radioMessageEvent';
import { PlanActionLocalEvent } from '../localEvents/localEventBase';
import { RadioType } from '../radio/communicationType';
import { CommMedia } from '../resources/resourceReachLogic';
import { HumanResourceType, ResourceTypeAndNumber, VehicleType } from '../resources/resourceType';
import { getOngoingActions } from '../simulationState/actionStateAccess';
import {
  ActionTemplateActivable,
  getActionTemplateActivable,
} from '../simulationState/activableState';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  ActionBase,
  ActivateRadioSchemaAction,
  AppointActorAction,
  CasuMessageAction,
  DisplayMessageAction,
  EvacuationAction,
  FullyConfigurableChoiceAction,
  MapChoiceAction,
  MoveActorAction,
  MoveResourcesAssignTaskAction,
  PCChoiceAction,
  PCFrontChoiceAction,
  ParkChoiceAction,
  RadioDrivenAction,
  RequestPretriageReportAction,
  SendRadioMessageAction,
  SituationUpdateAction,
} from './actionBase';
import * as ActionLogic from './actionLogic';
import { ChoiceDescriptor } from './choiceDescriptor/choiceDescriptor';

export enum SimFlag {
  PCS_ARRIVED = 'PCS_ARRIVED',
  PCFRONT_BUILT = 'PCFRONT_BUILT',
  MCS_ARRIVED = 'MCS_ARRIVED',
  ACS_ARRIVED = 'ACS_ARRIVED',
  PC_BUILT = 'PC_BUILT',
  AMBULANCE_PARK_BUILT = 'AMBULANCE_PARK_BUILT',
  HELICOPTER_PARK_BUILT = 'HELICOPTER_PARK_BUILT',
  ACS_MCS_ANNOUNCED = 'ACS_MCS_ANNOUNCED',
  RADIO_SCHEMA_ACTIVATED = 'RADIO_SCHEMA_ACTIVATED',
  EVASAN_ARRIVED = 'EVASAN_ARRIVED',
  EVASAN_ANNOUNCED = 'EVASAN_ANNOUNCED',
  PMA_BUILT = 'PMA_BUILT',
  LEADPMA_ARRIVED = 'LEADPMA_ARRIVED',
  LEADPMA_ANNOUNCED = 'LEADPMA_ANNOUNCED',
  PMA_OPEN = 'PMA_OPEN',
}

/**
 * This class is the descriptor of an action, it represents the data of a playable action
 * It is meant to contain the generic information of an action as well as the conditions for this action to available
 * It is an action generator
 */
export abstract class ActionTemplateBase<
  ActionT extends ActionBase = ActionBase,
  EventT extends ActionCreationEvent = ActionCreationEvent,
  UserInput = unknown
> {
  /**
   * @param uid unique identifier
   * @param title action display title translation key
   * @param description short description of the action
   * @param replayable defaults to false, when true the action can be played multiple times
   * @param category The type of action
   * @param requiredFlags list of simulation flags that make the action available, undefined or empty array means no flag condition
   * @param raisedFlags list of simulation flags added to state when action ends
   * @param availableToRoles list of roles admitted to launch the action, undefined or empty array means available to everyone
   */
  protected constructor(
    public readonly uid: ActionTemplateUid,
    protected readonly title: TranslationKey | ITranslatableContent,
    protected readonly description: TranslationKey | ITranslatableContent,
    public replayable: boolean = false,
    public readonly category: ActionType = ActionType.ACTION,
    private requiredFlags: SimFlag[] = [SimFlag.PCFRONT_BUILT],
    protected raisedFlags: SimFlag[] = [],
    protected availableToRoles: InterventionRole[] = []
  ) {
    // empty constructor
  }

  /**
   * Build an instance from an incoming global event
   */
  protected abstract createActionFromEvent(event: FullEvent<EventT>): ActionT;

  /**
   * Generate an event to be broadcast
   * @param timeStamp current time
   * @param initiator the actor that initiates this action and will be its owner
   * @param params    additional data to send
   */
  public abstract buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: UserInput
  ): EventT;

  /**
   * Determines if the action can be launched given the current state of the game and the actor being played
   * To add more conditions, override the isAvailableCustom custom function
   * @param state the current game state
   * @param actor currently selected actor
   * @see isAvailableCustom function
   * @returns true if the player can trigger this action
   */
  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return (
      this.flagWiseAvailable(state) &&
      this.isActive(state) &&
      this.canPlayAgain(state) &&
      this.isAvailableCustom(state, actor) &&
      this.roleWiseAvailable(actor.Role)
    );
  }

  /**
   * Override adds additional conditions for this template action availability
   * @param state
   * @param actor
   * @see isAvailable
   */
  protected abstract isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean;

  public isInCategory(category: ActionType): boolean {
    return category === this.category;
  }

  protected isActive(state: Readonly<MainSimulationState>): boolean {
    const actionTemplateActivable: ActionTemplateActivable | undefined = getActionTemplateActivable(
      state,
      this.uid
    );

    // No activable means that it is a basic action template, no check to do
    if (!actionTemplateActivable) {
      return true;
    }

    return actionTemplateActivable.active;
  }

  protected flagWiseAvailable(state: Readonly<MainSimulationState>): boolean {
    if (!this.requiredFlags || this.requiredFlags.length == 0) {
      return true;
    }

    return this.requiredFlags.every(f => state.hasFlag(f));
  }

  protected roleWiseAvailable(role: InterventionRole): boolean {
    return this.availableToRoles.includes(role) || this.availableToRoles.length === 0;
  }

  /**
   * @returns A translation to a short description of the action
   */
  public getDescription(): string {
    if (typeof this.description === 'string') {
      return getTranslation('mainSim-actions-tasks', this.description);
    } else {
      return I18n.translate(this.description);
    }
  }

  /**
   * @returns A translation to the title of the action
   */
  public getTitle(): string {
    if (typeof this.title === 'string') {
      return getTranslation('mainSim-actions-tasks', this.title);
    } else {
      return I18n.translate(this.title);
    }
  }

  protected initBaseEvent(timeStamp: SimTime, actorId: ActorId): ActionCreationEvent {
    return {
      ...initBaseEvent(actorId),
      type: 'ActionCreationEvent',
      templateUid: this.uid,
      triggerTime: timeStamp,
    };
  }

  /**
   * Generate a local event to create an action from a broadcasted global event
   * @param globalEvent the broadcasted event
   */
  public buildLocalEvent(globalEvent: FullEvent<EventT>): PlanActionLocalEvent {
    const action = this.createActionFromEvent(globalEvent);
    return new PlanActionLocalEvent({
      parentEventId: globalEvent.id,
      simTimeStamp: globalEvent.payload.triggerTime,
      action,
    });
  }

  /**
   * If replayable returns true, else returns true if the action has not yet been planned and started
   */
  protected canPlayAgain(state: Readonly<MainSimulationState>): boolean {
    if (this.replayable) {
      return true;
    }

    const action = state
      .getInternalStateObject()
      .actions.find(action => action.getTemplateId() === this.uid);
    //either action has not been played or it is planned but can still be cancelled
    return action == undefined || action.startTime === state.getSimTime();
  }

  /**
   * If concurrently playable by several actors returns true
   */
  public canConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).find(action => action.ownerId === actorUid) === undefined &&
      this.customCanConcurrencyWiseBePlayed(state, actorUid)
    );
  }

  protected customCanConcurrencyWiseBePlayed(
    _state: Readonly<MainSimulationState>,
    _actorUid: ActorId
  ) {
    return true;
  }
}

export abstract class StartEndTemplate<
  ActionT extends ActionBase = ActionBase,
  EventT extends ActionCreationEvent = ActionCreationEvent,
  UserInput = unknown
> extends ActionTemplateBase<ActionT, EventT, UserInput> {
  public readonly duration: SimDuration;

  protected constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    replayable = false,
    category: ActionType = ActionType.ACTION,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      replayable,
      category,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
    this.duration = duration;
  }

  /** Default implementation : no custom conditions */
  protected override isAvailableCustom(
    _state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>
  ): boolean {
    return true;
  }
}

export abstract class ChoiceTemplate<
  ActionT extends ActionBase = ActionBase,
  EventT extends ActionCreationEvent = ActionCreationEvent,
  UserInput = unknown
> extends StartEndTemplate<ActionT, EventT, UserInput> {
  public readonly choices: ChoiceDescriptor[];

  protected constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //message: TranslationKey,
    replayable = false,
    category: ActionType = ActionType.ACTION,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices: ChoiceDescriptor[] = [],
    private readonly nbMaxRepetitions: number = 0 // 0 is considered as infinitely
  ) {
    super(
      uid,
      title,
      description,
      duration,
      //message,
      replayable,
      category,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
    this.choices = choices;
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>
  ): boolean {
    const actionTemplateActivable: ActionTemplateActivable | undefined = getActionTemplateActivable(
      state,
      this.uid
    );
    const hasMaxRepetitions: boolean =
      this.nbMaxRepetitions != undefined && this.nbMaxRepetitions > 0;

    return (
      ActionLogic.getAvailableChoices(state, this).length > 0 &&
      (!actionTemplateActivable ||
        !hasMaxRepetitions ||
        actionTemplateActivable.count < this.nbMaxRepetitions)
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * The result of the action is to display a message in a radio channel or as a notification
 */
export class DisplayMessageActionTemplate extends StartEndTemplate<DisplayMessageAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly message: TranslationKey,
    replayable: boolean = false,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    readonly channel?: RadioType | undefined
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): DisplayMessageAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new DisplayMessageAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      ownerId,
      this.uid,
      this.raisedFlags,
      this.channel
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }
}

export class CasuMessageTemplate extends StartEndTemplate<
  CasuMessageAction,
  CasuMessageActionEvent,
  CasuMessagePayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.CASU_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<CasuMessageActionEvent>): CasuMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new CasuMessageAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.casuMessagePayload
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: CasuMessagePayload
  ): CasuMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      casuMessagePayload: params,
    };
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === RadioType.CASU &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

export type PretriageReportActionPayload = {
  pretriageLocation: LOCATION_ENUM;
};

export class PretriageReportTemplate extends StartEndTemplate<
  RequestPretriageReportAction,
  RequestPretriageReportEvent,
  PretriageReportActionPayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    private feedbackWhenStarted: TranslationKey,
    private feedbackWhenReport: TranslationKey,
    replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.RESOURCES_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<RequestPretriageReportEvent>
  ): RequestPretriageReportAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new RequestPretriageReportAction(
      payload.triggerTime,
      this.duration,
      this.feedbackWhenStarted,
      this.feedbackWhenReport,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.pretriageLocation
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: PretriageReportActionPayload
  ): RequestPretriageReportEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      pretriageLocation: params.pretriageLocation,
    };
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === RadioType.RESOURCES &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

export class ActivateRadioSchemaActionTemplate extends StartEndTemplate<ActivateRadioSchemaAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly requestMessage: TranslationKey,
    readonly authorizedReplyMessage: TranslationKey,
    readonly unauthorizedReplyMessage: TranslationKey,
    readonly channel: RadioType,
    replayable: boolean = false,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.CASU_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<StandardActionEvent>
  ): ActivateRadioSchemaAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new ActivateRadioSchemaAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.requestMessage,
      this.authorizedReplyMessage,
      this.unauthorizedReplyMessage,
      ownerId,
      this.uid,
      this.channel,
      this.raisedFlags
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>
  ): boolean {
    return !state.hasFlag(SimFlag.RADIO_SCHEMA_ACTIVATED);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// fully configurable choice action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class FullyConfigurableChoiceActionTemplate<
  ActionT extends FullyConfigurableChoiceAction = FullyConfigurableChoiceAction
> extends ChoiceTemplate<FullyConfigurableChoiceAction, ChoiceEvent, ChoiceDescriptor> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[],
    nbMaxRepetitions?: number
  ) {
    super(
      uid,
      title,
      description,
      duration,
      true, // replayable forced to true. It is handled with nbMaxRepetitions
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices,
      nbMaxRepetitions
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    payload: ChoiceDescriptor
  ): ChoiceEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      choice: payload,
    };
  }

  protected createActionFromEvent(event: FullEvent<ChoiceEvent>): FullyConfigurableChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new FullyConfigurableChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// place a map item
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class MapChoiceActionTemplate<
  ActionT extends MapChoiceAction = MapChoiceAction
> extends ChoiceTemplate<MapChoiceAction, MapChoiceEvent, ChoiceDescriptor> {
  public readonly binding?: LOCATION_ENUM;

  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //message: TranslationKey,
    //replayable = false,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[],
    binding?: LOCATION_ENUM
  ) {
    super(
      uid,
      title,
      description,
      duration,
      false, // replayable forced to false. No map action can be run twice
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices
    );
    this.binding = binding;
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    payload: ChoiceDescriptor
  ): MapChoiceEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      choice: payload,
    };
  }

  protected createActionFromEvent(event: FullEvent<MapChoiceEvent>): MapChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new MapChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice,
      this.binding
    ) as ActionT;
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actor.Uid);
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actorUid);
  }
}

// -------------------------------------------------------------------------------------------------
// place PC Front
// -------------------------------------------------------------------------------------------------

export class PCFrontChoiceTemplate extends MapChoiceActionTemplate<PCFrontChoiceAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //message: TranslationKey,
    //replayable = false,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      //message,
      //replayable,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices
    );
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): PCFrontChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new PCFrontChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place PC San
// -------------------------------------------------------------------------------------------------

export class PCChoiceTemplate extends MapChoiceActionTemplate<PCChoiceAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //message: TranslationKey,
    //replayable = false,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      //message,
      //replayable,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices
    );
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): PCChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new PCChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place a park item
// -------------------------------------------------------------------------------------------------

export class ParkChoiceTemplate extends MapChoiceActionTemplate<ParkChoiceAction> {
  public declare readonly binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark;
  public readonly vehicleType: VehicleType;

  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    //message: TranslationKey,
    //replayable = false,
    binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark,
    vehicleType: VehicleType,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      //message,
      //replayable,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices,
      binding
    );
    this.vehicleType = vehicleType;
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): ParkChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new ParkChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice,
      this.binding,
      this.vehicleType
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  Interaction with human resources
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export type MoveResourcesAssignTaskActionInput = {
  commMedia: CommMedia;
  sourceLocation: LOCATION_ENUM;
  targetLocation: LOCATION_ENUM;
  sentResources: ResourceTypeAndNumber;
  sourceTaskId: TaskId;
  targetTaskId: TaskId;
};

/**
 * Action template to create an action to send resources to a location and assign a task
 */
export class MoveResourcesAssignTaskActionTemplate extends StartEndTemplate<
  MoveResourcesAssignTaskAction,
  MoveResourcesAssignTaskEvent,
  MoveResourcesAssignTaskActionInput
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.RESOURCES_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: MoveResourcesAssignTaskActionInput
  ): MoveResourcesAssignTaskEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      commMedia: params.commMedia,
      sourceLocation: params.sourceLocation,
      targetLocation: params.targetLocation,
      sentResources: params.sentResources,
      sourceTaskId: params.sourceTaskId,
      targetTaskId: params.targetTaskId,
    };
  }

  protected createActionFromEvent(
    event: FullEvent<MoveResourcesAssignTaskEvent>
  ): MoveResourcesAssignTaskAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new MoveResourcesAssignTaskAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.commMedia,
      payload.sourceLocation,
      payload.targetLocation,
      payload.sentResources,
      payload.sourceTaskId,
      payload.targetTaskId
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * The goal of the action is to broadcast a written message from a player on a radio channel
 */
export class SendRadioMessageTemplate extends StartEndTemplate {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly radioChannel: RadioType,
    replayable: boolean = true,
    category: ActionType,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      category,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<RadioMessageActionEvent>
  ): SendRadioMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new SendRadioMessageAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      this.radioChannel,
      payload.radioMessagePayload
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: RadioMessagePayload
  ): RadioMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      radioMessagePayload: params,
    };
  }

  public override getTitle(): string {
    return 'SendRadioMessageTemplateTitle';
  }

  public override getDescription(): string {
    return 'SendRadioMessageTemplateDescription';
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === this.radioChannel &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  actor
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class MoveActorActionTemplate extends StartEndTemplate {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<MoveActorEvent>): MoveActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new MoveActorAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      [],
      payload.location
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: LOCATION_ENUM
  ): MoveActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      location: params,
    };
  }
}

/**
 * Appoints a new actor if necessary conditions are met
 *
 */
export class AppointActorActionTemplate extends StartEndTemplate<
  AppointActorAction,
  AppointActorEvent,
  InterventionRole
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    replayable = true,
    readonly noResourceFailureMessageKey: TranslationKey,
    readonly refusalFailureMessageKey: TranslationKey,
    readonly actorRole: InterventionRole,
    readonly typeOfResource: HumanResourceType[],
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<AppointActorEvent>): AppointActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new AppointActorAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      this.actorRole,
      this.typeOfResource,
      this.noResourceFailureMessageKey,
      this.refusalFailureMessageKey
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: InterventionRole
  ): AppointActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      actorRole: params,
    };
  }

  // available if no such role is present
  // might change if multiple AL can be summoned
  // cannot be planned more than once at the same time
  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return (
      state.getAllActors().every(act => act.Role !== this.actorRole) &&
      !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actor.Uid)
    );
  }
}

/**
 * Book a moment for a situation update (point de situation)
 */
export interface SituationUpdatePayload {
  duration: SimDuration;
}

export class SituationUpdateActionTemplate extends StartEndTemplate<
  SituationUpdateAction,
  StandardActionEvent,
  SituationUpdatePayload
> {
  constructor(uid: ActionTemplateUid, title: TranslationKey, description: TranslationKey) {
    super(uid, title, description, 0, true, ActionType.ACTION);
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): SituationUpdateAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new SituationUpdateAction(
      payload.triggerTime,
      payload.durationSec,
      event.id,
      this.title,
      ownerId,
      this.uid
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: SituationUpdatePayload
  ): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: params.duration, // the duration is sent as a payload
    };
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
export class EvacuationActionTemplate extends StartEndTemplate<
  EvacuationAction,
  EvacuationActionEvent,
  EvacuationActionPayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly msgTaskRequest: TranslationKey,
    readonly feedbackWhenReturning: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    readonly msgEvacuationRefused: TranslationKey,
    replayable = true,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      replayable,
      ActionType.EVASAN_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<EvacuationActionEvent>): EvacuationAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new EvacuationAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.msgTaskRequest,
      this.feedbackWhenReturning,
      this.msgEvacuationAbort,
      this.msgEvacuationRefused,
      ownerId,
      this.uid,
      payload.evacuationActionPayload,
      this.raisedFlags
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: EvacuationActionPayload
  ): EvacuationActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      evacuationActionPayload: params,
    };
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
