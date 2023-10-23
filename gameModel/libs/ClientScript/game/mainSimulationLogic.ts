/**
 * Setup function
 */
import { mainSimLogger } from "../tools/logger";
import {
	ActionTemplateBase,
	AskReinforcementActionTemplate,
	DefineMapObjectTemplate,
	MethaneTemplate,
	GetInformationTemplate,
	RequestResourcesFromActorActionTemplate, SendResourcesToActorActionTemplate, AssignTaskToResourcesActionTemplate, ReleaseResourcesFromTaskActionTemplate,
} from './common/actions/actionTemplateBase';
import { Actor } from "./common/actors/actor";
import { ActorId, TaskId, TemplateId, TemplateRef } from "./common/baseTypes";
import { TimeSliceDuration } from "./common/constants";
import { initBaseEvent } from "./common/events/baseEvent";
import { PointFeature } from "./common/events/defineMapObjectEvent";
import { ActionCancellationEvent, ActionCreationEvent, ResourceAllocationEvent, ResourceReleaseEvent, TimeForwardEvent, TimedEventPayload } from "./common/events/eventTypes";
import { compareTimedEvents, FullEvent, getAllEvents, sendEvent } from "./common/events/eventUtils";
import { CancelActionLocalEvent, TimeForwardLocalEvent } from "./common/localEvents/localEventBase";
import { localEventManager } from "./common/localEvents/localEventManager";
import { loadPatients } from "./common/patients/handleState";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";
import { PreTriageTask, TaskBase } from "./common/tasks/taskBase";
import * as TaskLogic from "./common/tasks/taskLogic";
import { ResourceType } from './common/resources/resourceType';
import { Resource } from './common/resources/resource';

// TODO see if useRef makes sense (makes persistent to script changes)
let currentSimulationState : MainSimulationState;//Helpers.useRef<MainSimulationState>('current-state', initMainState());
let stateHistory : MainSimulationState[];//Helpers.useRef<MainSimulationState[]>('state-history', [currentSimulationState.current]);

let actionTemplates :Record<string, ActionTemplateBase>;//Helpers.useRef<Record<string, ActionTemplateBase<ActionBase, EventPayload>>>('action-templates', initActionTemplates());
let processedEvents :Record<string, FullEvent<TimedEventPayload>>;

let updateCount: number;

// useEffect to force initate simulationState
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

  const testAL = new Actor('AL', 'actor-al', 'actor-al-long');

  const mainAccident: PointFeature = {
	ownerId: 0,
    geometryType: 'Point',
    name: "Lieu de l'accident",
    //geometry: [2497449.9236694486,1120779.3310497932],
    geometry: [2500100,1118500],
	icon: 'mainAccident',
  }

  const taskPretri = new PreTriageTask("PreTriage", "pre-tri-desc", 1, 5, 'Pretriage task completed!');
  //const testTaskPretriB = new PreTriageTask("pre-tri-zone-B-title", "pre-tri-zone-B-desc", 1, 5, "B", 'pre-tri-zone-B-feedback');

	const initialResources = [
		new Resource('secouriste', testAL.Uid),
		new Resource('secouriste', testAL.Uid),
		new Resource('secouriste', testAL.Uid),
		new Resource('secouriste', testAL.Uid),
		new Resource('secouriste', testAL.Uid),
		new Resource('secouriste', testAL.Uid),
		new Resource('technicienAmbulancier', testAL.Uid),
		new Resource('technicienAmbulancier', testAL.Uid),
		new Resource('technicienAmbulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('ambulancier', testAL.Uid),
		new Resource('infirmier', testAL.Uid),
		new Resource('infirmier', testAL.Uid),
		new Resource('infirmier', testAL.Uid),
		new Resource('infirmier', testAL.Uid),
		new Resource('infirmier', testAL.Uid),
		new Resource('medecinJunior', testAL.Uid),
		new Resource('medecinJunior', testAL.Uid),
		new Resource('medecinJunior', testAL.Uid),
		new Resource('medecinJunior', testAL.Uid),
		new Resource('medecinSenior', testAL.Uid),];


  return new MainSimulationState({
    actions: [],
    cancelledActions: [],
    actors: [testAL],
    mapLocations: [mainAccident],
    patients: loadPatients(),
	pretriageResults: {},
    tasks: [taskPretri],
    radioMessages: [],
    resources: initialResources,
  }, 0, 0);

}

function initActionTemplates(): Record<string, ActionTemplateBase> {

  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const getInfo = new GetInformationTemplate('basic-info-title', 'basic-info-desc', TimeSliceDuration * 2, 'basic-info-feedback');
  const getInfo2 = new GetInformationTemplate('other-basic-info-title', 'other-basic-info-desc', TimeSliceDuration, 'other-basic-info-feedback');
  const getPoliceInfos = new GetInformationTemplate('basic-info-police-title', 'basic-info-police-desc', TimeSliceDuration, 'basic-info-police-feedback');
  const getFireFighterInfos = new GetInformationTemplate('basic-info-firefighter-title', 'basic-info-firefighter-desc', TimeSliceDuration, 'basic-info-firefighter-feedback');

  const methane = new MethaneTemplate('methane-title', 'methane-desc', TimeSliceDuration, 'methane-feedback');

  const placePMA = new DefineMapObjectTemplate('define-PMA-title', 'define-PMA-desc', TimeSliceDuration, 'define-PMA-feedback', {geometryType: 'Point', name: 'PMA', icon: 'PMA'});
  const placePC = new DefineMapObjectTemplate('define-PC-title', 'define-PC-desc', TimeSliceDuration, 'define-PC-feedback', {geometryType: 'Point', name: 'PC', icon: 'PC'});
  const placeNest = new DefineMapObjectTemplate('define-Nest-title', 'define-Nest-desc', TimeSliceDuration, 'define-Nest-feedback', {geometryType: 'Point', name: 'Nid de Bléssés', icon: 'Nest'});

  const placeSectors = new DefineMapObjectTemplate('define-sectors-title', 'define-sectors-desc', TimeSliceDuration, 'define-sectors-feedback', 
  	{geometryType: 'MultiPolygon', name: 'Triage Zone', feature: {
		  ownerId: 0,
		  geometryType: 'MultiPolygon',
		  name: 'Triage Zone',
		  geometry: [
			  [[
				[2497448.123431715,1120782.855941937], [2497454.9378800406,1120795.9667623597], 
		  		[2497437.046434614,1120798.377919056], [2497426.03428612,1120778.8641895403],
				[2497448.123431715,1120782.855941937],
			  ]],
			  [[
				[2497451.4923869567,1120779.4898404605], [2497436.995642877,1120761.1578418843], 
		  		[2497444.3693446065,1120756.7930486996], [2497471.1334157903,1120774.0791353388],
				[2497465.031258829,1120794.875361428], [2497451.4923869567,1120779.4898404605],
			]]
			],
  	}});

  const requestResources = new RequestResourcesFromActorActionTemplate('request-resources-title', 'request-resources-description', TimeSliceDuration, 'request-resources-message');
  const sendResources = new SendResourcesToActorActionTemplate('send-resources-title', 'send-resources-description', TimeSliceDuration, 'send-resources-message');

  const assignTaskToResources = new AssignTaskToResourcesActionTemplate('assign-task-title', 'assign-task-description', TimeSliceDuration, 'assign-task-message');
  const releaseResourcesFromTask = new ReleaseResourcesFromTaskActionTemplate('release-task-title', 'release-task-description', TimeSliceDuration, 'release-task-message');

  const askReinforcement = new AskReinforcementActionTemplate('ask-reinforcement-title', 'ask-reinforcement-desc', TimeSliceDuration, 'ambulancier', 5, 'ask-reinforcement-feedback');

  const templates: Record<string, ActionTemplateBase> = {};
  templates[getInfo.getTemplateRef()] = getInfo;
  templates[getInfo2.getTemplateRef()] = getInfo2;
  templates[getPoliceInfos.getTemplateRef()] = getPoliceInfos;
  templates[getFireFighterInfos.getTemplateRef()] = getFireFighterInfos;
  templates[methane.getTemplateRef()] = methane;
  templates[placePMA.getTemplateRef()] = placePMA;
  templates[placePC.getTemplateRef()] = placePC;
  templates[placeNest.getTemplateRef()] = placeNest;
  templates[placeSectors.getTemplateRef()] = placeSectors;
  templates[requestResources.getTemplateRef()] = requestResources;
  templates[sendResources.getTemplateRef()] = sendResources;
  templates[assignTaskToResources.getTemplateRef()] = assignTaskToResources;
  templates[releaseResourcesFromTask.getTemplateRef()] = releaseResourcesFromTask;
  templates[askReinforcement.getTemplateRef()] = askReinforcement;

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
  const globalEvents : FullEvent<TimedEventPayload>[] = getAllEvents<TimedEventPayload>();

  // filter out non processed events
  const unprocessed = globalEvents.filter(e => !processedEvents[e.id]);

  const sorted = unprocessed.sort(compareTimedEvents);

  // process all candidate events
  mainSimLogger.info('Starting event processing...');
  sorted.forEach(event =>  {
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
function processEvent(event : FullEvent<TimedEventPayload>){

  const now = currentSimulationState.getSimTime();
  if(event.payload.triggerTime < now){
    mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
    mainSimLogger.warn('Likely due to a TimeForwardEvent that has jumped over an existing event => BUG');
    return;
  }else if (event.payload.triggerTime > now){
    mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
    mainSimLogger.warn('This event will be processed later');
    return;
  }

  switch(event.payload.type){
    case 'ActionCreationEvent': {
        // find corresponding creation template
        const actionTemplate = actionTemplates[event.payload.templateRef];
        if(!actionTemplate){
          mainSimLogger.error('no template was found for ref ', event.payload.templateRef);
        }else{
          const localEvent = actionTemplate.buildLocalEvent(event as FullEvent<ActionCreationEvent>);
          localEventManager.queueLocalEvent(localEvent);
        }
      }
      break;
    case 'ActionCancellationEvent': {
	  const payload = event.payload;
      const action = getCurrentState().getAllActions().find(a => a.getTemplateId() === payload.templateId && a.ownerId === payload.actorId);
      if (!action) {
        mainSimLogger.error('no action was found with id ', payload.templateId);
      } else {
        const localEvent = new CancelActionLocalEvent(event.id, event.payload.triggerTime, event.payload.templateId, event.payload.actorId, event.payload.timeStamp);
        localEventManager.queueLocalEvent(localEvent);
      }

    }
      break;
    case 'ResourceAllocationEvent': {
      const newLocalEvent = TaskLogic.createResourceAllocationLocalEvent(event as FullEvent<ResourceAllocationEvent>, currentSimulationState);
      if (newLocalEvent != null) {
        localEventManager.queueLocalEvent(newLocalEvent);
      }
      break;
    }
    case 'ResourceReleaseEvent': {
      const newLocalEvent = TaskLogic.createResourceReleaseLocalEvent(event as FullEvent<ResourceReleaseEvent>, currentSimulationState);
      if (newLocalEvent != null) {
        localEventManager.queueLocalEvent(newLocalEvent);
      }
      break;
    }
    case 'TimeForwardEvent':{
        const timefwdEvent = new TimeForwardLocalEvent(event.id, event.payload.triggerTime, event.payload.timeJump);
        localEventManager.queueLocalEvent(timefwdEvent);
      }
      break;
    default :
      mainSimLogger.error('unsupported global event type : ', event.payload.type, event);
      break;
  }

  processedEvents[event.id] = event;

  // process all generated events
  const newState = localEventManager.processPendingEvents(currentSimulationState);
  mainSimLogger.info('new state with count', newState.stateCount, newState);

  if(newState.stateCount !== currentSimulationState.stateCount){
	mainSimLogger.info('updating current state');
    currentSimulationState = newState;
    stateHistory.push(newState);
  }
}

export function fetchAvailableActions(actorId: ActorId): ActionTemplateBase[] {
  const actor = currentSimulationState.getActorById(actorId);
  if(actor){
    return Object.values(actionTemplates).filter(at => at.isAvailable(currentSimulationState, actor));
  }else{
	mainSimLogger.warn('Actor not found. id = ', actorId);
    return [];
  }
}

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
	return Object.values(actionTemplates);
}

export async function buildAndLaunchActionFromTemplate(ref: TemplateRef, selectedActor: ActorId, params: any): Promise<IManagedResponse | undefined>{

  const actTemplate = actionTemplates[ref];
  
  const actor = currentSimulationState.getActorById(selectedActor);

  if(actTemplate && actor){
    const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), actor, params);
    return await sendEvent(evt);
  }else {
    mainSimLogger.error('Could not find action template with ref or actor with id', ref, selectedActor);
  }
}

export async function buildAndLaunchResourceAllocation(taskId: TaskId, selectedActor: ActorId, resourceType : ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
  const globalEvent: ResourceAllocationEvent = {
    ...initBaseEvent(0),
    triggerTime: currentSimulationState.getSimTime(),
    type: 'ResourceAllocationEvent',
    taskId,
    actorId: selectedActor,
    resourceType,
    nbResources,
  }

  return await sendEvent(globalEvent);
}

export async function buildAndLaunchResourceRelease(taskId: TaskId, selectedActor: ActorId, resourceType: ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
  const globalEvent: ResourceReleaseEvent = {
    ...initBaseEvent(0),
    triggerTime: currentSimulationState.getSimTime(),
    type: 'ResourceReleaseEvent',
    taskId,
    actorId: selectedActor,
    resourceType,
    nbResources,
  }

  return await sendEvent(globalEvent);
}

export async function buildAndLaunchActionCancellation(selectedActor: ActorId, templateId: TemplateId): Promise<IManagedResponse | undefined> {
  const action = getCurrentState().getAllActions().find(a => a.getTemplateId() === templateId && a.ownerId === selectedActor);

  if(action && selectedActor) {
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
export async function triggerTimeForward() : Promise<IManagedResponse> {
  const tf : TimeForwardEvent = {
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

export function recomputeState(){
	wlog('Reinitialize state');
	processedEvents = {};

  Actor.resetIdSeed();
  ActionTemplateBase.resetIdSeed();
  TaskBase.resetIdSeed();
  Resource.resetIdSeed();

	// TODO see if useRef makes sense (makes persistent to script changes)
	currentSimulationState = initMainState();//Helpers.useRef<MainSimulationState>('current-state', initMainState());
	stateHistory = [currentSimulationState];//Helpers.useRef<MainSimulationState[]>('state-history', [currentSimulationState.current]);

	actionTemplates = initActionTemplates();//Helpers.useRef<Record<string, ActionTemplateBase<ActionBase, EventPayload>>>('action-templates', initActionTemplates());

	updateCount = 0;

	wlog('reset done');
	runUpdateLoop();
}

