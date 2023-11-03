import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { getActionTemplate, planAction } from '../UIfacade/actionFacade';
import { fetchMethaneRequestValues } from '../gameInterface/actionsButtonLogic';

export function getCurrentState() {
	return mainLogic.getCurrentState();
}

export function getAllActionTemplates() {
	return mainLogic.debugGetAllActionTemplates();
}

export function getAllEvents() {
	return eventUtils.getAllEvents();
}

export function triggerEventLoop() {
	wlog('RUNNING UPDATE LOOP');
	mainLogic.runUpdateLoop();
	// Force scroll after interface rerender
	setTimeout(() => {
		Helpers.scrollIntoView('#current-time', {behavior: 'smooth', inline: 'center'})
		Helpers.scrollIntoView('.aMessage-animation', {behavior: 'smooth', block: 'start'})
	}, 1);
}

export function recomputeLocalState() {
	wlog('--- LOCAL STATE RESET');
	mainLogic.recomputeState();
}
