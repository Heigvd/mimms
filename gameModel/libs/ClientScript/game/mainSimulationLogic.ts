/**
 * Setup function
 */
import { updateLastState } from '../dashboard/dashboardState';
import { setPreviousReferenceState } from '../gameInterface/afterUpdateCallbacks';
import { mainSimLogger } from '../tools/logger';
import { getTranslation } from '../tools/translation';
import { getCurrentPlayerActorIds } from '../UIfacade/actorFacade';
import { initActionTemplates, IUniqueActionTemplates } from './actionTemplatesData';
import { ActionBase } from './common/actions/actionBase';
import { ActionTemplateBase } from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { Actor } from './common/actors/actor';
import { TimeSliceDuration, TRAINER_NAME } from './common/constants';
import { ActorId, TemplateId } from './common/baseTypes';
import { initBaseEvent } from './common/events/baseEvent';
import {
  BuildingStatus,
  GeometryBasedFixedMapEntity,
  PointGeometricalShape,
} from './common/events/defineMapObjectEvent';
import {
  ActionCancellationEvent,
  ActionCreationEvent,
  GameOptionsEvent,
  isLegacyGlobalEvent,
  TimedEventPayload,
  TimeForwardCancelEvent,
  TimeForwardEvent,
} from './common/events/eventTypes';
import { compareTimedEvents, FullEvent, getAllEvents, sendEvent } from './common/events/eventUtils';
import {
  AddRadioMessageLocalEvent,
  CancelActionLocalEvent,
  TimeForwardCancelLocalEvent,
  TimeForwardLocalEvent,
} from './common/localEvents/localEventBase';
import { localEventManager } from './common/localEvents/localEventManager';
import { loadPatients } from './common/patients/handleState';
import { loadEmergencyResourceContainers } from './common/resources/emergencyDepartment';
import { Resource } from './common/resources/resource';
import { resetIdSeed as ResourceContainerResetIdSeed } from './common/resources/resourceContainer';
import { LOCATION_ENUM } from './common/simulationState/locationState';
import { MainSimulationState } from './common/simulationState/mainSimulationState';
import { SubTask } from './common/tasks/subTask';
import { HealingTask, TaskBase } from './common/tasks/taskBase';
import { EvacuationTask } from './common/tasks/taskBaseEvacuation';
import { PorterTask } from './common/tasks/taskBasePorter';
import { PreTriageTask } from './common/tasks/taskBasePretriage';
import { WaitingTask } from './common/tasks/taskBaseWaiting';
import { getCurrentGameOptions, GameOptions } from './common/gameOptions';

let currentSimulationState: MainSimulationState;
let stateHistory: MainSimulationState[];

let actionTemplates: Record<string, ActionTemplateBase>;
let processedEvents: Record<string, FullEvent<TimedEventPayload>>;

let uniqueActionTemplates: IUniqueActionTemplates;

export let gameOptions: GameOptions;

Helpers.registerEffect(() => {
  currentSimulationState = buildStartingMainState();
  stateHistory = [currentSimulationState];

  actionTemplates = {};
  processedEvents = {};

  mainSimLogger.info('Main simulation initialized', actionTemplates);
  mainSimLogger.info('Initial state', currentSimulationState);

  mainSimLogger.info('scheduling automatic events');
  queueAutomaticEvents();

  recomputeState();
});

function queueAutomaticEvents() {
  // empty for now
}

export function buildStartingMainState(): MainSimulationState {
  // TODO read all simulation parameters to build start state and initialize the whole simulation
  gameOptions = getCurrentGameOptions();

  const testAL = new Actor('AL', LOCATION_ENUM.chantier);
  const testCASU = new Actor('CASU', LOCATION_ENUM.remote);

  const mainAccident = new GeometryBasedFixedMapEntity(
    0,
    'location-chantier',
    LOCATION_ENUM.chantier,
    [],
    new PointGeometricalShape([[2500100, 1118500]], [2500100, 1118500]),
    BuildingStatus.ready,
    'mainAccident'
  );

  const taskPretriChantier = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.chantier,
    []
  );

  const taskPretriPMA = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.PMA,
    []
  );

  const taskPretriNidDeBlesses = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.nidDeBlesses,
    []
  );

  const taskBrancardageChantier = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-chantier-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.chantier,
    2,
    100,
    'AL',
    []
  );

  const taskBrancardageNidDeBlesses = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-nid-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.nidDeBlesses,
    2,
    100,
    'AL',
    []
  );

  const taskHealing = new HealingTask(
    'healing-title',
    'healing-desc',
    1,
    100,
    'AL',
    [LOCATION_ENUM.nidDeBlesses, LOCATION_ENUM.chantier],
    []
  );

  const taskHealingRed = new HealingTask(
    'healing-pma-red-title',
    'healing-pma-red-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    1
  );

  const taskHealingYellow = new HealingTask(
    'healing-pma-yellow-title',
    'healing-pma-yellow-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    2
  );

  const taskHealingGreen = new HealingTask(
    'healing-pma-green-title',
    'healing-pma-green-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    3
  );

  const taskEvacuation = new EvacuationTask(
    'evacuate-title',
    'evacuate-desc',
    1,
    100000,
    'EVASAN',
    [LOCATION_ENUM.ambulancePark, LOCATION_ENUM.helicopterPark],
    []
  );

  const taskWaiting = new WaitingTask(
    'waiting-title',
    'waiting-task-desc',
    1,
    10000,
    'AL',
    [
      LOCATION_ENUM.chantier,
      LOCATION_ENUM.PMA,
      LOCATION_ENUM.pcFront,
      LOCATION_ENUM.PC,
      LOCATION_ENUM.ambulancePark,
      LOCATION_ENUM.helicopterPark,
    ],
    []
  );

  const initialResources = [new Resource('ambulancier', LOCATION_ENUM.chantier, taskWaiting.Uid)];

  MainSimulationState.resetStateCounter();

  return new MainSimulationState(
    {
      actions: [],
      cancelledActions: [],
      actors: [testAL, testCASU],
      mapLocations: [mainAccident],
      patients: loadPatients(),
      tasks: [
        taskWaiting,
        taskPretriChantier,
        taskPretriPMA,
        taskPretriNidDeBlesses,
        taskBrancardageChantier,
        taskBrancardageNidDeBlesses,
        taskHealing,
        taskHealingRed,
        taskHealingYellow,
        taskHealingGreen,
        taskEvacuation,
      ],
      radioMessages: [],
      resources: initialResources,
      resourceContainers: loadEmergencyResourceContainers(),
      flags: {},
      hospital: {},
    },
    0,
    0
  );
}

/**
 * Checks for new events and applies them to the state
 * Forces rerendering if any changes ?
 */
export function runUpdateLoop(): void {
  // get all events
  const globalEvents: FullEvent<TimedEventPayload>[] = getAllEvents<TimedEventPayload>();

  setPreviousReferenceState(currentSimulationState);
  // filter out non processed events
  // and filter out ignored events (if a previous state was restored)
  const ignored = getOmittedEvents();
  const unprocessed = globalEvents.filter(e => !processedEvents[e.id] && !ignored[e.id]);

  const sorted = unprocessed.sort(compareTimedEvents);

  // process all candidate events
  sorted.forEach(event => {
    mainSimLogger.info('Processing event ', event);
    processEvent(event);
  });

  // update last state variable for dashboard
  updateLastState(currentSimulationState);
}

/**
 * Processes one global event and computes a new resulting state
 * The new state is appended to the history
 * The event is ignored if it doesn't match with the current simulation time
 * @param event the global event to process
 */
function processEvent(event: FullEvent<TimedEventPayload>): void {
  const now = currentSimulationState.getSimTime();
  if (!event.payload.dashboardForced) {
    if (event.payload.triggerTime < now) {
      mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
      mainSimLogger.warn(
        'Likely due to a TimeForwardEvent that has jumped over an existing event => BUG'
      );
      return;
    } else if (event.payload.triggerTime > now) {
      mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
      mainSimLogger.warn('This event will be processed later');
      return;
    }
  } else {
    // from trainer
    mainSimLogger.info('Trainer event', event);
    event.payload.triggerTime = now;
  }

  try {
    convertToLocalEventAndQueue(event);
    const newState = localEventManager.processPendingEvents(currentSimulationState, event.id);
    if (newState.stateCount !== currentSimulationState?.stateCount) {
      mainSimLogger.info('updating current state', newState.stateCount);
      currentSimulationState = newState;
      stateHistory.push(newState);
    }
  } catch (error) {
    mainSimLogger.error('Error while processing event', event, error);
  }

  processedEvents[event.id] = event;
}
/**
 * converts a global event to local events and enqueue them for later evaluation
 * @param event a received global event
 */
function convertToLocalEventAndQueue(event: FullEvent<TimedEventPayload>): void {
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
            localEventManager.queueLocalEvent(localEvent);
          } else {
            // notify!
            const ownerId = event.payload.emitterCharacterId as ActorId;
            localEventManager.queueLocalEvent(
              new AddRadioMessageLocalEvent(
                event.id,
                getCurrentState().getSimTime(),
                ownerId,
                'SYSTEM',
                getTranslation('mainSim-interface', 'notification-concurrent-stop'),
                ActionType.ACTION,
                false,
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
          localEventManager.queueLocalEvent(localEvent);
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
            ? currentSimulationState.getAllActors().map(a => a.Uid)
            : event.payload.involvedActors;
          for (let i = 0; i < timeJump; i += TimeSliceDuration) {
            const timefwdEvent = new TimeForwardLocalEvent(
              event.id,
              event.payload.triggerTime + i,
              involved,
              TimeSliceDuration
            );
            localEventManager.queueLocalEvent(timefwdEvent);
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
        localEventManager.queueLocalEvent(timefwdEvent);
      }
      break;
    case 'DashboardRadioMessageEvent': {
      const trainerName = '' + (event.payload.emitterCharacterId || TRAINER_NAME);
      const radioMessageEvent = new AddRadioMessageLocalEvent(
        event.id,
        event.payload.triggerTime,
        0,
        trainerName,
        event.payload.message,
        event.payload.canal,
        true,
        true
      );
      localEventManager.queueLocalEvent(radioMessageEvent);
      break;
    }

    case 'DashboardNotificationMessageEvent': {
      const trainerName = '' + (event.payload.emitterCharacterId || TRAINER_NAME);
      const payload = event.payload;
      payload.roles.forEach(role => {
        const actorId = currentSimulationState.getAllActors().find(a => a.Role === role)?.Uid;
        if (actorId) {
          const notificationMessageEvent = new AddRadioMessageLocalEvent(
            event.id,
            payload.triggerTime,
            actorId,
            trainerName,
            payload.message,
            ActionType.ACTION,
            false,
            true
          );
          localEventManager.queueLocalEvent(notificationMessageEvent);
        }
      });
      break;
    }
    case 'GameOptionsEvent': {
      const options = event.payload.options;
      gameOptions = options;
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
}

export function fetchAvailableActions(
  actorId: ActorId,
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const actor = currentSimulationState.getActorById(actorId);
  if (actor) {
    return Object.values(actionTemplates).filter(
      at => at.isAvailable(currentSimulationState, actor) && at.isInCategory(actionType)
    );
  } else {
    mainSimLogger.warn('Actor not found. id = ', actorId);
    return [];
  }
}

export function getUniqueActionTemplates(): IUniqueActionTemplates {
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
  const actor = currentSimulationState.getActorById(selectedActor);

  if (actTemplate && actor) {
    const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), actor, params);
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

  if (action && selectedActor) {
    const cancellationEvent: ActionCancellationEvent = {
      ...initBaseEvent(0),
      triggerTime: currentSimulationState.getSimTime(),
      type: 'ActionCancellationEvent',
      templateId: templateId,
      actorId: selectedActor,
      timeStamp: getCurrentState().getSimTime(),
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
    triggerTime: currentSimulationState.getSimTime(),
    options: options,
    type: 'GameOptionsEvent',
  };

  return await sendEvent(go);
}

export function getCurrentState(): Readonly<MainSimulationState> {
  return currentSimulationState;
}

export function recomputeState() {
  mainSimLogger.info('Reinitialize state');
  processedEvents = {};

  Actor.resetIdSeed();
  ActionTemplateBase.resetIdSeed();
  ActionBase.resetIdSeed();
  TaskBase.resetIdSeed();
  SubTask.resetIdSeed();
  Resource.resetIdSeed();
  ResourceContainerResetIdSeed();

  currentSimulationState = buildStartingMainState();
  stateHistory = [currentSimulationState];

  ({ actionTemplates, uniqueActionTemplates } = initActionTemplates());

  mainSimLogger.info('reset done');
  runUpdateLoop();
}

/**** DEBUG TOOLS SECTION ***/

export function getStateHistory() {
  return stateHistory;
}

/*
 function that resets the game state to a previously stored one
 */
export async function setCurrentStateDebug(stateId: number | undefined) {
  const idx = stateHistory.findIndex(s => s.stateCount == stateId);
  if (idx < 0) {
    mainSimLogger.warn('state not found, cannot restore state with id', stateId);
    return;
  }
  currentSimulationState = stateHistory[idx]!;
  stateHistory = stateHistory.slice(0, idx + 1);

  // store the events that have to be omitted when recomputing the state
  // i.e. the events that occured after the restored state
  const ignored = getOmittedEvents();
  const lastEvtId = currentSimulationState.getLastEventId();
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
