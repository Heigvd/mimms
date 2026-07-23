import { ActorId, GlobalEventId, SimTime, TranslationKey } from '../baseTypes';
import { RadioType } from '../radio/communicationType';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getTranslation } from '../../../tools/translation';
import { LocalEventBase, SourceType } from './localEventBase';

export class AddMessageLocalEvent extends LocalEventBase {
  private static RadioIdProvider = 1;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId?: ActorId | undefined;
      readonly message: TranslationKey;
      readonly channel?: RadioType | undefined;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    },
  ) {
    super({ ...props, type: 'AddMessageLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const msg = this.props.omitTranslation
      ? this.props.message
      : getTranslation(
        'mainSim-actions-tasks',
        this.props.message,
        undefined,
        this.props.messageValues,
      );

    state.getInternalStateObject().radioMessages.push({
      senderId: this.props.senderId,
      senderName: this.props.senderName,
      recipientId: this.props.recipientId,
      timeStamp: this.props.simTimeStamp,
      message: msg,
      uid: AddMessageLocalEvent.RadioIdProvider++,
      isRadioMessage: this.props.channel != undefined,
      channel: this.props.channel,
      pending: false,
    });
  }
}

export class AddRadioMessageLocalEvent extends AddMessageLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId?: ActorId | undefined;
      readonly message: TranslationKey;
      readonly channel: RadioType;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    },
  ) {
    super({ ...extensionProps });
  }
}

export class AddNotificationLocalEvent extends AddMessageLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderId?: ActorId | undefined;
      readonly senderName?: string | undefined; // in case there is no sending actor, free text sender name
      readonly recipientId: ActorId;
      readonly message: TranslationKey;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    },
  ) {
    super({ ...extensionProps });
  }
}