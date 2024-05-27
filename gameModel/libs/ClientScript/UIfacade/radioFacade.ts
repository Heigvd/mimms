import { ActionType } from '../game/common/actionType';
import { RadioMessage } from '../game/common/radioMessage';
import { getCurrentState } from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { getSimTime } from '../UIfacade/timeFacade';

/**
 * All radio messages currently in state
 */
export function getAllRadioMessages(): RadioMessage[] {
  return getCurrentState().getRadioMessages();
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
  return (
    getAvailableRadioMessagesForChannel(channel).length -
    +Variable.find(gameModel, 'readRadioMessagesByChannel').getInstance(self).getProperties()[
      channel
    ]
  );
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
  return (
    getNotifications(Context.interfaceState.state.currentActorUid).length -
    (+readMsgsProperties[actorChannelName] || 0)
  );
}
