/**
 * Setup function
 */

import { ActionBase } from "./common/actions/actionBase";
import { ActionTemplateBase, GetInformationTemplate } from "./common/actions/actionTemplateBase";
import { EventPayload } from "./common/events/eventTypes";
import { MainSimulationState } from "./common/simulationState/mainSimulationState";

// using the useRef helper here to make this state persistent to script changes
const mainSimulationState = Helpers.useRef<MainSimulationState>('main-state', initMainState());
const actionTemplates = Helpers.useRef<Record<string, ActionTemplateBase<ActionBase, EventPayload>>>('action-templates', initActionTemplates());

function initMainState(): MainSimulationState {

  // TODO read all simulation parameters to build main state and initilize the whole simulation

  return new MainSimulationState({
    actions: [],
    actors: [],
    mapLocations: [],
    patients: [],
    tasks: []
  }, 0, 0);

}

function initActionTemplates(): Record<string, ActionTemplateBase<ActionBase, EventPayload>> {

  const test = new GetInformationTemplate('get-basic-info', 'get-basic-info-desc');
  const templates = {
    ''
  };


  return templates;
}

/**
 * Checks for new events and applies them
 * Forces rerendering if any changes ?
 */
function runUpdateLoop(): void {

  // get all events
  // filter out non processed events

  // 
}

