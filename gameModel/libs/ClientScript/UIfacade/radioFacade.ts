import { AddRadioMessageLocalEvent } from "../game/common/localEvents/localEventBase";
import { RadioMessage } from "../game/common/radioMessage";
import { getCurrentState, getRadioAction } from "../game/mainSimulationLogic";
import { fetchRadioMessageRequestValues } from "../gameInterface/actionsButtonLogic";
import { planAction } from "../UIfacade/actionFacade";


/**
 * All radio messages currently in state
 */
export function getAllRadioMessages(): RadioMessage[] {
	return getCurrentState().getRadioMessages();
}

/**
 * Get radio messages for given Uid
 */
export function getAvailableRadioMessages(id: number, shouldBeRadioMessage: boolean = false): RadioMessage[] {
	return getAllRadioMessages().filter(m => m.recipientId === id && m.isRadioMessage == shouldBeRadioMessage);
}

export async function sendRadioMessage(channel: string) {
	const actTpls = getRadioAction();
	const actor = Context.interfaceState.state.currentActorUid;
	const actTpl = actTpls ? actTpls[0] : undefined;
	const params = fetchRadioMessageRequestValues(channel);
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.channelText.d418 = '';
	newState.channelText.d912 = '';
	Context.interfaceState.setState(newState);
	return await planAction(actTpl!.getTemplateRef(), actor!, params);
}