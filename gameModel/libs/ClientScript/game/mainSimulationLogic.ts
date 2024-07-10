/**
 * Setup function
 */
import { setPreviousReferenceState } from '../gameInterface/afterUpdateCallbacks';
import { mainSimLogger } from '../tools/logger';
import { getTranslation } from '../tools/translation';
import { getCurrentPlayerActorIds } from '../UIfacade/actorFacade';
import { ActionBase } from './common/actions/actionBase';
import {
  ActionTemplateBase,
  AppointActorActionTemplate,
  CasuMessageTemplate,
  DisplayMessageActionTemplate,
  EvacuationActionTemplate,
  MoveActorActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
  SelectionFixedMapEntityTemplate,
  SelectionParkTemplate,
  SelectionPCFrontTemplate,
  SelectionPCTemplate,
  SelectionPMATemplate,
  SendRadioMessageTemplate,
  SimFlag,
} from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { Actor } from './common/actors/actor';
import { ActorId, TemplateId, TemplateRef } from './common/baseTypes';
import { TimeSliceDuration } from './common/constants';
import { initBaseEvent } from './common/events/baseEvent';
import {
  BuildingStatus,
  GeometryBasedFixedMapEntity,
  MultiLineStringGeometricalShape,
  PointGeometricalShape,
  PolygonGeometricalShape,
} from './common/events/defineMapObjectEvent';
import {
  ActionCancellationEvent,
  ActionCreationEvent,
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

let currentSimulationState: MainSimulationState;
let stateHistory: MainSimulationState[];

let actionTemplates: Record<string, ActionTemplateBase>;
let processedEvents: Record<string, FullEvent<TimedEventPayload>>;

Helpers.registerEffect(() => {
  currentSimulationState = initMainState();
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

function initMainState(): MainSimulationState {
  // TODO read all simulation parameters to build start state and initialize the whole simulation

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

  const taskWaiting = new WaitingTask('waiting-title', 'waiting-task-desc', 1, 10000, 'AL', [], []);

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

function initActionTemplates(): Record<string, ActionTemplateBase> {
  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const placePCFront = new SelectionPCFrontTemplate(
    'define-pcFront-title',
    'define-pcFront-desc',
    TimeSliceDuration,
    'define-pcFront-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pcFront',
      LOCATION_ENUM.pcFront,
      ['AL'],
      new PointGeometricalShape([
        [2500075.549931927, 1118500.103111194],
        [2500106.549931926, 1118550.103111192],
        [2500106.549931926, 1118489.103111192],
      ]),
      BuildingStatus.selection,
      'pcFront' /*_blue*/
    ),
    false,
    [],
    [SimFlag.PCFRONT_BUILT]
  );
  const getInfo = new DisplayMessageActionTemplate(
    'basic-info-title',
    'basic-info-desc',
    TimeSliceDuration * 2,
    'basic-info-feedback'
  );
  const getInfo2 = new DisplayMessageActionTemplate(
    'other-basic-info-title',
    'other-basic-info-desc',
    TimeSliceDuration,
    'other-basic-info-feedback'
  );
  const getPoliceInfos = new DisplayMessageActionTemplate(
    'basic-info-police-title',
    'basic-info-police-desc',
    TimeSliceDuration,
    'basic-info-police-feedback'
  );
  const getFireFighterInfos = new DisplayMessageActionTemplate(
    'basic-info-firefighter-title',
    'basic-info-firefighter-desc',
    TimeSliceDuration,
    'basic-info-firefighter-feedback'
  );
  const casuMessage = new CasuMessageTemplate(
    'casu-message-title',
    'casu-message-desc',
    TimeSliceDuration,
    'casu-message-feedback'
  );
  const radioMessage = new SendRadioMessageTemplate(
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    'send-radio-feedback'
  );

  const moveActor = new MoveActorActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    'move-actor-feedback'
  );

  const placeAccessRegress = new SelectionFixedMapEntityTemplate(
    'define-accreg-title',
    'define-accreg-desc',
    TimeSliceDuration * 3,
    'define-accreg-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'Accreg',
      LOCATION_ENUM.AccReg,
      [],
      new MultiLineStringGeometricalShape([
        [
          [
            [2500052.6133020874, 1118449.2968644362],
            [2500087.3369474486, 1118503.6293053096],
          ],
          [
            [2500060.952470149, 1118523.9098080816],
            [2500029.950508212, 1118486.1465293542],
          ],
        ],
        [
          [
            [2500113.647301364, 1118575.704815885],
            [2500096.7293570912, 1118534.8226090078],
          ],
          [
            [2500060.952470149, 1118523.9098080816],
            [2500029.950508212, 1118486.1465293542],
          ],
        ],
        [
          [
            [2500040.187860512, 1118562.59843714],
            [2500065.949428312, 1118543.3339090333],
          ],
          [
            [2500109.5966483564, 1118490.3921636103],
            [2500134.8148273816, 1118469.6649961546],
          ],
        ],
      ]),
      BuildingStatus.selection,
      'right-arrow',
      false
    )
  );

  const acsMcsArrivalAnnouncement = new DisplayMessageActionTemplate(
    'define-acsMscArrival-title',
    'define-acsMscArrival-desc',
    TimeSliceDuration,
    'define-acsMscArrival-feedback',
    false,
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.ACS_MCS_ANNOUNCED],
    ['ACS', 'MCS'],
    ActionType.CASU_RADIO,
    true
  );

  const appointEVASAN = new AppointActorActionTemplate(
    'appoint-EVASAN-title',
    'appoint-EVASAN-desc',
    TimeSliceDuration,
    'appoint-EVASAN-feedback',
    true,
    'appoint-EVASAN-no-resource-feedback',
    'EVASAN',
    'ambulancier',
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.EVASAN_ARRIVED]
  );

  const placePMA = new SelectionPMATemplate(
    'define-PMA-title',
    'define-PMA-desc',
    TimeSliceDuration * 4,
    'define-PMA-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pma-short',
      LOCATION_ENUM.PMA,
      ['LEADPMA'],
      new PolygonGeometricalShape([
        [
          [
            [2499959.513377705, 1118456.6791527744], //'way/301355984'
            [2499948.345528039, 1118442.755145481],
            [2499928.9775556503, 1118418.871686022],
            [2499947.162274424, 1118404.3729329833],
            [2499992.1599490084, 1118459.7301378376],
            [2500013.795503398, 1118486.3335680368],
            [2500019.9726727167, 1118493.9362230333],
            [2500057.0664169285, 1118539.5628896698],
            [2500046.3844424966, 1118547.5332560872],
            [2500038.334720112, 1118553.6478721495],
            [2500031.238813536, 1118545.0931211817],
            [2500012.837898292, 1118522.2385113093],
            [2499959.513377705, 1118456.6791527744],
          ],
        ],
        [
          [
            [2500109.999851025, 1118456.3699052047], //'way/82683752'
            [2500113.781500128, 1118461.010360654],
            [2500121.785907592, 1118470.828775529],
            [2500114.0474236254, 1118477.104916978],
            [2500105.0520694936, 1118484.3913443699],
            [2500096.448885649, 1118473.8379365443],
            [2500093.2659977684, 1118469.932506736],
            [2500109.999851025, 1118456.3699052047],
          ],
        ], //'way/179543646'
        [
          [
            [2500136.790143822, 1118548.3406066815],
            [2500141.6760064885, 1118560.489763118],
            [2500143.4792181817, 1118564.9850271842],
            [2500124.888196066, 1118572.1742195904],
            [2500121.81913271, 1118564.4089291636],
            [2500118.355243353, 1118555.6384201094],
            [2500133.0180577287, 1118549.8816207554],
            [2500136.790143822, 1118548.3406066815],
          ],
        ],
      ]),
      BuildingStatus.selection,
      'PMA'
    )
  );

  const placePC = new SelectionPCTemplate(
    'define-PC-title',
    'define-PC-desc',
    TimeSliceDuration * 2,
    'define-PC-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pc-short',
      LOCATION_ENUM.PC,
      ['ACS', 'MCS'],
      new PointGeometricalShape([
        [2500095.549931929, 1118489.103111194],
        [2500009.75586577, 1118472.531405577],
        [2500057.0688582086, 1118551.6205987816],
      ]),
      BuildingStatus.selection,
      'PC'
    ),
    false,
    [SimFlag.PCS_ARRIVED],
    [SimFlag.PC_BUILT]
  );

  const placeNest = new SelectionFixedMapEntityTemplate(
    'define-Nest-title',
    'define-Nest-desc',
    TimeSliceDuration * 3,
    'define-Nest-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-niddeblesses',
      LOCATION_ENUM.nidDeBlesses,
      [],
      new PointGeometricalShape([
        [2500041.9170648125, 1118456.4054969894],
        [2500106.9001576486, 1118532.2446804282],
        [2499999.6045754217, 1118483.805125067],
      ]),
      BuildingStatus.selection,
      'Nest'
    )
  );

  const placeAmbulancePark = new SelectionParkTemplate(
    'define-ambulance-park-title',
    'define-ambulance-park-desc',
    TimeSliceDuration,
    'define-ambulance-park-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-ambulancePark',
      LOCATION_ENUM.ambulancePark,
      ['EVASAN'],
      new PointGeometricalShape([
        [2499960, 1118580],
        [2500070, 1118498],
        [2499961, 1118388],
      ]),
      BuildingStatus.selection,
      'ambulance-park'
    ),
    'ambulance',
    false,
    undefined,
    [SimFlag.AMBULANCE_PARK_BUILT]
  );

  const placeHelicopterPark = new SelectionParkTemplate(
    'define-helicopter-park-title',
    'define-helicopter-park-desc',
    TimeSliceDuration * 2,
    'define-helicopter-park-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-helicopterPark',
      LOCATION_ENUM.helicopterPark,
      ['EVASAN'],
      new PointGeometricalShape([
        [2499956, 1118332],
        [2499872, 1118614],
        [2499925, 1118451],
      ]),
      BuildingStatus.selection,
      'helicopter-park'
    ),
    'helicopter',
    false,
    undefined,
    [SimFlag.HELICOPTER_PARK_BUILT]
  );

  const activateRadioSchema = new DisplayMessageActionTemplate(
    'activate-radio-schema-title',
    'activate-radio-schema-desc',
    TimeSliceDuration,
    'activate-radio-schema-feedback',
    false,
    undefined,
    [SimFlag.RADIO_SCHEMA_ACTIVATED],
    undefined,
    ActionType.CASU_RADIO,
    true
  );

  const allocateResources = new MoveResourcesAssignTaskActionTemplate(
    'move-res-task-title',
    'move-res-task-desc',
    TimeSliceDuration,
    'move-res-task-feedback',
    'move-res-task-refused',
    true
  );

  const evacuate = new EvacuationActionTemplate(
    'evacuate-title',
    'evacuate-desc',
    TimeSliceDuration,
    'evacuate-feedback',
    'evacuate-task-started',
    'evacuate-task-abort',
    true
  );

  const templates: Record<string, ActionTemplateBase> = {};
  templates[placePCFront.getTemplateRef()] = placePCFront;
  templates[moveActor.getTemplateRef()] = moveActor;
  templates[getInfo.getTemplateRef()] = getInfo;
  templates[getInfo2.getTemplateRef()] = getInfo2;
  templates[getPoliceInfos.getTemplateRef()] = getPoliceInfos;
  templates[getFireFighterInfos.getTemplateRef()] = getFireFighterInfos;
  templates[casuMessage.getTemplateRef()] = casuMessage;
  templates[radioMessage.getTemplateRef()] = radioMessage;
  templates[placePMA.getTemplateRef()] = placePMA;
  templates[placePC.getTemplateRef()] = placePC;
  templates[placeNest.getTemplateRef()] = placeNest;
  templates[placeAccessRegress.getTemplateRef()] = placeAccessRegress;
  templates[placeAmbulancePark.getTemplateRef()] = placeAmbulancePark;
  templates[placeHelicopterPark.getTemplateRef()] = placeHelicopterPark;
  templates[acsMcsArrivalAnnouncement.getTemplateRef()] = acsMcsArrivalAnnouncement;
  templates[activateRadioSchema.getTemplateRef()] = activateRadioSchema;
  templates[appointEVASAN.getTemplateRef()] = appointEVASAN;
  templates[allocateResources.getTemplateRef()] = allocateResources;
  templates[evacuate.getTemplateRef()] = evacuate;

  return templates;
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

  // state restoration debug : filter out ignored events

  const sorted = unprocessed.sort(compareTimedEvents);

  // process all candidate events
  sorted.forEach(event => {
    mainSimLogger.info('Processing event ', event);
    processEvent(event);
  });
}

/**
 * Processes one global event and computes a new resulting state
 * The new state is appended to the history
 * The event is ignored if it doesn't match with the current simulation time
 * @param event the global event to process
 * @returns the resulting simulation state
 */
function processEvent(event: FullEvent<TimedEventPayload>) {
  const now = currentSimulationState.getSimTime();
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

  switch (event.payload.type) {
    case 'ActionCreationEvent':
      {
        // find corresponding creation template
        const actionTemplate = actionTemplates[event.payload.templateRef];
        if (!actionTemplate) {
          mainSimLogger.error('no template was found for ref ', event.payload.templateRef);
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
        const timefwdEvent = new TimeForwardLocalEvent(
          event.id,
          event.payload.triggerTime,
          event.payload.involvedActors,
          event.payload.timeJump
        );
        localEventManager.queueLocalEvent(timefwdEvent);
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
    default:
      if (isLegacyGlobalEvent(event)) {
        mainSimLogger.warn('Legacy event ignored', event.payload.type, event);
      } else {
        mainSimLogger.error('unsupported global event type : ', event.payload.type, event);
      }
      break;
  }

  processedEvents[event.id] = event;

  // process all generated events
  const newState = localEventManager.processPendingEvents(currentSimulationState, event.id);

  if (newState.stateCount !== currentSimulationState.stateCount) {
    mainSimLogger.info('updating current state', newState.stateCount);
    currentSimulationState = newState;
    stateHistory.push(newState);
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

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
  return Object.values(actionTemplates);
}

export async function buildAndLaunchActionFromTemplate(
  ref: TemplateRef,
  selectedActor: ActorId,
  params: any
): Promise<IManagedResponse | undefined> {
  const actTemplate = actionTemplates[ref];

  const actor = currentSimulationState.getActorById(selectedActor);

  if (actTemplate && actor) {
    const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), actor, params);
    return await sendEvent(evt);
  } else {
    mainSimLogger.error(
      'Could not find action template with ref or actor with id',
      ref,
      selectedActor
    );
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

  currentSimulationState = initMainState();
  stateHistory = [currentSimulationState];

  actionTemplates = initActionTemplates();

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
  currentSimulationState = stateHistory[idx];
  stateHistory = stateHistory.slice(0, idx + 1);

  // store the events that have to be omitted when recomputing the state
  // i.e. the events that occured after the restored state
  const ignored = getOmittedEvents();
  const lastEvtId = currentSimulationState.getLastEventId();
  const all = getAllEvents();
  let i = all.length - 1;
  while (i > 0 && all[i].id !== lastEvtId) {
    ignored[all[i].id] = true;
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
  const raw = Variable.find(gameModel, 'debugIgnoredEvents').getInstance(self).getProperties()[
    'ignored'
  ];
  const ignored = JSON.parse(raw) as Record<string, boolean>;
  return ignored;
}
