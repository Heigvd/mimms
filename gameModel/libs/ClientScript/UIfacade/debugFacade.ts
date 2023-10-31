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

export async function planMethaneAction() {
	wlog('PLAN METHANE ACTION');
	const actor = getCurrentState().getInternalStateObject().actors[0]?.Uid;
	const actTpl = getActionTemplate(Context.interfaceState.state.currentActionUid);
	const methaneInputInformation = Variable.find(gameModel, 'methaneInput').getValue(self)
	wlog(methaneInputInformation);
	// TODO use a local state
	APIMethods.runScript(
		'Variable.find(gameModel, "modalPageNumber").setValue(self, 48);', {}
    );
	const params = fetchMethaneRequestValues();
	return planAction(actTpl!.getTemplateRef(), actor!, params);

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
