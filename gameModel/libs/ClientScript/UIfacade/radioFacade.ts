import { ActionBase, RadioDrivenAction } from '../game/common/actions/actionBase';
import { ActorId } from '../game/common/baseTypes';
import { HospitalProximity } from '../game/common/evacuation/hospitalType';
import { CommType, NotifType, RadioType } from '../game/common/radio/communicationType';
import { getRadioChannels as getInternalRadioChannels } from '../game/common/radio/radioLogic';
import { RadioMessage } from '../game/common/radio/radioMessage';
import {
  getOngoingActions,
  getOngoingActionsForActor,
} from '../game/common/simulationState/actionStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import {
  CasuAction,
  getTypedInterfaceState,
  InterfaceState,
  setInterfaceState,
} from '../gameInterface/interfaceState';
import { canCancelOnGoingAction, formatTime, getSimStartDateTime } from '../gameInterface/main';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { getTranslation } from '../tools/translation';
import { isRadioSchemaActivated } from './flagsFacade';
import { getSimTime } from './timeFacade';

// -------------------------------------------------------------------------------------------------
// radio channels choice
// -------------------------------------------------------------------------------------------------

export function getRadioChannels() {
  return getInternalRadioChannels();
}

export function isChannelHidden(channel: RadioType): boolean {
  if (channel === RadioType.CASU) {
    // never hide the CASU channel
    return false;
  }

  // the others are hidden until the activation of the radio schema
  return !isRadioSchemaActivated();
}

/**
 * Get the current channel
 */
export function getSelectedChannel(): RadioType {
  return getTypedInterfaceState().selectedRadioChannel;
}

/**
 * Set the channel type to know which is the current
 */
export function setSelectedChannel(channel: RadioType) {
  setInterfaceState({ selectedRadioChannel: channel });
}

// -------------------------------------------------------------------------------------------------
// CASU channel
// -------------------------------------------------------------------------------------------------

export function getSelectedCasuAction(): CasuAction {
  return getTypedInterfaceState().selectedCasuAction;
}

export function getSelectedCasuMessageType(): string {
  return getTypedInterfaceState().casuMessage.messageType;
}

export function setSelectedCasuActionAndType(action: CasuAction, messageType: string = '') {
  const newState: InterfaceState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.selectedCasuAction = action;
  newState.casuMessage.messageType = messageType;
  Context.interfaceState.setState(newState);
}

/**
 * If not yet selected, select it.
 * If already selected, unselect it.
 */
// used in page 68
export function toggleSelectedCasuActionAndType(action: CasuAction, messageType?: string): void {
  let newAction: CasuAction = action;
  let newMessageType: string = messageType ?? '';

  // if already selected, unselect it.
  if (getSelectedCasuAction() === newAction && getSelectedCasuMessageType() === newMessageType) {
    newAction = undefined;
    newMessageType = '';
  }

  setSelectedCasuActionAndType(newAction, newMessageType);
}

// used in radioChannelCASU page
export function showActionParamsPanel(action: CasuAction): string {
  if (action === 'CasuMessage') {
    return 'actionMETHANE';
  } else if (action === 'channelsActivation') {
    return 'actionRadioChannelActivation';
  } else if (action === 'freeMessage') {
    return 'radioMessageInput';
  }
  return '';
}

export function getSelectedProximity(): HospitalProximity | undefined {
  return getTypedInterfaceState().getHospitalInfoChosenProximity;
}

export function setSelectedProximity(proximity: HospitalProximity): void {
  setInterfaceState({ getHospitalInfoChosenProximity: proximity });
}

// -------------------------------------------------------------------------------------------------
// message display
// -------------------------------------------------------------------------------------------------

export function getRecipientSenderInfo(message: RadioMessage): string | undefined {
  const sender = getSenderName(message);
  const recipient = getRecipientName(message);

  if (sender != undefined) {
    return getTranslation('mainSim-radio', 'radio-recipient-from-sender', true, [
      recipient ?? '',
      sender,
    ]);
  } else {
    return recipient;
  }
}

/**
 * The sender name is the first not null between
 * - sender actor id (we return its short name)
 * - free text sender name
 */
function getSenderName(message: RadioMessage): string | undefined {
  const actorSender = getCurrentState().getActorById(message.senderId);
  if (actorSender) {
    return actorSender.ShortName;
  }

  return message.senderName ?? undefined;
}

/**
 * The recipient name is the recipient actor's short name
 */
function getRecipientName(message: RadioMessage): string | undefined {
  return getCurrentState().getActorById(message.recipientId)?.ShortName;
}

/**
 * Get notification time in HH:MM format
 *
 * @params notificationTime delta in seconds
 * @returns string Notification time adjusted to sim time
 */
export function getNotificationTime(notificationTime: number): string {
  const startTime = getSimStartDateTime();
  startTime.setTime(notificationTime * 1000 + startTime.getTime());

  return formatTime(startTime);
}

// -------------------------------------------------------------------------------------------------
// and so on
// -------------------------------------------------------------------------------------------------

/**
 * All radio messages currently in state
 */
export function getAllRadioMessages(): RadioMessage[] {
  const currentTime = getSimTime();
  const messagesLifeLength = Variable.find(gameModel, 'messagesLifeLength').getValue(self);
  const messagesLifeLengthInSeconds = messagesLifeLength * 60;

  if (messagesLifeLength <= 0) {
    return getCurrentState().getRadioMessages();
  } else {
    return getCurrentState()
      .getRadioMessages()
      .filter(m => currentTime - m.timeStamp <= messagesLifeLengthInSeconds);
  }
}

/**
 * Get notifications for given recipientId
 */
export function getNotifications(actorId: ActorId): RadioMessage[] {
  return getAllRadioMessages().filter(m => m.recipientId === actorId && !m.isRadioMessage);
}

/**
 * Get radio messages for given channel
 */
export function getAvailableRadioMessagesForChannel(channel: RadioType): RadioMessage[] {
  return getAllRadioMessages().filter(m => m.channel === channel);
}

/**
 * Is the given messageUid the most recent for given channel
 */
export function isLastRadioMessageForChannel(channel: RadioType, messageUid: number): boolean {
  return getAvailableRadioMessagesForChannel(channel).slice(-1)[0]?.uid === messageUid;
}

/**
 * Update variable containing all radio messages that are read, by channel. Variable is readRadioMessagesByChannel
 */
export async function updateReadMessages(
  channel: CommType,
  amount: number = 1
): Promise<IManagedResponse> {
  const key = channel === NotifType.NOTIF ? getActorNotificationChannelName() : String(channel);
  return await APIMethods.runScript(
    `Variable.find(gameModel, "readRadioMessagesByChannel").getInstance(self).setProperty('${key}','${amount}');`,
    {}
  );
}

/**
 * In the case of notifications, each actor has his own personal 'channel'
 */
function getActorNotificationChannelName(actorId: number | undefined = undefined): string {
  return NotifType.NOTIF + (actorId ? actorId : Context.interfaceState.state.currentActorUid);
}

/**
 * Get unread radio messages, by channel
 */
function getUnreadMessagesCount(channel: RadioType): number {
  const readCount = +(
    Variable.find(gameModel, 'readRadioMessagesByChannel').getInstance(self).getProperties()[
      channel
    ] || '0'
  );
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
        [RadioType.CASU, RadioType.ACTORS, RadioType.RESOURCES, RadioType.EVASAN].includes(
          k as RadioType
        )
      )
      .reduce((prev, [k, v]) => {
        return prev + getAvailableRadioMessagesForChannel(String(k) as RadioType).length - +v;
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
export function getUnreadMessagesCountBullet(channel: RadioType): number | undefined {
  const unreadMsgs = getUnreadMessagesCount(channel);
  if (getSelectedChannel() !== channel) {
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
  const unreadCount =
    getNotifications(Context.interfaceState.state.currentActorUid).length - readCount;
  return Math.max(0, unreadCount);
}

export function getOngoingRadioMessagesForActorOnChannel(
  actorUid: number,
  channel: RadioType
): RadioDrivenAction[] {
  const rm: ActionBase[] = getOngoingActionsForActor(getCurrentState(), actorUid).filter(
    a => a instanceof RadioDrivenAction && (a as RadioDrivenAction).getChannel() === channel
  );
  return rm as RadioDrivenAction[];
}

export function getOngoingRadioMessagesOnChannel(channel: RadioType): RadioDrivenAction[] {
  const rm: ActionBase[] = getOngoingActions(getCurrentState()).filter(
    a => a instanceof RadioDrivenAction && (a as RadioDrivenAction).getChannel() === channel
  );
  return rm as RadioDrivenAction[];
}

export function getOngoingRadioMessagesOnChannelAsRadioMessages(
  channel: RadioType
): RadioMessage[] {
  return getOngoingRadioMessagesOnChannel(channel).map(rm => ({
    senderId: rm.getSenderId(),
    senderName: undefined,
    recipientId: rm.getRecipientId(),
    timeStamp: getCurrentState().getSimTime(),
    message: rm.getMessage(),
    uid: rm.getEventId(),
    channel: rm.getChannel(),
    isRadioMessage: true,
    pending: true,
  }));
}

export function isChannelBusy(channel: RadioType): boolean {
  if (
    getOngoingRadioMessagesForActorOnChannel(Context.interfaceState.state.currentActorUid, channel)
      .length > 0
  ) {
    return !canCancelOnGoingAction();
  }
  return false;
}
