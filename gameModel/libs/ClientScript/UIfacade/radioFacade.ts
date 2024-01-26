import { ActionType } from "../game/common/actionType";
import { RadioMessage } from "../game/common/radioMessage";
import { getCurrentState } from "../game/mainSimulationLogic";
import { setInterfaceState } from "../gameInterface/interfaceState";
import { SelectedPanel } from "../gameInterface/selectedPanel";
import { getSimTime } from "../UIfacade/timeFacade";

/**
 * All radio messages currently in state
 */
export function getAllRadioMessages(): RadioMessage[] {
	return getCurrentState().getRadioMessages();
}

/**
 * All radio messages with channel information currently in state
 */
export function getAllChanneledRadioMessages(): RadioMessage[] {
	return getCurrentState().getRadioMessages().filter(m => m.channel !== undefined);
}

/**
 * Get radio messages for given Uid
 */
export function getAvailableRadioMessages(id: number, shouldBeRadioMessage: boolean = false): RadioMessage[] {
	return getAllRadioMessages().filter(m => m.recipientId === id && m.isRadioMessage == shouldBeRadioMessage);
}

/**
 * Get radio messages for given channel
 */
export function getAvailableRadioMessagesForChannel(channel: ActionType|undefined): RadioMessage[] {
	return getAllChanneledRadioMessages().filter(m => m.channel === channel);
}

/**
 * Set the channel type to know which is the current
 */
export function setChannelType(channel: ActionType) {
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.channel = channel;
	Context.interfaceState.setState(newState);	
}

/**
 * Update variable containing all radio messages that are read, by channel. Variable is readRadioMessagesByChannel
 */
export function updateReadMessages(channel: ActionType|undefined, amount: number = 1) : Promise<IManagedResponse>|undefined {
	return APIMethods.runScript(`Variable.find(gameModel, "readRadioMessagesByChannel").getInstance(self).setProperty('${channel}','${amount}');`, {});
}

/**
 * Get not read radio messages, by channel
 */
export function getUnreadMessages(channel: ActionType|undefined) : number {
	return getAvailableRadioMessagesForChannel(channel).length - +Variable.find(gameModel,'readRadioMessagesByChannel').getInstance(self).getProperties()[channel!];
}

/**
 * Computing bullet not read messages for radio panel
 */
export function getAllUnreadMessagesCountBullet() : number|undefined {
	const readMsgsProperties = Variable.find(gameModel,'readRadioMessagesByChannel').getInstance(self).getProperties();
	let totalAmount = 0;
	for (let key in readMsgsProperties) {
		if (Context.interfaceState.state.selectedPanel !== SelectedPanel.radios) {
	    	totalAmount += (getAvailableRadioMessagesForChannel(ActionType[key as keyof typeof ActionType]).length - +readMsgsProperties[key]);
		}
	}
	return totalAmount > 0 ? totalAmount : undefined;
}


/**
 * Computing bullet not read messages for radio channel passed as argument
 */
//hack, if ui is already displaying a channel, then we have to update immediately the count of read messages
//but it is refreshed multiple times, so try to limit the amount of concurrent requests to the server with boolean global variable
let updatingReadChannelRadioMessages = false;
export function getUnreadMessagesCountBullet(channel: ActionType|undefined) : number|undefined {
	const unreadMsgs = getUnreadMessages(channel);
	if (Context.interfaceState.state.channel !== channel) {
		return unreadMsgs > 0 ? unreadMsgs : undefined;
	}
	else {
		if(getSimTime() > Context.interfaceState.state.updatedChannelMessagesAt && updatingReadChannelRadioMessages === false){
			setInterfaceState({'updatedChannelMessagesAt': getSimTime()});
			updatingReadChannelRadioMessages = true;
			updateReadMessages(channel, getAvailableRadioMessagesForChannel(channel).length)!
				.then(() => updatingReadChannelRadioMessages = false)
				.catch(() => updatingReadChannelRadioMessages = false);
		}
	}
	return undefined;
}




