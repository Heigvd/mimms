import { ActionTemplateUid, ActorId, SimDuration, SimTime, TranslationKey } from '../../baseTypes';
import { RadioType } from '../../radio/communicationType';
import { ActionType } from '../../actionType';
import { Actor, InterventionRole } from '../../actors/actor';
import { FullEvent } from '../../events/eventUtils';
import { RadioMessageActionEvent, RadioMessagePayload } from '../../events/radioMessageEvent';
import {
  RequestPretriageReportAction,
  SendRadioMessageAction,
} from '../actionBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { getOngoingActions } from '../../simulationState/actionStateAccess';
import { SimFlag, StartEndTemplate } from './actionTemplateBase';
import { RequestPretriageReportEvent, StandardActionEvent } from '../../events/eventTypes';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { CasuMessageActionEvent, CasuMessagePayload } from '../../events/casuMessageEvent';
import { ActivateRadioSchemaAction, CasuMessageAction, DisplayMessageAction, RadioDrivenAction } from '../radioActions';

/**
 * The goal of the action is to broadcast a written message from a player on a radio channel
 */
export class SendRadioMessageTemplate extends StartEndTemplate {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly radioChannel: RadioType,
    repeats: number = 0,
    category: ActionType,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
      category,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<RadioMessageActionEvent>
  ): SendRadioMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new SendRadioMessageAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      this.radioChannel,
      payload.radioMessagePayload
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: RadioMessagePayload
  ): RadioMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      radioMessagePayload: params,
    };
  }

  public override getTitle(): string {
    return 'SendRadioMessageTemplateTitle';
  }

  public override getDescription(): string {
    return 'SendRadioMessageTemplateDescription';
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === this.radioChannel &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

/**
 * The result of the action is to display a message in a radio channel or as a notification
 */
export class DisplayMessageActionTemplate extends StartEndTemplate<DisplayMessageAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly message: TranslationKey,
    repeats: number = 1,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    readonly channel?: RadioType | undefined
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): DisplayMessageAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new DisplayMessageAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.message,
      ownerId,
      this.uid,
      this.raisedFlags,
      this.channel
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }
}

export class CasuMessageTemplate extends StartEndTemplate<
  CasuMessageAction,
  CasuMessageActionEvent,
  CasuMessagePayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    repeats: number = 0,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
      ActionType.CASU_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<CasuMessageActionEvent>): CasuMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new CasuMessageAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.casuMessagePayload
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: CasuMessagePayload
  ): CasuMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      casuMessagePayload: params,
    };
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === RadioType.CASU &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

export type PretriageReportActionPayload = {
  pretriageLocation: LOCATION_ENUM;
};

export class PretriageReportTemplate extends StartEndTemplate<
  RequestPretriageReportAction,
  RequestPretriageReportEvent,
  PretriageReportActionPayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    private feedbackWhenStarted: TranslationKey,
    private feedbackWhenReport: TranslationKey,
    repeats: number = 0,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
      ActionType.RESOURCES_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<RequestPretriageReportEvent>
  ): RequestPretriageReportAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new RequestPretriageReportAction(
      payload.triggerTime,
      this.duration,
      this.feedbackWhenStarted,
      this.feedbackWhenReport,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.pretriageLocation
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: PretriageReportActionPayload
  ): RequestPretriageReportEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      pretriageLocation: params.pretriageLocation,
    };
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return (
      getOngoingActions(state).filter(
        a =>
          a instanceof RadioDrivenAction &&
          (a as RadioDrivenAction).getChannel() === RadioType.RESOURCES &&
          (a as RadioDrivenAction).ownerId === actorUid
      ).length === 0
    );
  }
}

export class ActivateRadioSchemaActionTemplate extends StartEndTemplate<ActivateRadioSchemaAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly requestMessage: TranslationKey,
    readonly authorizedReplyMessage: TranslationKey,
    readonly unauthorizedReplyMessage: TranslationKey,
    readonly channel: RadioType,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      0, // repeats is forced to 0. Because the action can be refused and must be run again
      ActionType.CASU_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(
    event: FullEvent<StandardActionEvent>
  ): ActivateRadioSchemaAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new ActivateRadioSchemaAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.requestMessage,
      this.authorizedReplyMessage,
      this.unauthorizedReplyMessage,
      ownerId,
      this.uid,
      this.channel,
      this.raisedFlags
    );
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
    };
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>
  ): boolean {
    return !state.hasFlag(SimFlag.RADIO_SCHEMA_ACTIVATED);
  }
}
