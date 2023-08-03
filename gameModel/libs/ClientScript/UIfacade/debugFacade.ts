import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { planAction } from '../UIfacade/actionFacade';

export function getCurrentState() {
	return mainLogic.getCurrentState();
}

export function getAllActionTemplates() {
	return mainLogic.debugGetAllActionTemplates();
}

export async function planFirstActionWithFirstActor(){

	const actor = getCurrentState().getInternalStateObject().actors[0].Uid;
	const actTpl = getAllActionTemplates()[0];
	return planAction(actTpl.getTemplateRef(), actor);
}

export function getAllEvents() {
	return eventUtils.getAllEvents();
}

export function triggerEventLoop() {
	wlog('RUNNING UPDATE LOOP');
	mainLogic.runUpdateLoop();
}

export function recomputeLocalState() {
	wlog('--- LOCAL STATE RESET');
	mainLogic.recomputeState();
}
