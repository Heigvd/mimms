import { setPreviousReferenceState } from '../gameInterface/afterUpdateCallbacks';
import { mainSimLogger } from '../tools/logger';
import { getTranslation } from '../tools/translation';
import { getCurrentPlayerActorIds } from '../UIfacade/actorFacade';
import { IUniqueActionTemplates } from './actionTemplatesData';
import { ActionTemplateBase } from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { ActionTemplateUid, ActorId } from './common/baseTypes';
import { TimeSliceDuration, TRAINER_NAME } from './common/constants';
import { initBaseEvent } from './common/events/baseEvent';
import {
  ActionCreationEvent,
  GameOptionsEvent,
  isLegacyGlobalEvent,
  TimedEventPayload,
  TimeForwardEvent,
} from './common/events/eventTypes';
import { FullEvent, getAllEvents, sendEvent } from './common/events/eventUtils';
import { getCurrentGameOptions } from './common/gameOptions';
import {
  AddNotificationLocalEvent,
  AddRadioMessageLocalEvent,
  GameOptionsUpdateLocalEvent,
  LocalEventBase,
  TimeForwardLocalEvent,
} from './common/localEvents/localEventBase';
import { getLocalEventManager } from './common/localEvents/localEventManager';
import { MainSimulationState } from './common/simulationState/mainSimulationState';
import { GameExecutionContext } from './executionContext/gameExecutionContext';
import {
  createPlayerContext,
  resetPlayerContext,
  getCurrentExecutionContext,
} from './executionContext/gameExecutionContextController';
import { loadActionTemplates } from './loaders/actionTemplateLoader';
import { eraseInitialState, getStartingLocalEvents, shallowState } from './loaders/mainStateLoader';
import { getOmittedGlobalEvents } from './testing/stateDebug';

/* all defined action templates */
let actionTemplates: Record<ActionTemplateUid, ActionTemplateBase> | undefined;
let uniqueActionTemplates: IUniqueActionTemplates | undefined;

let initializationComplete: boolean;

/* let us know when Wegas has fully initialized the clientScript context */
let scriptsFullyLoaded = false;

Helpers.registerEffect(() => {
  scriptsFullyLoaded = true;
  initializationComplete = false;
  mainSimLogger.info('****** ALL SCRIPTS LOADED ******');
});

/**
 * Checks for new global events and applies them to the state.
 * This should be called on player side only.
 */
export function runUpdateLoop(): void {
  if (!scriptsFullyLoaded) {
    mainSimLogger.debug('Cancelling update loop until scripts fully loaded');
    return;
  }

  if (!initializationComplete) {
    eraseInitialState();
    resetState();
    tryLoadTemplates();
    createPlayerContext(getStartingLocalEvents);
    initializationComplete = true;
    mainSimLogger.info('****** STATE INIT DONE ******');
  }

  let playerCtx: GameExecutionContext | undefined = undefined;
  try {
    playerCtx = getCurrentExecutionContext();
  } catch (e) {
    // can happen after saving scripts
    mainSimLogger.debug(e);
  }

  if (playerCtx) {
    const globalEvents: FullEvent<TimedEventPayload>[] = getAllEvents<TimedEventPayload>();

    setPreviousReferenceState(playerCtx.getCurrentState());

    // filter out omitted events (if a previous state was restored)
    const ignored = getOmittedGlobalEvents();
    const filteredGlobalEvents = globalEvents.filter(e => !ignored[e.id]);
    const hasNoIgnored = Object.keys(ignored).length === 0;
    playerCtx.processEvents(filteredGlobalEvents, convertToLocalEvent, hasNoIgnored);
  }
}

function tryLoadTemplates(): void {
  if (!actionTemplates || !uniqueActionTemplates) {
    ({ actionTemplates, uniqueActionTemplates } = loadActionTemplates());
    mainSimLogger.info('****** TEMPLATES LOADED ******');
  }
}

export function getActionTemplates(): Record<ActionTemplateUid, ActionTemplateBase> {
  if (!actionTemplates) {
    tryLoadTemplates();
  }
  return actionTemplates!;
}

function resetActionTemplates(): void {
  actionTemplates = undefined;
  uniqueActionTemplates = undefined;
}

/**
 * converts a global event to local events and enqueue them for later evaluation
 * @param event a received global event
 */
export function convertToLocalEvent(event: FullEvent<TimedEventPayload>): LocalEventBase[] {
  tryLoadTemplates();

  const localEvents: LocalEventBase[] = [];
  switch (event.payload.type) {
    case 'ActionCreationEvent':
      {
        // find corresponding creation template
        const actionTemplate = getActionTemplates()[event.payload.templateUid];
        if (!actionTemplate) {
          mainSimLogger.error('no template was found for UID ', event.payload.templateUid);
        } else {
          if (
            actionTemplate.canConcurrencyWiseBePlayed(
              getCurrentState(),
              +event.payload.emitterCharacterId
            )
          ) {
            const localEvent = actionTemplate.buildLocalEvent(
              event as FullEvent<ActionCreationEvent>
            );
            getLocalEventManager().queueLocalEvent(localEvent);
          } else {
            // notify!
            const ownerId = event.payload.emitterCharacterId as ActorId;
            getLocalEventManager().queueLocalEvent(
              new AddNotificationLocalEvent({
                parentEventId: event.id,
                source: { type: 'plan-action' },
                simTimeStamp: getCurrentState().getSimTime(),
                recipientId: ownerId,
                message: getTranslation('mainSim-interface', 'notification-concurrent-stop'),
                omitTranslation: true,
              })
            );
          }
        }
      }
      break;
    case 'TimeForwardEvent':
      {
        const timeJump = event.payload.timeJump;

        if (timeJump % TimeSliceDuration !== 0) {
          mainSimLogger.error(
            'time jump is not divisible by time slice duration',
            timeJump,
            TimeSliceDuration
          );
        } else {
          // if event is forced, take all actors regardless
          const involved = event.payload.dashboardForced
            ? getCurrentState()
                .getAllActors()
                .map(a => a.Uid)
            : event.payload.involvedActors;
          for (let i = 0; i < timeJump; i += TimeSliceDuration) {
            const timefwdEvent = new TimeForwardLocalEvent({
              parentEventId: event.id,
              source: { type: 'time-forward' },
              simTimeStamp: event.payload.triggerTime + i,
              actors: involved,
              timeJump: TimeSliceDuration,
            });
            getLocalEventManager().queueLocalEvent(timefwdEvent);
          }
        }
      }
      break;
    case 'DashboardRadioMessageEvent': {
      const trainerName = '' + (event.payload.emitterCharacterId || TRAINER_NAME);
      const radioMessageEvent = new AddRadioMessageLocalEvent({
        parentEventId: event.id,
        source: { type: 'trainer' },
        simTimeStamp: event.payload.triggerTime,
        senderName: trainerName,
        message: event.payload.message,
        channel: event.payload.canal,
        omitTranslation: true,
      });
      getLocalEventManager().queueLocalEvent(radioMessageEvent);
      break;
    }

    case 'DashboardNotificationMessageEvent': {
      const trainerName = '' + (event.payload.emitterCharacterId || TRAINER_NAME);
      const payload = event.payload;
      payload.roles.forEach(role => {
        const actorId = getCurrentState()
          .getAllActors()
          .find(a => a.Role === role)?.Uid;
        if (actorId) {
          const notificationMessageEvent = new AddNotificationLocalEvent({
            parentEventId: event.id,
            source: { type: 'trainer' },
            simTimeStamp: payload.triggerTime,
            senderName: trainerName,
            recipientId: actorId,
            message: payload.message,
            omitTranslation: true,
          });
          getLocalEventManager().queueLocalEvent(notificationMessageEvent);
        }
      });
      break;
    }
    case 'GameOptionsEvent': {
      const optionChange = new GameOptionsUpdateLocalEvent({
        parentEventId: event.id,
        source: { type: event.payload.source },
        simTimeStamp: event.payload.triggerTime,
        options: event.payload.options,
      });
      getLocalEventManager().queueLocalEvent(optionChange);
      break;
    }
    default:
      if (isLegacyGlobalEvent(event)) {
        mainSimLogger.warn('Legacy event ignored', event.payload.type, event);
      } else {
        mainSimLogger.error('unsupported global event type : ', event.payload.type, event);
      }
      break;
  }
  return localEvents;
}

export function fetchAvailableActionTemplates(
  actorId: ActorId,
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const actor = getCurrentState().getActorById(actorId);
  if (actor) {
    return Object.values(getActionTemplates()).filter(
      at => at.isAvailable(getCurrentState(), actor) && at.isInCategory(actionType)
    );
  } else {
    mainSimLogger.debug('Actor not found. id = ', actorId);
    return [];
  }
}

export function getUniqueActionTemplates(): IUniqueActionTemplates | undefined {
  return uniqueActionTemplates;
}

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
  return Object.values(getActionTemplates());
}

export async function buildAndLaunchActionFromTemplate(
  actTemplate: ActionTemplateBase,
  selectedActor: ActorId,
  params: any
): Promise<IManagedResponse | undefined> {
  const actor = getCurrentState().getActorById(selectedActor);

  if (actTemplate && actor) {
    const evt = actTemplate.buildGlobalEvent(getCurrentState().getSimTime(), actor, params);
    return await sendEvent(evt);
  } else {
    mainSimLogger.error('Undefined template or actor', actTemplate, selectedActor);
  }
}

/**
 * Triggers time forward in the simulation
 * @returns managed response
 */
export async function triggerTimeForward(): Promise<IManagedResponse> {
  const currentSimulationState = getCurrentState();
  const actorIds = getCurrentPlayerActorIds(currentSimulationState.getOnSiteActors());

  const tf: TimeForwardEvent = {
    ...initBaseEvent(0),
    triggerTime: currentSimulationState.getSimTime(),
    timeJump: TimeSliceDuration,
    involvedActors: actorIds,
    type: 'TimeForwardEvent',
  };

  return await sendEvent(tf);
}

/**
 *  Set the games options (triggered when players start the simulation)
 */
export async function initGameOptions(): Promise<IManagedResponse> {
  const options = getCurrentGameOptions();
  const go: GameOptionsEvent = {
    ...initBaseEvent(0),
    triggerTime: 0,
    options: options,
    type: 'GameOptionsEvent',
    source: 'initialisation',
  };

  return await sendEvent(go);
}

export function getCurrentState(): Readonly<MainSimulationState> {
  if (!scriptsFullyLoaded) {
    mainSimLogger.debug('Waiting for scripts to fully reload. Returning shallow state');
    return shallowState();
  }
  try {
    return getCurrentExecutionContext().getCurrentState();
  } catch (e) {
    return shallowState();
  }
}

export function resetState(): void {
  resetActionTemplates();
  resetPlayerContext();
  initializationComplete = false;
}
