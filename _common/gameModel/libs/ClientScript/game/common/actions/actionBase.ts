// EVALUATION_PRIORITY 10

import { actionLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { getContextUidGenerator } from '../../executionContext/gameExecutionContextController';
import {
  ActionId,
  ActionTemplateUid,
  ActorId,
  GlobalEventId,
  SimDuration,
  SimTime,
  TranslationKey,
} from '../baseTypes';
import { Effect, evaluateEffectImpacts } from '../impacts/effect';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { ChoiceActivable, getChoiceActivable } from '../simulationState/activableState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from './choiceDescriptor/choiceDescriptor';

export type ActionStatus = 'Uninitialized' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined;

const ACTION_SEED_ID: ActionId = 3000;

/**
 * Instantiated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase {
  protected static slogger = Helpers.getLogger('actions-logger');

  protected readonly logger = ActionBase.slogger;

  public readonly Uid: ActionId;

  protected status: ActionStatus;

  protected constructor(
    readonly startTime: SimTime,
    protected readonly eventId: GlobalEventId,
    public readonly ownerId: ActorId,
    protected readonly templateId: ActionTemplateUid
  ) {
    this.Uid = getContextUidGenerator().getNext('ActionBase', ACTION_SEED_ID);
    this.status = 'Uninitialized';
  }

  /**
   * Will update the given status
   * @param state the current state that will be updated
   */
  public abstract update(state: MainSimulationState): void;

  public abstract duration(): SimDuration;

  public getStatus(): ActionStatus {
    return this.status;
  }

  public getTemplateId(): ActionTemplateUid {
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
  public readonly actionNameKey: TranslationKey | ITranslatableContent;
  /**
   * Adds SimFlags values to state at the end of the action
   */
  public provideFlagsToState: SimFlag[];

  protected constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(startTimeSec, eventId, ownerId, templateUid);
    this.durationSec = durationSeconds;
    this.actionNameKey = actionNameKey;
    this.provideFlagsToState = provideFlagsToState;
  }

  protected abstract dispatchInitEvents(state: Readonly<MainSimulationState>): void;

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
    if (typeof this.actionNameKey === 'string') {
      return getTranslation('mainSim-actions-tasks', this.actionNameKey);
    } else {
      return I18n.translate(this.actionNameKey);
    }
  }
}

export abstract class ChoiceAction extends StartEndAction {
  // visibility ?
  public readonly choice: ChoiceDescriptor;

  protected constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    //messageKey: TranslationKey,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = [],
    choice: ChoiceDescriptor
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      //messageKey,
      ownerId,
      templateUid,
      provideFlagsToState
    );
    this.choice = choice;
  }

  protected applyChoice(state: Readonly<MainSimulationState>): void {
    if (this.choice != undefined) {
      const choiceActivable: ChoiceActivable | undefined = getChoiceActivable(
        state,
        this.choice.uid
      );
      const selectedEffect: Effect | undefined = this.choice.effects.find(
        e => e.uid === choiceActivable?.selectedEffect
      );

      if (selectedEffect) {
        const eventsToQueue = evaluateEffectImpacts(state, selectedEffect, this.Uid);
        eventsToQueue.forEach(localEvent => getLocalEventManager().queueLocalEvent(localEvent));
      } else {
        actionLogger.warn(`choice '${this.choice.uid}' has no selected effect`);
      }
    } else {
      actionLogger.error('a choice is needed to run the action');
    }
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>) {
    this.applyChoice(state);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// fully configurable choice action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class FullyConfigurableChoiceAction extends ChoiceAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[],
    choice: ChoiceDescriptor
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState,
      choice
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    // nothing to do
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);
    // nothing more to do
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
