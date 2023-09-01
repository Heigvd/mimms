/**
 * Setup function
 */
import { mainSimLogger } from "../tools/logger";
import { ActionTemplateBase, AskReinforcementActionTemplate, DefineMapObjectTemplate, MethaneTemplate, GetInformationTemplate } from "./common/actions/actionTemplateBase";
import { Actor } from "./common/actors/actor";
import { ActorId, TaskId, TemplateRef } from "./common/baseTypes";
import { TimeSliceDuration } from "./common/constants";
import { initBaseEvent } from "./common/events/baseEvent";
import { MapFeature } from "./common/events/defineMapObjectEvent";
import { ActionCreationEvent, ResourceAllocationEvent, TimeForwardEvent, TimedEventPayload } from "./common/events/eventTypes";
import { compareTimedEvents, FullEvent, getAllEvents, sendEvent } from "./common/events/eventUtils";
import { TimeForwardLocalEvent } from "./common/localEvents/localEventBase";
import { localEventManager } from "./common/localEvents/localEventManager";
import { ResourceType } from "./common/resources/resourcePool";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";
import { PreTriTask, TaskBase } from "./common/tasks/taskBase";

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

  const mainAccident: MapFeature = {
    type: 'Point',
    name: 'mainAccident',
    geometry: [2497449.9236694486,1120779.3310497932]
  }

  const testTaskPretriA = new PreTriTask("pre-tri-zone-A-title", "pre-tri-zone-A-desc", 1, 5, "A", 'pre-tri-zone-A-feedback');
  const testTaskPretriB = new PreTriTask("pre-tri-zone-B-title", "pre-tri-zone-B-desc", 1, 5, "B", 'pre-tri-zone-B-feedback');

  const initialNbPatientInZoneA = 20;
  const initialNbPatientInZoneB = 10;

  return new MainSimulationState({
    actions: [],
    actors: [testAL],
    mapLocations: [mainAccident],
    patients: [],
    tmp: {
      nbForPreTriZoneA: initialNbPatientInZoneA,
      nbForPreTriZoneB: initialNbPatientInZoneB,
    },
    tasks: [testTaskPretriA, testTaskPretriB],
    radioMessages: [],
    resources: [],
  }, 0, 0);

}

function initActionTemplates(): Record<string, ActionTemplateBase> {

  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const getInfo = new GetInformationTemplate('basic-info-title', 'basic-info-desc', TimeSliceDuration * 2, 'basic-info-feedback');
  const getInfo2 = new GetInformationTemplate('other-basic-info-title', 'other-basic-info-desc', TimeSliceDuration, 'other-basic-info-feedback');

  const methane = new MethaneTemplate('methane-title', 'methane-desc', TimeSliceDuration, 'methane-feedback');

  const placePMA = new DefineMapObjectTemplate('define-PMA-title', 'define-PMA-desc', TimeSliceDuration, 'PMA', 'Point', 'define-PMA-feedback');
  const placePC = new DefineMapObjectTemplate('define-PC-title', 'define-PC-desc', TimeSliceDuration, 'PC', 'Point', 'define-PC-feedback');
  const placeNest = new DefineMapObjectTemplate('define-Nest-title', 'define-Nest-desc', TimeSliceDuration, 'Nest', 'Point', 'define-Nest-feedback');
  
  // TODO Mikkel
  //const placeSectors = new DefineMapObjectTemplate('define-sectors-title', 'define-sectors-desc', TimeSliceDuration, 'TODO', 'MultiPolygon', 'define-sectors-feedback');
  const askReinforcement = new AskReinforcementActionTemplate('ask-reinforcement-title', 'ask-reinforcement-desc', TimeSliceDuration, 'MEDICAL_STAFF', 20, 'ask-reinforcement-feedback');

  const templates: Record<string, ActionTemplateBase> = {};
  templates[getInfo.getTemplateRef()] = getInfo;
  templates[getInfo2.getTemplateRef()] = getInfo2;
  templates[methane.getTemplateRef()] = methane;
  templates[placePMA.getTemplateRef()] = placePMA;
  templates[placePC.getTemplateRef()] = placePC;
  templates[placeNest.getTemplateRef()] = placeNest;
  //templates[placeSectors.getTemplateRef()] = placeSectors;
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

export function fetchAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  const actor = currentSimulationState.getActorById(actorId);
  if (actor) {
    return Object.values(currentSimulationState.getAllTasks()).filter(ta => ta.isAvailable(currentSimulationState, actor));
  } else {
    mainSimLogger.warn('Actor not found. id = ', actorId);
    return [];
  }
}

export function countAvailableResources(actorId: ActorId, type: ResourceType) : number { 
  const matchingResources = getCurrentState().getResources(actorId, type);

  let sum = 0;
  matchingResources.forEach(res => sum += res.nbAvailable);

  return sum;
}

export function debugGetAllActionTemplates(): ActionTemplateBase[] {
	return Object.values(actionTemplates);
}

export async function buildAndLaunchActionFromTemplate(ref: TemplateRef, selectedActor: ActorId, params: any): Promise<IManagedResponse | undefined>{

  const actTemplate = actionTemplates[ref];
  
  const actor = getCurrentState().getActorById(selectedActor);

  if(actTemplate && actor){
    const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), actor, params);
    return await sendEvent(evt);
  }else {
    mainSimLogger.error('Could not find action template with ref or actor with id', ref, selectedActor);
  }
}

export async function buildAndLaunchResourceAllocation(taskId: TaskId, selectedActor: ActorId, nbResources: number): Promise<IManagedResponse | undefined> {
  const globalEvent: ResourceAllocationEvent = {
    ...initBaseEvent(0),
    triggerTime: currentSimulationState.getSimTime(),
    type: 'ResourceAllocationEvent',
    taskId,
    actorId: selectedActor,
    nbResources,
  }

  return await sendEvent(globalEvent);
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

	// TODO see if useRef makes sense (makes persistent to script changes)
	currentSimulationState = initMainState();//Helpers.useRef<MainSimulationState>('current-state', initMainState());
	stateHistory = [currentSimulationState];//Helpers.useRef<MainSimulationState[]>('state-history', [currentSimulationState.current]);

	actionTemplates = initActionTemplates();//Helpers.useRef<Record<string, ActionTemplateBase<ActionBase, EventPayload>>>('action-templates', initActionTemplates());

	updateCount = 0;

	wlog('reset done');
	runUpdateLoop();
}

