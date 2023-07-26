/**
 * Setup function
 */

import { mainSimLogger } from "../tools/logger";
import { GetInformationAction } from "./common/actions/actionBase";
import { ActionTemplateBase, DefineMapObjectTemplate, GetInformationTemplate } from "./common/actions/actionTemplateBase";
import { Actor } from "./common/actors/actor";
import { ActorId, TemplateRef } from "./common/baseTypes";
import { TimeSliceDuration } from "./common/constants";
import { EventPayload } from "./common/events/eventTypes";
import { FullEvent, sendEvent } from "./common/events/eventUtils";
import { TimeForwardLocalEvent } from "./common/localEvents/localEventBase";
import { localEventManager } from "./common/localEvents/localEventManager";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";

// TODO see if useRef makes sense (makes persistent to script changes)
let currentSimulationState = initMainState();//Helpers.useRef<MainSimulationState>('current-state', initMainState());
const stateHistory = [currentSimulationState];//Helpers.useRef<MainSimulationState[]>('state-history', [currentSimulationState.current]);

const actionTemplates = initActionTemplates();//Helpers.useRef<Record<string, ActionTemplateBase<ActionBase, EventPayload>>>('action-templates', initActionTemplates());

mainSimLogger.info('Main simulation initialized')

function initMainState(): MainSimulationState {

  // TODO read all simulation parameters to build start state and initilize the whole simulation

  const testAL = new Actor('AL', 'actor-al', 'actor-al-long');

  const testAction = new GetInformationAction(0, TimeSliceDuration * 2, 'message-key', 'action name', 0, testAL.Uid);

  return new MainSimulationState({
    actions: [testAction],
    actors: [testAL],
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
  const mapTest = new DefineMapObjectTemplate('define-map-object', 'define-map-object-desc');

  const templates : Record<string, ActionTemplateBase> = {};
  templates[getInfo.getTemplateRef()] = getInfo;
  templates[getInfo2.getTemplateRef()] = getInfo2;
  templates[mapTest.getTemplateRef()] = mapTest;

  return templates;
}

/**
 * Checks for new events and applies them to the state
 * Forces rerendering if any changes ?
 */
function runUpdateLoop(): void {

  // get all events
  const globalEvents : FullEvent<EventPayload>[] = [];

  // filter out non processed events

  // apply events and generate new state

  let last : MainSimulationState | undefined = undefined;
  globalEvents.forEach(event =>  {
    last = processEvent(event);
  })

  if(last){
    currentSimulationState = last;
  }

  // TODO force render ?
}

/**
 * Processes one global event and computes a new state from there
 * @param event the global event to process
 * @returns the resulting simulation state
 */
function processEvent(event : FullEvent<EventPayload>): MainSimulationState{

  // TODO store ids of processed events

  switch(event.payload.type){
    case 'ActionEvent': {
        // find corresponding creation template
        const actionTemplate = actionTemplates[event.payload.templateRef];
        if(!actionTemplate){
          mainSimLogger.error('no template was found for ref ', event.payload.templateRef);
        }else{
          const localEvent = actionTemplate?.buildLocalEvent(event);
          localEventManager.queueLocalEvent(localEvent);
        }
      }
      break;
    case 'TimeForwardEvent':{
        const timefwdEvent = new TimeForwardLocalEvent(event.id, event.payload.timeJump, event.payload.timeStamp);
        localEventManager.queueLocalEvent(timefwdEvent);
      }
      break;
    
  }

  // process all generated events
  const newState = localEventManager.processPendingEvents(currentSimulationState);
  stateHistory.push(newState);
  return newState;

}

export function fetchAvailableActions(actorId: ActorId): ActionTemplateBase[] {
  const actor = currentSimulationState.getActorById(actorId);
  if(actor){
    return Object.values(actionTemplates).filter(at => at.isAvailable(currentSimulationState, actor));
  }else{
    return [];
  }
}


export async function buildAndLaunchActionFromTemplate(ref: TemplateRef, selectedActor: Actor): Promise<IManagedResponse | undefined>{

  const actTemplate = actionTemplates[ref];
  if(actTemplate){
    const evt = actTemplate.buildGlobalEvent(currentSimulationState.getSimTime(), selectedActor, undefined);
    return await sendEvent(evt);
  }else {
    mainSimLogger.error('Could not find action template with ref', ref);
  }
}