/**
 * Setup function
 */

import { getTmpFeature, isMapAction } from "../gameMap/main";
import { mainSimLogger } from "../tools/logger";
import { GetInformationAction } from "./common/actions/actionBase";
import { ActionTemplateBase, DefineMapObjectTemplate, GetInformationTemplate } from "./common/actions/actionTemplateBase";
import { Actor } from "./common/actors/actor";
import { ActorId, TemplateRef } from "./common/baseTypes";
import { TimeSliceDuration } from "./common/constants";
import { initBaseEvent } from "./common/events/baseEvent";
import { ActionCreationEvent, TimeForwardEvent, TimedEventPayload } from "./common/events/eventTypes";
import { compareTimedEvents, FullEvent, getAllEvents, sendEvent } from "./common/events/eventUtils";
import { TimeForwardLocalEvent } from "./common/localEvents/localEventBase";
import { localEventManager } from "./common/localEvents/localEventManager";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";

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
  const testMCS = new Actor('MCS', 'actor-mcs', 'actor-mcs-long')
  const testACS = new Actor('ACS', 'actor-als', 'actor-als-long')

  const testAction = new GetInformationAction(0, TimeSliceDuration * 2, 'message-key', 'action name', 0, testAL.Uid);

  return new MainSimulationState({
    actions: [testAction],
    actors: [testAL, testMCS, testACS],
    mapLocations: [],
    patients: [],
    tasks: [],
    radioMessages: []
  }, 0, 0);

}

function initActionTemplates(): Record<string, ActionTemplateBase> {

  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const getInfo = new GetInformationTemplate('get-basic-info', 'get-basic-info-desc', TimeSliceDuration * 2, 'get-basic-info-message');
  const getInfo2 = new GetInformationTemplate('get-other-basic-info', 'get-other-basic-info-desc', TimeSliceDuration, 'get-other-basic-info-message');

  const placePMA = new DefineMapObjectTemplate('define-PMA', 'define-map-PMA', TimeSliceDuration, 'PMA', 'Point');
  const placePC = new DefineMapObjectTemplate('define-PC', 'define-map-PC', TimeSliceDuration, 'PC', 'Point');
  const placeNest = new DefineMapObjectTemplate('define-Nest', 'define-map-Nest', TimeSliceDuration, 'Nest', 'Point');

  const templates : Record<string, ActionTemplateBase> = {};
  templates[getInfo.getTemplateRef()] = getInfo;
  templates[getInfo2.getTemplateRef()] = getInfo2;
  templates[placePMA.getTemplateRef()] = placePMA;
  templates[placePC.getTemplateRef()] = placePC;
  templates[placeNest.getTemplateRef()] = placeNest;

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

