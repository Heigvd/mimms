// EVALUATION_PRIORITY 10

import { getTranslation } from '../../../../tools/translation';
import { ActionType } from '../../actionType';
import { Actor, InterventionRole } from '../../actors/actor';
import { ActionTemplateUid, ActorId, SimDuration, SimTime, TranslationKey } from '../../baseTypes';
import { initBaseEvent } from '../../events/baseEvent';
import { ActionCreationEvent, ChoiceEvent } from '../../events/eventTypes';
import { FullEvent } from '../../events/eventUtils';
import { PlanActionLocalEvent } from '../../localEvents/localEventBase';
import { getOngoingActions, getStartedActionsOfTemplate } from '../../simulationState/actionStateAccess';
import { ActionTemplateActivable, getActionTemplateActivable } from '../../simulationState/activableState';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ActionBase, FullyConfigurableChoiceAction } from '../actionBase';
import * as ActionLogic from '../actionLogic';
import { ChoiceDescriptor } from '../choiceDescriptor/choiceDescriptor';

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
   * @param repeats defaults to 1, prevent the action to be run more than x times. < 1 means that it can be played infinitely
   * @param category The type of action
   * @param requiredFlags list of simulation flags that make the action available, undefined or empty array means no flag condition
   * @param raisedFlags list of simulation flags added to state when action ends
   * @param availableToRoles list of roles admitted to launch the action, undefined or empty array means available to everyone
   */
  protected constructor(
    public readonly uid: ActionTemplateUid,
    protected readonly title: TranslationKey | ITranslatableContent,
    protected readonly description: TranslationKey | ITranslatableContent,
    public repeats: number = 1,
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
      this.roleWiseAvailable(actor.Role) &&
      this.isActive(state) &&
      this.canPlayAgain(state) &&
      this.isAvailableCustom(state, actor)
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
      source: { type: 'plan-action' },
      simTimeStamp: globalEvent.payload.triggerTime,
      action,
    });
  }

  protected canPlayAgain(state: Readonly<MainSimulationState>): boolean {
    if (this.repeats < 1) {
      // no repetition restriction
      return true;
    }

    // Note : when an action is just planned, it is not taken into account.
    // That means if we don't want that several actors can plan at the same time the last occurrence,
    // it has to be handled in the isAvailableCustom function

    return getStartedActionsOfTemplate(state, this.uid).length < this.repeats;
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
    repeats: number,
    category: ActionType = ActionType.ACTION,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(uid, title, description, repeats, category, requiredFlags, raisedFlags, availableToRoles);
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
    repeats: number,
    category: ActionType = ActionType.ACTION,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices: ChoiceDescriptor[] = []
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
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
    return ActionLogic.getAvailableChoices(state, this).length > 0;
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
    repeats: number,
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
      repeats,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices
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
