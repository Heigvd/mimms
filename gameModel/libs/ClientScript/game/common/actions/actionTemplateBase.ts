import {
  ActionTemplateId,
  ActorId,
  SimDuration,
  SimTime,
  TaskId,
  TemplateRef,
  TranslationKey,
} from '../baseTypes';
import { initBaseEvent } from '../events/baseEvent';
import { FullEvent } from '../events/eventUtils';
import {
  ActionCreationEvent,
  AppointActorEvent,
  MoveActorEvent,
  MoveResourcesAssignTaskEvent,
  StandardActionEvent,
} from '../events/eventTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  ActionBase,
  CasuMessageAction,
  GetInformationAction,
  SendRadioMessageAction,
  SelectionFixedMapEntityAction,
  MoveActorAction,
  ArrivalAnnoucementAction,
  MoveResourcesAssignTaskAction,
  AppointActorAction,
  SelectionPMAAction,
  SelectionParkAction,
  RadioDrivenAction,
  EvacuationAction,
} from './actionBase';
import {
  SelectionFixedMapEntityEvent,
  FixedMapEntity,
  createFixedMapEntityInstanceFromAnyObject,
} from '../events/defineMapObjectEvent';
import { PlanActionLocalEvent } from '../localEvents/localEventBase';
import { Actor, InterventionRole } from '../actors/actor';
import { getTranslation } from '../../../tools/translation';
import { ResourceType, ResourceTypeAndNumber, VehicleType } from '../resources/resourceType';
import { CasuMessageActionEvent, CasuMessagePayload } from '../events/casuMessageEvent';
import { RadioMessageActionEvent, RadioMessagePayload } from '../events/radioMessageEvent';
import { ActionType } from '../actionType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { getOngoingActions } from '../simulationState/actionStateAccess';
import { EvacuationActionEvent, EvacuationActionPayload } from '../events/evacuationMessageEvent';

export enum SimFlag {
  PCS_ARRIVED = 'PCS-ARRIVED',
  MEETINGPOINT_BUILT = 'MEETINGPOINT_BUILT',
  MCS_ARRIVED = 'MCS_ARRIVED',
  ACS_ARRIVED = 'ACS_ARRIVED',
  PC_BUILT = 'PC_BUILT',
  AMBULANCE_PARK_BUILT = 'AMBULANCE_PARK_BUILT',
  HELICOPTER_PARK_BUILT = 'HELICOPTER_PARK_BUILT',
  ACS_MCS_ANNOUNCED = 'ACS_MCS_ANNOUNCED',
  EVASAN_ARRIVED = 'EVASAN_ARRIVED',
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
  private static IdSeed = 1000;

  public readonly Uid: ActionTemplateId;

  /**
   * @param title action display title translation key
   * @param description short description of the action
   * @param replayable defaults to false, when true the action can be played multiple times
   * @param flags list of simulation flags that make the action available, undefined or empty array means no flag condition
   * @param provideFlagsToState list of simulation flags added to state when action ends
   */
  public constructor(
    protected readonly title: TranslationKey,
    protected readonly description: TranslationKey,
    public replayable: boolean = false,
    protected readonly category: ActionType = ActionType.ACTION,
    private flags: SimFlag[] = [SimFlag.MEETINGPOINT_BUILT],
    protected provideFlagsToState: SimFlag[] = [],
    protected availableToRoles: InterventionRole[] = []
  ) {
    this.Uid = ActionTemplateBase.IdSeed++;
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
  }

  /**
   * a deterministic unique identifier for this template
   */
  public abstract getTemplateRef(): TemplateRef;

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

  protected flagWiseAvailable(state: Readonly<MainSimulationState>): boolean {
    if (!this.flags || this.flags.length == 0) {
      return true;
    }

    return this.flags.every(f => state.hasFlag(f));
  }

  protected roleWiseAvailable(role: InterventionRole): boolean {
    return this.availableToRoles.includes(role) || this.availableToRoles.length === 0;
  }

  /**
   * @returns A translation to a short description of the action
   */
  public abstract getDescription(): TranslationKey;
  /**
   * @returns A translation to the title of the action
   */
  public abstract getTitle(): TranslationKey;

  protected initBaseEvent(timeStamp: SimTime, actorId: ActorId): ActionCreationEvent {
    return {
      ...initBaseEvent(actorId),
      type: 'ActionCreationEvent',
      templateRef: this.getTemplateRef(),
      triggerTime: timeStamp,
    };
  }

  /**
   * Generate a local event to create an action from a broadcasted global event
   * @param globalEvent the broadcasted event
   */
  public buildLocalEvent(globalEvent: FullEvent<EventT>): PlanActionLocalEvent {
    const action = this.createActionFromEvent(globalEvent);
    return new PlanActionLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, action);
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
      .actions.find(action => action.getTemplateId() === this.Uid);
    //either action has not been played or it is planned but can still be cancelled
    return action == undefined || action.startTime === state.getSimTime();
  }

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
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ) {
    return (
      getOngoingActions(state).find(action => action.getTemplateId() === this.Uid) === undefined
    );
    //Should be: return true;  // and overridden in subclasses as needed
  }

  /**
   * @return true if the action should be created in the timeline right away when the user clicks,
   * false if some other interaction should take place in between
   * @deprecated was used for map entities positionning
   */
  public planActionEventOnFirstClick(): boolean {
    return true;
  }
}

export abstract class StartEndTemplate<
  ActionT extends ActionBase = ActionBase,
  EventT extends ActionCreationEvent = ActionCreationEvent,
  UserInput = unknown
> extends ActionTemplateBase<ActionT, EventT, UserInput> {
  public readonly duration: SimDuration;
  public readonly message: TranslationKey;

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = false,
    category: ActionType = ActionType.ACTION,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(title, description, replayable, category, flags, provideFlagsToState, availableToRoles);
    this.duration = duration;
    this.message = message;
  }

  /** Default implementation : no custom conditions */
  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return true;
  }
}

export class GetInformationTemplate extends StartEndTemplate {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = false,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTION,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): GetInformationAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new GetInformationAction(
      payload.triggerTime,
      this.duration,
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }

  public getTemplateRef(): TemplateRef {
    return 'GetInformationTemplate' + '_' + this.title;
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }
}

export class CasuMessageTemplate extends StartEndTemplate<
  CasuMessageAction,
  CasuMessageActionEvent,
  CasuMessagePayload
> {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = true,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.CASU_RADIO,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  public getTemplateRef(): TemplateRef {
    return 'DefineCasuMessageObjectTemplate' + '_' + this.title;
  }

  protected createActionFromEvent(event: FullEvent<CasuMessageActionEvent>): CasuMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new CasuMessageAction(
      payload.triggerTime,
      this.duration,
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid,
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

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === ActionType.CASU_RADIO
      ).length === 0
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// place a map item
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Template of an action to select the place of a fixed map entity.
 */
export class SelectionFixedMapEntityTemplate<
  ActionT extends SelectionFixedMapEntityAction = SelectionFixedMapEntityAction
> extends StartEndTemplate<
  SelectionFixedMapEntityAction,
  SelectionFixedMapEntityEvent,
  FixedMapEntity
> {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    public readonly fixedMapEntity: FixedMapEntity,
    replayable = false,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTION,
      flags,
      provideFlagsToState,
      availableToRoles
    );
    this.fixedMapEntity = fixedMapEntity;
  }

  public getTemplateRef(): string {
    return 'SelectionFixedMapEntityTemplate' + '_' + this.title;
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    payload: FixedMapEntity
  ): SelectionFixedMapEntityEvent {
    //???? payload??
    //Is there a way to keep the original instance class?
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      fixedMapEntity: payload,
    };
  }

  protected createActionFromEvent(
    event: FullEvent<SelectionFixedMapEntityEvent>
  ): SelectionFixedMapEntityAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new SelectionFixedMapEntityAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      ownerId,
      this.Uid,
      createFixedMapEntityInstanceFromAnyObject(payload.fixedMapEntity),
      this.provideFlagsToState
    );
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }
}

// -------------------------------------------------------------------------------------------------
// place PMA
// -------------------------------------------------------------------------------------------------

/**
 * Template of an action to select the place of the PMA
 */
export class SelectionPMATemplate extends SelectionFixedMapEntityTemplate<SelectionPMAAction> {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    fixedMapEntity: FixedMapEntity,
    replayable = false,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      fixedMapEntity,
      replayable,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  public override getTemplateRef(): string {
    return 'SelectionPMATemplate' + '_' + this.title;
  }

  protected override createActionFromEvent(
    event: FullEvent<SelectionFixedMapEntityEvent>
  ): SelectionPMAAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new SelectionPMAAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      ownerId,
      this.Uid,
      createFixedMapEntityInstanceFromAnyObject(payload.fixedMapEntity),
      this.provideFlagsToState
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place a park item
// -------------------------------------------------------------------------------------------------

/**
 * Template of an action to select the place of a parking
 */
export class SelectionParkTemplate extends SelectionFixedMapEntityTemplate<SelectionParkAction> {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    fixedMapEntity: FixedMapEntity,
    readonly vehicleType: VehicleType,
    replayable = false,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      fixedMapEntity,
      replayable,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  public override getTemplateRef(): string {
    return 'SelectionParkTemplate' + '_' + this.title;
  }

  protected override createActionFromEvent(
    event: FullEvent<SelectionFixedMapEntityEvent>
  ): SelectionParkAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new SelectionParkAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      ownerId,
      this.Uid,
      createFixedMapEntityInstanceFromAnyObject(payload.fixedMapEntity),
      this.vehicleType,
      this.provideFlagsToState
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  Interaction with human resources
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export type MoveResourcesAssignTaskActionInput = {
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
  public readonly failMessage: TranslationKey;

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    failMessage: TranslationKey,
    replayable = true,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ALLOCATE_RESOURCES,
      flags,
      provideFlagsToState,
      availableToRoles
    );
    this.failMessage = failMessage;
  }

  public getTemplateRef(): TemplateRef {
    return 'MoveResourcesAssignTaskActionTemplate' + '_' + this.title;
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: MoveResourcesAssignTaskActionInput
  ): MoveResourcesAssignTaskEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      failMessage: this.failMessage,
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
      this.message,
      this.failMessage,
      this.title,
      event.id,
      ownerId,
      this.Uid,
      event.payload.sourceLocation,
      event.payload.targetLocation,
      event.payload.sentResources,
      event.payload.sourceTaskId,
      event.payload.targetTaskId
    );
  }
}

export class SendRadioMessage extends StartEndTemplate {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = true,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTORS_RADIO,
      flags,
      provideFlagsToState,
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
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid,
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

  public getTemplateRef(): TemplateRef {
    return 'SendRadioMessageTemplate' + '_' + this.title;
  }

  public getDescription(): string {
    return 'SendRadioMessageTemplateDescription';
  }

  public getTitle(): string {
    return 'SendRadioMessageTemplateTitle';
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === ActionType.ACTORS_RADIO
      ).length === 0
    );
  }
}

export class MoveActorActionTemplate extends StartEndTemplate {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = true,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTION,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<MoveActorEvent>): MoveActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new MoveActorAction(
      payload.triggerTime,
      this.duration,
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid,
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

  public getTemplateRef(): TemplateRef {
    return 'MoveActorTemplate' + '_' + this.title;
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }
}

export class ArrivalAnnoucementTemplate extends StartEndTemplate {
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = false,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTION,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): ArrivalAnnoucementAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new ArrivalAnnoucementAction(
      payload.triggerTime,
      this.duration,
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid,
      this.provideFlagsToState
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }

  public getTemplateRef(): TemplateRef {
    return 'ArrivalAnnoucementTemplate' + '_' + this.title;
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
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
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    replayable = true,
    readonly wentWrongMessageKey: TranslationKey,
    readonly actorRole: InterventionRole,
    readonly typeOfResource: ResourceType,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.ACTION,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<AppointActorEvent>): AppointActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new AppointActorAction(
      payload.triggerTime,
      this.duration,
      this.message,
      this.title,
      event.id,
      ownerId,
      this.Uid,
      [],
      this.actorRole,
      this.typeOfResource,
      this.wentWrongMessageKey
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

  // only available if no such role is present
  // might change if multiple AL can be summoned
  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return state.getAllActors().every(act => act.Role !== this.actorRole);
  }

  public getTemplateRef(): TemplateRef {
    return 'AppointActorActionTemplate' + '_' + this.title;
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
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
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
    readonly feedbackWhenStarted: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    replayable = true,
    flags?: SimFlag[],
    provideFlagsToState?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      duration,
      message,
      replayable,
      ActionType.EVASAN_RADIO,
      flags,
      provideFlagsToState,
      availableToRoles
    );
  }

  public getTemplateRef(): TemplateRef {
    return 'EvacuationActionTemplate' + '_' + this.title;
  }

  public getTitle(): TranslationKey {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): TranslationKey {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  protected createActionFromEvent(event: FullEvent<EvacuationActionEvent>): EvacuationAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new EvacuationAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      this.feedbackWhenStarted,
      this.msgEvacuationAbort,
      ownerId,
      this.Uid,
      payload.evacuationActionPayload,
      this.provideFlagsToState
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
