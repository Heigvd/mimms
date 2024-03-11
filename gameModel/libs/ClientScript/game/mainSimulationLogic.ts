/**
 * Setup function
 */
import { mainSimLogger } from "../tools/logger";
import {
	ActionTemplateBase,
	GetInformationTemplate,
  CasuMessageTemplate,
  SendRadioMessage,
  SelectionFixedMapEntityTemplate,
  SimFlag,
  MoveActorActionTemplate,
  ArrivalAnnoucementTemplate,
  AppointActorActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
} from './common/actions/actionTemplateBase';
import { Actor } from "./common/actors/actor";
import { ActorId, TemplateId, TemplateRef } from "./common/baseTypes";
import { TimeSliceDuration } from "./common/constants";
import { initBaseEvent } from "./common/events/baseEvent";
import { BuildingStatus, GeometryBasedFixedMapEntity, MultiLineStringGeometricalShape, PointGeometricalShape, PolygonGeometricalShape } from "./common/events/defineMapObjectEvent";
import { ActionCancellationEvent, ActionCreationEvent, TimeForwardEvent, TimedEventPayload, isLegacyGlobalEvent } from "./common/events/eventTypes";
import { compareTimedEvents, FullEvent, getAllEvents, sendEvent } from "./common/events/eventUtils";
import { CancelActionLocalEvent, TimeForwardLocalEvent } from "./common/localEvents/localEventBase";
import { localEventManager } from "./common/localEvents/localEventManager";
import { loadPatients } from "./common/patients/handleState";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";
import { Resource } from './common/resources/resource';
import { resetSeedId } from "./common/resources/resourceContainer";
import { loadEmergencyResourceContainers } from "./common/resources/emergencyDepartment";
import { TaskBase } from "./common/tasks/taskBase";
import { PorterTask } from "./common/tasks/taskBasePorter";
import { PreTriageTask } from "./common/tasks/taskBasePretriage";
import { ActionType } from "./common/actionType";
import { LOCATION_ENUM } from "./common/simulationState/locationState";
import { WaitingTask } from "./common/tasks/taskBaseWaiting";


let currentSimulationState : MainSimulationState;
let stateHistory : MainSimulationState[];

let actionTemplates :Record<string, ActionTemplateBase>;
let processedEvents :Record<string, FullEvent<TimedEventPayload>>;

let updateCount: number;

Helpers.registerEffect(() => {
		currentSimulationState = initMainState();
		stateHistory = [currentSimulationState];

		actionTemplates = {};
		processedEvents = {};

		updateCount = 0;

		mainSimLogger.info('Main simulation initialized', actionTemplates);
		mainSimLogger.info('Initial state', currentSimulationState);
		
		recomputeState();
})


function initMainState(): MainSimulationState {

	// TODO read all simulation parameters to build start state and initilize the whole simulation

	const testAL = new Actor('AL', LOCATION_ENUM.meetingPoint);
	const testCASU = new Actor('CASU', LOCATION_ENUM.remote);

	const mainAccident = new GeometryBasedFixedMapEntity(0, "location-chantier", LOCATION_ENUM.chantier, [], new PointGeometricalShape([[2500100, 1118500]], [2500100, 1118500]), BuildingStatus.ready, 'mainAccident');
	
    const taskPretri = new PreTriageTask("pre-tri-title", "pre-tri-desc", 1, 5, 'pretriage-task-completed', [LOCATION_ENUM.chantier]);
    const taskPorter = new PorterTask("brancardage-title", "porter-desc", 2, 10, 'porters-task-completed', [LOCATION_ENUM.chantier]);
	const taskWaiting = new WaitingTask("waiting-title", "waiting-task-desc", 1, 10000, '', [LOCATION_ENUM.PC, LOCATION_ENUM.PMA, LOCATION_ENUM.chantier, LOCATION_ENUM.meetingPoint, LOCATION_ENUM.nidDeBlesses]);


	const initialResources = [
		new Resource('ambulancier', LOCATION_ENUM.meetingPoint, taskWaiting.Uid),
		/*new Resource('secouriste'),
		new Resource('secouriste'),
		new Resource('secouriste'),
		new Resource('secouriste'),
		new Resource('secouriste'),
		new Resource('medecinJunior'),
		new Resource('medecinJunior'),
		new Resource('medecinJunior'),
		new Resource('medecinJunior'),*/
	];

  return new MainSimulationState({
    actions: [],
    cancelledActions: [],
    actors: [testAL, testCASU],
    mapLocations: [mainAccident],
    patients: loadPatients(),
    tasks: [taskWaiting, taskPretri, taskPorter],
    radioMessages: [],
    resources: initialResources,
    resourceContainers: loadEmergencyResourceContainers(),
    flags: {}
  }, 0, 0);

}

function initActionTemplates(): Record<string, ActionTemplateBase> {

  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const placeMeetingPoint = new SelectionFixedMapEntityTemplate('define-meetingPoint-title', 'define-meetingPoint-desc', TimeSliceDuration , 'define-meetingPoint-feedback', new GeometryBasedFixedMapEntity(0, "location-meetingpoint", LOCATION_ENUM.meetingPoint, ['AL'], new PointGeometricalShape([[2500075.549931927, 1118500.103111194], [2500106.549931926, 1118550.103111192], [2500106.549931926, 1118489.103111192]]), BuildingStatus.selection, 'meetingpoint_blue'),false, [], [SimFlag.MEETINGPOINT_BUILT]);
  const getInfo = new GetInformationTemplate('basic-info-title', 'basic-info-desc', TimeSliceDuration * 2, 'basic-info-feedback');
  const getInfo2 = new GetInformationTemplate('other-basic-info-title', 'other-basic-info-desc', TimeSliceDuration, 'other-basic-info-feedback');
  const getPoliceInfos = new GetInformationTemplate('basic-info-police-title', 'basic-info-police-desc', TimeSliceDuration, 'basic-info-police-feedback');
  const getFireFighterInfos = new GetInformationTemplate('basic-info-firefighter-title', 'basic-info-firefighter-desc', TimeSliceDuration, 'basic-info-firefighter-feedback');

  const casuMessage = new CasuMessageTemplate('casu-message-title', 'casu-message-desc', TimeSliceDuration, 'casu-message-feedback');
  const radioMessage = new SendRadioMessage('send-radio-title', 'send-radio-desc', TimeSliceDuration, 'send-radio-feedback');

  const moveActor = new MoveActorActionTemplate('move-actor-title', 'move-actor-desc', TimeSliceDuration, 'move-actor-feedback', true, [SimFlag.MEETINGPOINT_BUILT]);

  const placeAccessRegress = new SelectionFixedMapEntityTemplate('define-accreg-title', 'define-accreg-desc', TimeSliceDuration * 3, 'define-accreg-feedback', new GeometryBasedFixedMapEntity(0, 'Accreg', 'Accreg', [], new MultiLineStringGeometricalShape([
        [[[2500052.6133020874, 1118449.2968644362], [2500087.3369474486, 1118503.6293053096]], [[2500060.952470149, 1118523.9098080816], [2500029.950508212, 1118486.1465293542]]], 
        [[[2500113.647301364, 1118575.704815885], [2500096.7293570912, 1118534.8226090078]], [[2500060.952470149, 1118523.9098080816], [2500029.950508212, 1118486.1465293542]]],
        [[[2500040.187860512,1118562.59843714],[2500065.949428312,1118543.3339090333]], [[2500109.5966483564,1118490.3921636103], [2500134.8148273816,1118469.6649961546]]],
      ]), BuildingStatus.selection, 'right-arrow', false));

  const acsMcsArrivalAnnoucement = new ArrivalAnnoucementTemplate('define-acsMscArrival-title', 'define-acsMscArrival-desc', TimeSliceDuration, 'define-acsMscArrival-feedback', false,[SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED], [SimFlag.ACS_MCS_ANNOUNCED], ['ACS', 'MCS']);

  const appointEVASAN = new AppointActorActionTemplate('appoint-EVASAN-title', 'appoint-EVASAN-desc', TimeSliceDuration, 'appoint-EVASAN-feedback', true, 'appoint-EVASAN-wentWrong-feedback', 'EVASAN', LOCATION_ENUM.PC, 'ambulancier', [SimFlag.PC_BUILT, SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED], [SimFlag.EVASAN_ARRIVED]);

  const placePMA = new SelectionFixedMapEntityTemplate('define-PMA-title', 'define-PMA-desc', TimeSliceDuration * 4, 'define-PMA-feedback', new GeometryBasedFixedMapEntity(0, 'location-pma-short', LOCATION_ENUM.PMA, ['LEADPMA'], new PolygonGeometricalShape(
		[[[[2499959.513377705, 1118456.6791527744], //'way/301355984'
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
		   [2499959.513377705, 1118456.6791527744]]],
		 [[[2500109.999851025, 1118456.3699052047], //'way/82683752'
		   [2500113.781500128, 1118461.010360654],
		   [2500121.785907592, 1118470.828775529],
		   [2500114.0474236254, 1118477.104916978],
		   [2500105.0520694936, 1118484.3913443699],
		   [2500096.448885649, 1118473.8379365443],
		   [2500093.2659977684, 1118469.932506736],
		   [2500109.999851025, 1118456.3699052047]]], //'way/179543646'
		 [[[2500136.790143822, 1118548.3406066815],
		   [2500141.6760064885, 1118560.489763118],
		   [2500143.4792181817, 1118564.9850271842],
		   [2500124.888196066, 1118572.1742195904],
		   [2500121.81913271, 1118564.4089291636],
		   [2500118.355243353, 1118555.6384201094],
		   [2500133.0180577287, 1118549.8816207554],
		   [2500136.790143822, 1118548.3406066815]]]]), BuildingStatus.selection, 'PMA'));
	
  const placePC = new SelectionFixedMapEntityTemplate('define-PC-title', 'define-PC-desc', TimeSliceDuration * 2, 'define-PC-feedback', new GeometryBasedFixedMapEntity(0, 'location-pc-short', LOCATION_ENUM.PC, ['ACS', 'MCS'], new PointGeometricalShape([[2500095.549931929, 1118489.103111194], [2500009.75586577, 1118472.531405577], [2500057.0688582086, 1118551.6205987816]]), BuildingStatus.selection, 'PC'), false, [SimFlag.PCS_ARRIVED], [SimFlag.PC_BUILT]);
  const placeNest = new SelectionFixedMapEntityTemplate('define-Nest-title', 'define-Nest-desc', TimeSliceDuration * 3, 'define-Nest-feedback', new GeometryBasedFixedMapEntity(0, "location-niddeblesses", LOCATION_ENUM.nidDeBlesses, ['MCS'], new PointGeometricalShape([[2500041.9170648125, 1118456.4054969894], [2500106.9001576486, 1118532.2446804282], [2499999.6045754217, 1118483.805125067]]), BuildingStatus.selection, 'Nest'));

  const allocateResources = new MoveResourcesAssignTaskActionTemplate('move-res-task-title', 'move-res-task-desc', TimeSliceDuration, 'move-res-task-feedback', 'move-res-task-refused', true);

  const templates: Record<string, ActionTemplateBase> = {};
  templates[placeMeetingPoint.getTemplateRef()] = placeMeetingPoint;
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
  templates[acsMcsArrivalAnnoucement.getTemplateRef()] = acsMcsArrivalAnnoucement;
  templates[appointEVASAN.getTemplateRef()] = appointEVASAN;
  templates[allocateResources.getTemplateRef()] = allocateResources;

  return templates;
}

/**
 * Checks for new events and applies them to the state
 * Forces rerendering if any changes ?
 */
export function runUpdateLoop(): void {

	updateCount++;
	mainSimLogger.info('------ start of update loop', updateCount);

	// get all events
	const globalEvents: FullEvent<TimedEventPayload>[] = getAllEvents<TimedEventPayload>();

	// filter out non processed events
	const unprocessed = globalEvents.filter(e => !processedEvents[e.id]);

	const sorted = unprocessed.sort(compareTimedEvents);

	// process all candidate events
	mainSimLogger.info('Starting event processing...');
	sorted.forEach(event => {
		mainSimLogger.info('Processing event ', event);
		processEvent(event);
	})

	mainSimLogger.info('------ ..... end of update loop', updateCount);
	// TODO force render ?
}

/**
 * Processes one global event and computes a new resulting state
 * The new state is appended in the history
 * The event is ignored if it doesn't match with the current simulation time
 * @param event the global event to process
 * @returns the resulting simulation state
 */
function processEvent(event: FullEvent<TimedEventPayload>) {

	const now = currentSimulationState.getSimTime();
	if (event.payload.triggerTime < now) {
		mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
		mainSimLogger.warn('Likely due to a TimeForwardEvent that has jumped over an existing event => BUG');
		return;
	} else if (event.payload.triggerTime > now) {
		mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
		mainSimLogger.warn('This event will be processed later');
		return;
	}

	switch (event.payload.type) {
		case 'ActionCreationEvent': {
			// find corresponding creation template
			const actionTemplate = actionTemplates[event.payload.templateRef];
			if (!actionTemplate) {
				mainSimLogger.error('no template was found for ref ', event.payload.templateRef);
			} else {
				const localEvent = actionTemplate.buildLocalEvent(event as FullEvent<ActionCreationEvent>);
				localEventManager.queueLocalEvent(localEvent);
			}
		}
			break;
		case 'ActionCancellationEvent': {
			const payload = event.payload;
			const now = getCurrentState().getSimTime();
			const action = getCurrentState().getAllActions().find(a => a.getTemplateId() === payload.templateId && a.ownerId === payload.actorId && a.startTime == now);
			if (!action) {
				mainSimLogger.error('no action was found with id ', payload.templateId);
			} else {
				const localEvent = new CancelActionLocalEvent(event.id, event.payload.triggerTime, event.payload.templateId, event.payload.actorId, event.payload.timeStamp);
				localEventManager.queueLocalEvent(localEvent);
			}

		}
			break;
		case 'TimeForwardEvent': {
			const timefwdEvent = new TimeForwardLocalEvent(event.id, event.payload.triggerTime, event.payload.timeJump);
			localEventManager.queueLocalEvent(timefwdEvent);
		}
			break;
		default:
			if(isLegacyGlobalEvent(event)){
				mainSimLogger.warn('Legacy event ignored', event.payload.type, event);
			}else {
				mainSimLogger.error('unsupported global event type : ', event.payload.type, event);
			}
			break;
	}

	processedEvents[event.id] = event;

	// process all generated events
	const newState = localEventManager.processPendingEvents(currentSimulationState);
	mainSimLogger.info('new state with count', newState.stateCount, newState);

	if (newState.stateCount !== currentSimulationState.stateCount) {
		mainSimLogger.info('updating current state');
		currentSimulationState = newState;
		stateHistory.push(newState);
	}
}

export function fetchAvailableActions(actorId: ActorId, actionType: ActionType = ActionType.ACTION): ActionTemplateBase[] {
	const actor = currentSimulationState.getActorById(actorId);
	if (actor) {
		return Object.values(actionTemplates).filter(at => at.isAvailable(currentSimulationState, actor) && at.isInCategory(actionType));
	} else {
		mainSimLogger.warn('Actor not found. id = ', actorId);
		return [];
	}
}

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
	return Object.values(actionTemplates);
}

export async function buildAndLaunchActionFromTemplate(ref: TemplateRef, selectedActor: ActorId, params: any): Promise<IManagedResponse | undefined> {

	const actTemplate = actionTemplates[ref];

	const actor = currentSimulationState.getActorById(selectedActor);

	if (actTemplate && actor) {
		const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), actor, params);
		return await sendEvent(evt);
	} else {
		mainSimLogger.error('Could not find action template with ref or actor with id', ref, selectedActor);
	}
}

export async function buildAndLaunchActionCancellation(selectedActor: ActorId, templateId: TemplateId): Promise<IManagedResponse | undefined> {
	const action = getCurrentState().getAllActions().find(a => a.getTemplateId() === templateId && a.ownerId === selectedActor);

	if (action && selectedActor) {
		const cancellationEvent: ActionCancellationEvent = {
			...initBaseEvent(0),
			triggerTime: currentSimulationState.getSimTime(),
			type: 'ActionCancellationEvent',
			templateId: templateId,
			actorId: selectedActor,
			timeStamp: getCurrentState().getSimTime(),
		}

		return await sendEvent(cancellationEvent);
	} else {
		mainSimLogger.error('Could not find action or actor with uids', templateId, selectedActor)
	}
}

/**
 * Triggers time forward in the simulation
 * @returns managed response
 */
export async function triggerTimeForward(): Promise<IManagedResponse> {
	const tf: TimeForwardEvent = {
		...initBaseEvent(0),
		triggerTime: currentSimulationState.getSimTime(),
		timeJump: TimeSliceDuration,
		type: "TimeForwardEvent",
	}

	return await sendEvent(tf);
}

export function getCurrentState(): Readonly<MainSimulationState> {
	return currentSimulationState;
}

export function recomputeState() {
	mainSimLogger.info('Reinitialize state');
	processedEvents = {};

	Actor.resetIdSeed();
	ActionTemplateBase.resetIdSeed();
	TaskBase.resetIdSeed();
	Resource.resetIdSeed();
	resetSeedId();

	currentSimulationState = initMainState();
	stateHistory = [currentSimulationState];

	actionTemplates = initActionTemplates();

	updateCount = 0;
	
	mainSimLogger.info('reset done');
	runUpdateLoop();
}

