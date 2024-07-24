import { ActionBase, RadioDrivenAction } from '../game/common/actions/actionBase';
import { ActionType } from '../game/common/actionType';
import { RadioMessage } from '../game/common/radioMessage';
import {
  getOngoingActions,
  getOngoingActionsForActor,
} from '../game/common/simulationState/actionStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';
import { canCancelOnGoingAction, canPlanAction, isPlannedAction } from '../gameInterface/main';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { getAvailableActions } from './actionFacade';
import { isRadioSchemaActivated } from './flagsFacade';
import { getSimTime } from './timeFacade';

/**
 * All radio messages currently in state
 */
export function getAllRadioMessages(): RadioMessage[] {
  return getCurrentState().getRadioMessages();
}

export function isChannelHidden(channel: ActionType): boolean {
  if (channel === ActionType.CASU_RADIO) {
    // never hide the CASU channel
    return false;
  }

  // the others are hidden until the activation of the radio schema
  return !isRadioSchemaActivated();
}

/**
 * Get notifications for given recipientId
 */
export function getNotifications(id: number): RadioMessage[] {
  return getAllRadioMessages().filter(m => m.recipientId === id && !m.isRadioMessage);
}

/**
 * Get radio messages for given channel
 */
export function getAvailableRadioMessagesForChannel(channel: ActionType): RadioMessage[] {
  return getAllRadioMessages().filter(m => m.channel === channel);
}

/**
 * Is the given messageUid the most recent for given channel
 */
export function isLastRadioMessageForChannel(channel: ActionType, messageUid: number): boolean {
  return getAvailableRadioMessagesForChannel(channel).slice(-1)[0]?.uid === messageUid;
}

/**
 * Set the channel type to know which is the current
 */
export function setChannelType(channel: ActionType) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.channel = channel;
  Context.interfaceState.setState(newState);
}

/**
 * Update variable containing all radio messages that are read, by channel. Variable is readRadioMessagesByChannel
 */
export async function updateReadMessages(
  channel: ActionType,
  amount: number = 1
): Promise<IManagedResponse> {
  const key = channel === ActionType.ACTION ? getActorNotificationChannelName() : String(channel);
  return await APIMethods.runScript(
    `Variable.find(gameModel, "readRadioMessagesByChannel").getInstance(self).setProperty('${key}','${amount}');`,
    {}
  );
}

/**
 * In the case of notifications, each actor has his own personal 'channel'
 */
function getActorNotificationChannelName(actorId: number | undefined = undefined): string {
  return (
    ActionType.ACTION + '-' + (actorId ? actorId : Context.interfaceState.state.currentActorUid)
  );
}

/**
 * Get unread radio messages, by channel
 */
function getUnreadMessagesCount(channel: ActionType): number {
  const readCount =
    +(Variable.find(gameModel, 'readRadioMessagesByChannel').getInstance(self).getProperties()[
      channel
    ] || '0');
  return getAvailableRadioMessagesForChannel(channel).length - readCount;
}

/**
 * Computing bullet not read messages for radio panel
 */
export function getAllUnreadMessagesCountBullet(): number | undefined {
  const readMsgsProperties = Variable.find(gameModel, 'readRadioMessagesByChannel')
    .getInstance(self)
    .getProperties();
  let totalAmount = 0;

  if (Context.interfaceState.state.selectedPanel !== SelectedPanel.radios) {
    totalAmount = Object.entries(readMsgsProperties)
      .filter(([k, _]) =>
        [
          ActionType.ACTORS_RADIO,
          ActionType.CASU_RADIO,
          ActionType.EVASAN_RADIO,
          ActionType.RESOURCES_RADIO,
        ].includes(k as ActionType)
      )
      .reduce((prev, [k, v]) => {
        return prev + getAvailableRadioMessagesForChannel(String(k) as ActionType).length - +v;
      }, 0);
  }

  return totalAmount > 0 ? totalAmount : undefined;
}

/**
 * Computing unread messages bullet for a given radio channel
 */
//hack, if ui is already displaying a channel, then we have to update immediately the count of read messages
//but it is refreshed multiple times, so try to limit the amount of concurrent requests to the server with boolean global variable
let updatingReadChannelRadioMessages = false;
export function getUnreadMessagesCountBullet(channel: ActionType): number | undefined {
  const unreadMsgs = getUnreadMessagesCount(channel);
  if (Context.interfaceState.state.channel !== channel) {
    return unreadMsgs > 0 ? unreadMsgs : undefined;
  } else {
    if (
      getSimTime() > Context.interfaceState.state.updatedChannelMessagesAt &&
      updatingReadChannelRadioMessages === false
    ) {
      setInterfaceState({ updatedChannelMessagesAt: getSimTime() });
      updatingReadChannelRadioMessages = true;
      updateReadMessages(channel, getAvailableRadioMessagesForChannel(channel).length)!
        .then(() => (updatingReadChannelRadioMessages = false))
        .catch(() => (updatingReadChannelRadioMessages = false));
    }
  }
  return undefined;
}

export function getUnreadNotificationsCount(): number {
  const readMsgsProperties = Variable.find(gameModel, 'readRadioMessagesByChannel')
    .getInstance(self)
    .getProperties();
  const actorChannelName = getActorNotificationChannelName(
    Context.interfaceState.state.currentActorUid
  );
  const readCount = +(readMsgsProperties[actorChannelName] || '0');
  return getNotifications(Context.interfaceState.state.currentActorUid).length - readCount;
}

export function getOngoingRadioMessagesForActorOnChannel(
  actorUid: number,
  channel: ActionType
): RadioDrivenAction[] {
  const rm: ActionBase[] = getOngoingActionsForActor(getCurrentState(), actorUid).filter(
    a => a instanceof RadioDrivenAction && (a as RadioDrivenAction).getChannel() === channel
  );
  return rm as RadioDrivenAction[];
}

export function getOngoingRadioMessagesOnChannel(channel: ActionType): RadioDrivenAction[] {
  const rm: ActionBase[] = getOngoingActions(getCurrentState()).filter(
    a => a instanceof RadioDrivenAction && (a as RadioDrivenAction).getChannel() === channel
  );
  return rm as RadioDrivenAction[];
}

export function getOngoingRadioMessagesOnChannelAsRadioMessages(
  channel: ActionType
): RadioMessage[] {
  return getOngoingRadioMessagesOnChannel(channel).map(rm => ({
    recipientId: rm.getRecipient(),
    timeStamp: getCurrentState().getSimTime(),
    emitter: rm.getEmitter(),
    message: rm.getMessage(),
    uid: rm.getEventId(),
    channel: rm.getChannel(),
    isRadioMessage: true,
    pending: true,
  }));
}

export function isChannelBusy(channel: ActionType): boolean {
  if (
    getOngoingRadioMessagesForActorOnChannel(Context.interfaceState.state.currentActorUid, channel)
      .length > 0
  ) {
    return !canCancelOnGoingAction();
  }
  return false;
}

export function isChannelNewActivityDisabled(
  currentActorUid: number,
  channel: ActionType
): boolean {
  if (isChannelBusy(channel)) return true;
  if (canPlanAction()) return false;
  const action = getAvailableActions(currentActorUid, channel);
  const actionId = action[0]?.Uid;

  return actionId ? !isPlannedAction(actionId) : true;
}
