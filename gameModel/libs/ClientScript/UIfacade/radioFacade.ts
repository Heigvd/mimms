import { ActionType } from "../game/common/actionType";
import { RadioMessage } from "../game/common/radioMessage";
import { getCurrentState } from "../game/mainSimulationLogic";


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

/**
 * Set the channel type to know which is the current
 */
export function setChannelType(channel: ActionType) {
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.channel = channel;
	Context.interfaceState.setState(newState);
}