/**
 * Setup function
 */
import { setPreviousReferenceState } from '../gameInterface/afterUpdateCallbacks';
import { mainSimLogger } from '../tools/logger';
import { getTranslation } from '../tools/translation';
import { getCurrentPlayerActorIds } from '../UIfacade/actorFacade';
import { initActionTemplates, IUniqueActionTemplates } from './actionTemplatesData';
import { ActionTemplateBase } from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { ActorId, TemplateId } from './common/baseTypes';
import { TimeSliceDuration, TRAINER_NAME } from './common/constants';
import { initBaseEvent } from './common/events/baseEvent';
import {
  ActionCancellationEvent,
  ActionCreationEvent,
  GameOptionsEvent,
  isLegacyGlobalEvent,
  TimedEventPayload,
  TimeForwardCancelEvent,
  TimeForwardEvent,
} from './common/events/eventTypes';
import { FullEvent, getAllEvents, sendEvent } from './common/events/eventUtils';
import { getCurrentGameOptions } from './common/gameOptions';
import {
  AddNotificationLocalEvent,
  AddRadioMessageLocalEvent,
  CancelActionLocalEvent,
  GameOptionsUpdateLocalEvent,
  LocalEventBase,
  TimeForwardCancelLocalEvent,
  TimeForwardLocalEvent,
} from './common/localEvents/localEventBase';
import { getLocalEventManager } from './common/localEvents/localEventManager';
import { shallowState } from './common/simulationState/loaders/mainStateLoader';
import { MainSimulationState } from './common/simulationState/mainSimulationState';
import {
  createPlayerContext,
  debugRemovePlayerContext,
  getCurrentExecutionContext,
} from './gameExecutionContextController';

let actionTemplates: Record<string, ActionTemplateBase>;
let uniqueActionTemplates: IUniqueActionTemplates;

let initializationComplete: boolean;

let scriptsFullyLoaded = false;

Helpers.registerEffect(() => {
  scriptsFullyLoaded = true;
  initializationComplete = false;
  mainSimLogger.info('****** ALL SCRIPTS LOADED ******');
  tryLoadTemplates();
});

/**
 * Checks for new events and applies them to the state
 * This should be called on player side only
 */
export function runUpdateLoop(): void {
  if (!scriptsFullyLoaded) {
    mainSimLogger.info('Cancelling update loop until scripts fully loaded');
    return;
  }

  if (!initializationComplete) {
    tryLoadTemplates();
    createPlayerContext();
    initializationComplete = true;
    mainSimLogger.info('****** STATE INIT DONE ******');
  }

  const playerCtx = getCurrentExecutionContext();

  if (playerCtx) {
    const globalEvents: FullEvent<TimedEventPayload>[] = getAllEvents<TimedEventPayload>();

    setPreviousReferenceState(playerCtx.getCurrentState());

    // filter out omitted events (if a previous state was restored)
    const ignored = getOmittedEvents();
    const filteredEvents = globalEvents.filter(e => !ignored[e.id]);

    playerCtx.processEvents(filteredEvents, convertToLocalEvent);
  }
}

function tryLoadTemplates(): void {
  if (!actionTemplates || !uniqueActionTemplates) {
    ({ actionTemplates, uniqueActionTemplates } = initActionTemplates());
    mainSimLogger.info('****** TEMPLATES LOADED ******');
  }
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
        const actionTemplate = actionTemplates[event.payload.templateUid];
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
              new AddNotificationLocalEvent(
                event.id,
                getCurrentState().getSimTime(),
                undefined,
                undefined,
                ownerId,
                getTranslation('mainSim-interface', 'notification-concurrent-stop'),
                true
              )
            );
          }
        }
      }
      break;
    case 'ActionCancellationEvent':
      {
        const payload = event.payload;
        const now = getCurrentState().getSimTime();
        const action = getCurrentState()
          .getAllActions()
          .find(
            a =>
              a.getTemplateId() === payload.templateId &&
              a.ownerId === payload.actorId &&
              a.startTime == now
          );
        if (!action) {
          mainSimLogger.error('no action was found with id ', payload.templateId);
        } else {
          const localEvent = new CancelActionLocalEvent(
            event.id,
            event.payload.triggerTime,
            event.payload.templateId,
            event.payload.actorId,
            event.payload.timeStamp
          );
          getLocalEventManager().queueLocalEvent(localEvent);
        }
      }
      break;
    case 'TimeForwardEvent':
      {
        const timeJump = event.payload.timeJump;

        if (timeJump % TimeSliceDuration !== 0) {
          mainSimLogger.error(
            'time jump is not divisble by time slice duration',
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
            const timefwdEvent = new TimeForwardLocalEvent(
              event.id,
              event.payload.triggerTime + i,
              involved,
              TimeSliceDuration
            );
            getLocalEventManager().queueLocalEvent(timefwdEvent);
          }
        }
      }
      break;
    case 'TimeForwardCancelEvent':
      {
        const timefwdEvent = new TimeForwardCancelLocalEvent(
          event.id,
          event.payload.triggerTime,
          event.payload.involvedActors
        );
        getLocalEventManager().queueLocalEvent(timefwdEvent);
      }
      break;
    case 'DashboardRadioMessageEvent': {
      const trainerName = '' + (event.payload.emitterCharacterId || TRAINER_NAME);
      const radioMessageEvent = new AddRadioMessageLocalEvent(
        event.id,
        event.payload.triggerTime,
        undefined,
        trainerName,
        undefined,
        event.payload.message,
        event.payload.canal,
        true
      );
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
          const notificationMessageEvent = new AddNotificationLocalEvent(
            event.id,
            payload.triggerTime,
            undefined,
            trainerName,
            actorId,
            payload.message,
            true
          );
          getLocalEventManager().queueLocalEvent(notificationMessageEvent);
        }
      });
      break;
    }
    case 'GameOptionsEvent': {
      const optionChange = new GameOptionsUpdateLocalEvent(
        event.id,
        event.payload.triggerTime,
        event.payload.options
      );
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

export function fetchAvailableActions(
  actorId: ActorId,
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const actor = getCurrentState().getActorById(actorId);
  if (actor) {
    return Object.values(actionTemplates).filter(
      at => at.isAvailable(getCurrentState(), actor) && at.isInCategory(actionType)
    );
  } else {
    mainSimLogger.info('Actor not found. id = ', actorId);
    return [];
  }
}

export function getUniqueActionTemplates(): IUniqueActionTemplates | undefined {
  return uniqueActionTemplates;
}

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
  return Object.values(actionTemplates);
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

export async function buildAndLaunchActionCancellation(
  selectedActor: ActorId,
  templateId: TemplateId
): Promise<IManagedResponse | undefined> {
  const action = getCurrentState()
    .getAllActions()
    .find(a => a.getTemplateId() === templateId && a.ownerId === selectedActor);

  const simTime = getCurrentState().getSimTime();
  if (action && selectedActor) {
    const cancellationEvent: ActionCancellationEvent = {
      ...initBaseEvent(0),
      triggerTime: simTime,
      type: 'ActionCancellationEvent',
      templateId: templateId,
      actorId: selectedActor,
      timeStamp: simTime,
    };

    return await sendEvent(cancellationEvent);
  } else {
    mainSimLogger.error('Could not find action or actor with uids', templateId, selectedActor);
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
 * Cancel a pending time forward
 */
export async function triggerTimeForwardCancel(): Promise<IManagedResponse> {
  const currentSimulationState = getCurrentState();
  const actorIds = getCurrentPlayerActorIds(currentSimulationState.getOnSiteActors());
  const tfc: TimeForwardCancelEvent = {
    ...initBaseEvent(0),
    triggerTime: currentSimulationState.getSimTime(),
    involvedActors: actorIds,
    type: 'TimeForwardCancelEvent',
  };

  return await sendEvent(tfc);
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
  };

  return await sendEvent(go);
}

export function getCurrentState(): Readonly<MainSimulationState> {
  if (!scriptsFullyLoaded) {
    mainSimLogger.warn('Waiting for scripts to fully reload. Returning shallow state');
    return shallowState();
  }
  try {
    return getCurrentExecutionContext().getCurrentState();
  } catch (e) {
    return shallowState();
  }
}

/**** DEBUG TOOLS SECTION ***/

export function forceRecomputeStateDebug() {
  initializationComplete = false;
  debugRemovePlayerContext();
  runUpdateLoop();
}

export function getStateHistory() {
  return getCurrentExecutionContext().getStateHistory();
}

/*
 Restores the game state to a previously stored one
 this mutates the state history of the execution context
 */
export async function setCurrentStateDebug(stateId: number) {
  const execContext = getCurrentExecutionContext();
  execContext.restoreState(stateId);

  // store the events that have to be omitted when recomputing the state
  // i.e. the events that occured after the restored state
  const ignored = getOmittedEvents();
  const lastEvtId = execContext.getCurrentState().getLastEventId();
  const all = getAllEvents();
  let i = all.length - 1;
  while (i > 0 && all[i]?.id !== lastEvtId) {
    ignored[all[i]!.id] = true;
    i--;
  }

  const ignoredString = JSON.stringify(ignored);
  const updateIgnoredScript = `Variable.find(gameModel, 'debugIgnoredEvents').getInstance(self).setProperty('ignored', JSON.stringify(${ignoredString}));`;
  await APIMethods.runScript(updateIgnoredScript, {});
  mainSimLogger.info(`restored state ${stateId}, ignored events :`, stateId);
}

/**
 * Get the events that have been cancelled due to previous stored state reloading
 */
function getOmittedEvents(): Record<string, boolean> {
  const raw =
    Variable.find(gameModel, 'debugIgnoredEvents').getInstance(self).getProperties()['ignored'] ||
    '{}';
  const ignored = JSON.parse(raw) as Record<string, boolean>;
  return ignored;
}
