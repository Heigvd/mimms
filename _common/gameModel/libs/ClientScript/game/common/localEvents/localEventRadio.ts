import { ActorId, GlobalEventId, SimTime, TranslationKey } from '../baseTypes';
import { RadioType } from '../radio/communicationType';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getTranslation } from '../../../tools/translation';
import { LocalEventBase, SourceType } from './localEventBase';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { TaskStatus, TaskType } from '../tasks/taskBase';
import { getTaskByTypeAndLocation, getTaskCurrentStatus } from '../simulationState/taskStateAccess';
import { getLocalEventManager } from './localEventManager';
import { formatStandardPretriageReport } from '../patients/pretriageUtils';

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
      readonly message: TranslationKey | ITranslatableContent;
      readonly channel?: RadioType | undefined;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
  ) {
    super({ ...props, type: 'AddMessageLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const raw = this.props.message;
    let message: ITranslatableContent;
    if (typeof raw === 'string') {
      const text = this.props.omitTranslation
        ? raw
        : getTranslation('mainSim-actions-tasks', raw, undefined, this.props.messageValues);

      message = I18n.createTranslatableContent(text);
    } else {
      message = raw;
    }

    state.getInternalStateObject().radioMessages.push({
      senderId: this.props.senderId,
      senderName: this.props.senderName,
      recipientId: this.props.recipientId,
      timeStamp: this.props.simTimeStamp,
      message,
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
      readonly message: TranslationKey | ITranslatableContent;
      readonly channel: RadioType;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
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
      readonly message: TranslationKey | ITranslatableContent;
      readonly omitTranslation?: boolean;
      readonly messageValues?: (string | number)[];
    }
  ) {
    super({ ...extensionProps });
  }
}

/*
Pretriage Report calculations and radio response
*/
export class PretriageReportResponseLocalEvent extends LocalEventBase {
  private channel: RadioType = RadioType.RESOURCES;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderName: string;
      readonly recipient: number;
      readonly pretriageLocation: LOCATION_ENUM;
      readonly feedbackWhenReport: TranslationKey;
    }
  ) {
    super({ ...props, type: 'PretriageReportResponseLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const taskStatus: TaskStatus = getTaskCurrentStatus(
      state,
      getTaskByTypeAndLocation(state, TaskType.Pretriage, this.props.pretriageLocation).Uid
    );

    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.simTimeStamp,
        senderName: this.props.senderName,
        recipientId: this.props.recipient,
        message:
          taskStatus === 'Uninitialized'
            ? getTranslation('mainSim-actions-tasks', 'pretriage-task-notStarted', true, [
                getTranslation('mainSim-locations', 'location-' + this.props.pretriageLocation),
              ])
            : formatStandardPretriageReport(
                state,
                this.props.pretriageLocation,
                this.props.feedbackWhenReport,
                true
              ),
        channel: this.channel,
        omitTranslation: true,
      })
    );
  }
}
