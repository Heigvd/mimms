import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { getActionTemplate, planAction } from '../UIfacade/actionFacade';
import { buildingsRef } from '../gameMap/main';

export function getCurrentState() {
	return mainLogic.getCurrentState();
}

export function getAllActionTemplates() {
	return mainLogic.debugGetAllActionTemplates();
}

export async function planMethaneAction() {
	const actor = getCurrentState().getInternalStateObject().actors[0]?.Uid;
	const actTpl = getActionTemplate(Context.interfaceState.state.currentActionUid);
	const methaneInputInformation = Variable.find(gameModel, 'methaneInput').getValue(self)
	wlog(methaneInputInformation);
	APIMethods.runScript(
		'Variable.find(gameModel, "modalPageNumber").setValue(self, 48);', {}
    );
	return planAction(actTpl!.getTemplateRef(), actor!)

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
