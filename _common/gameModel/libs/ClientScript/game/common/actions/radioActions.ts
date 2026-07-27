import { ActionTemplateUid, ActorId, GlobalEventId, SimDuration, SimTime, TranslationKey } from '../baseTypes';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { RadioType } from '../radio/communicationType';
import { StartEndAction } from './actionBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getLocalEventManager } from '../localEvents/localEventManager';
import {
  AddMessageLocalEvent,
  AddRadioMessageLocalEvent,
  PretriageReportResponseLocalEvent,
} from '../localEvents/localEventRadio';
import { CasuMessagePayload, HospitalRequestPayload, MethaneMessagePayload } from '../events/casuMessageEvent';
import { entries } from '../../../tools/helper';
import { HospitalProximity } from '../evacuation/hospitalType';
import { getTranslation } from '../../../tools/translation';
import * as RadioLogic from '../radio/radioLogic';
import { getProximityTranslation } from '../radio/radioLogic';
import { HospitalRequestUpdateLocalEvent } from '../localEvents/localEventHospital';
import {
  AutoSendACSMCSLocalEvent,
  ResourceRequestResolutionLocalEvent,
} from '../localEvents/localEventResourceArrival';
import { ACSMCSAutoRequestDelay, PretriageReportResponseDelay } from '../constants';
import * as ActorLogic from '../actors/actorLogic';
import { getCasuActorId } from '../actors/actorLogic';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { RadioMessagePayload } from '../events/radioMessageEvent';

export abstract class RadioDrivenAction extends StartEndAction {
  protected constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState
    );
  }

  public getEventId(): GlobalEventId {
    return this.eventId;
  }

  public abstract getChannel(): RadioType;

  public abstract getMessage(): string;

  public abstract getSenderId(): ActorId | undefined;

  public abstract getRecipientId(): ActorId | undefined;
}

/**
 * The result of the action is to display a message in a radio channel or as a notification
 */
export class DisplayMessageAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    readonly messageKey: TranslationKey,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState?: SimFlag[],
    readonly channel?: RadioType
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event DisplayMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event DisplayMessageAction');

    getLocalEventManager().queueLocalEvent(
      new AddMessageLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        recipientId: this.ownerId,
        message: this.messageKey,
        channel: this.channel,
      })
    );
  }
}

export class CasuMessageAction extends RadioDrivenAction {
  hospitalRequestPayload: HospitalRequestPayload | undefined;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey | ITranslatableContent,
    eventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    private casuMessagePayload: CasuMessagePayload
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, ownerId, templateUid);
    if (this.casuMessagePayload.messageType === 'R') {
      this.hospitalRequestPayload = this.casuMessagePayload;
    }
  }

  private computeCasuMessage(message: MethaneMessagePayload): string {
    let casuMessage = '';
    if (message.major) {
      casuMessage += `M - ${message.major} \n`;
    }
    if (message.exact) {
      casuMessage += `E - ${message.exact} \n`;
    }
    if (message.incidentType) {
      casuMessage += `T - ${message.incidentType} \n`;
    }
    if (message.hazards) {
      casuMessage += `H - ${message.hazards} \n`;
    }
    if (message.access) {
      casuMessage += `A - ${message.access} \n`;
    }
    if (message.victims) {
      casuMessage += `N - ${message.victims} \n`;
    }
    if (message.resourceRequest) {
      let requestResource = 'E - ';
      entries(message.resourceRequest)
        .filter(([_, a]) => a ?? 0 > 0)
        .forEach(([typeId, requestedAmount]) => {
          requestResource += `${typeId}: ${requestedAmount} \n`;
        });
      casuMessage += requestResource;
    }

    return casuMessage;
  }

  // TODO Add translation handling and better perhaps better formatting
  private formatHospitalRequest(message: HospitalRequestPayload): string {
    const proximity = HospitalProximity[message.proximity];
    return (
      getTranslation('mainSim-actions-tasks', 'get-hospital-information-desc') +
      (proximity ? ': ' + getProximityTranslation(proximity!) : '')
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    // nothing to do
    this.logger.info('start event CasuMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event CasuMessageAction');
    const now = state.getSimTime();

    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: now,
        senderId: this.getSenderId(),
        recipientId: this.getRecipientId(),
        message: this.getMessage(),
        channel: this.getChannel(),
        omitTranslation: true,
      })
    );
    if (this.casuMessagePayload.messageType === 'R') {
      getLocalEventManager().queueLocalEvent(
        new HospitalRequestUpdateLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: now,
          senderId: this.ownerId,
          hospitalRequestPayload: this.casuMessagePayload,
        })
      );
    } else if (this.casuMessagePayload.resourceRequest) {
      // Handle METHANE resource request
      const dispatchEvent = new ResourceRequestResolutionLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: now,
        actorUid: this.ownerId,
        request: this.casuMessagePayload,
      });
      getLocalEventManager().queueLocalEvent(dispatchEvent);

      // Auto request ACS MCS if not requested within 5 mins after methane and ACS/MCS is not on site already
      // enough to test for presence, in case of multiple requests, only the first one is executed
      if (!state.getAllActors().some(actor => actor.Role === 'ACS' || actor.Role === 'MCS')) {
        // Scheduling automatic sending of ACS/MCS
        this.logger.info(
          'Auto scheduling request for ACS-MCS, executed in ' + ACSMCSAutoRequestDelay + ' secs'
        );
        getLocalEventManager().queueLocalEvent(
          new AutoSendACSMCSLocalEvent({
            parentEventId: this.eventId,
            source: { type: 'action', id: this.Uid },
            simTimeStamp: now + ACSMCSAutoRequestDelay,
          })
        );
      }
    }
  }

  public override getTitle(): string {
    return getTranslation(
      'mainSim-actions-tasks',
      this.actionNameKey + '-' + this.casuMessagePayload.messageType
    );
  }

  public getChannel(): RadioType {
    return RadioType.CASU;
  }

  public getMessage(): string {
    if (this.casuMessagePayload.messageType === 'R') {
      return this.formatHospitalRequest(this.casuMessagePayload);
    } else {
      return this.computeCasuMessage(this.casuMessagePayload);
    }
  }

  public getSenderId(): ActorId | undefined {
    return this.ownerId;
  }

  public getRecipientId(): ActorId | undefined {
    return getCasuActorId();
  }
}

export class ActivateRadioSchemaAction extends RadioDrivenAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    readonly requestMessage: TranslationKey,
    readonly authorizedReplyMessage: TranslationKey,
    readonly unauthorizedReplyMessage: TranslationKey,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    readonly channel: RadioType,
    provideFlagsToState?: SimFlag[]
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event ActivateRadioSchemaAction');
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event ActivateRadioSchemaAction');

    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        senderId: this.getSenderId(),
        recipientId: this.getRecipientId(),
        message: this.getMessage(),
        channel: this.getChannel(),
        omitTranslation: true,
      })
    );

    const suitableActors = ActorLogic.getHighestAuthorityActorOnSite(state);
    if (suitableActors.includes(this.ownerId)) {
      state.getInternalStateObject().flags[SimFlag.RADIO_SCHEMA_ACTIVATED] = true;

      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderId: getCasuActorId(),
          recipientId: this.ownerId,
          message: this.authorizedReplyMessage,
          channel: this.channel,
        })
      );
    } else {
      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderId: getCasuActorId(),
          recipientId: this.ownerId,
          message: this.unauthorizedReplyMessage,
          channel: this.channel,
        })
      );
    }
  }

  public getChannel(): RadioType {
    return this.channel;
  }

  public getMessage(): string {
    return getTranslation('mainSim-actions-tasks', this.requestMessage);
  }

  public getSenderId(): ActorId | undefined {
    return this.ownerId;
  }

  public getRecipientId(): ActorId | undefined {
    return getCasuActorId();
  }
}

/**
 * The result of the action is to request state of pretriage in a specific location
 */
export class RequestPretriageReportAction extends RadioDrivenAction {
  private channel: RadioType = RadioType.RESOURCES;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    private feedbackWhenStarted: TranslationKey,
    private feedbackWhenReport: TranslationKey,
    actionNameKey: TranslationKey | ITranslatableContent,
    eventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    private pretriageLocation: LOCATION_ENUM,
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, ownerId, templateUid);
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event RequestPretriageReportAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        senderId: this.getSenderId(),
        recipientId: this.getRecipientId(),
        message: this.getMessage(),
        channel: this.getChannel(),
        omitTranslation: true,
      }),
    );

    getLocalEventManager().queueLocalEvent(
      new PretriageReportResponseLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime() + PretriageReportResponseDelay,
        senderName: RadioLogic.getResourceAsSenderName(),
        recipient: this.ownerId,
        pretriageLocation: this.pretriageLocation,
        feedbackWhenReport: this.feedbackWhenReport,
      }),
    );
  }

  private formatStartMessage(): string {
    return getTranslation('mainSim-actions-tasks', this.feedbackWhenStarted, true, [
      getTranslation('mainSim-locations', 'location-' + this.pretriageLocation),
    ]);
  }

  public getChannel(): RadioType {
    return this.channel;
  }

  public getMessage(): string {
    return this.formatStartMessage();
  }

  public getSenderId(): ActorId | undefined {
    return this.ownerId;
  }

  public getRecipientId(): ActorId | undefined {
    return undefined;
  }
}

/**
 * The result of the action is to spread a handwritten message from a player through a radio channel
 */
export class SendRadioMessageAction extends RadioDrivenAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey | ITranslatableContent,
    eventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    private radioChannel: RadioType,
    private radioMessagePayload: RadioMessagePayload,
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, ownerId, templateUid);
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event SendRadioMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event SendRadioMessageAction');
    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        senderId: this.getSenderId(),
        recipientId: this.getRecipientId(),
        message: this.getMessage(),
        channel: this.getChannel(),
        omitTranslation: true,
      }),
    );
  }

  public getRadioMessagePayload(): RadioMessagePayload {
    return this.radioMessagePayload;
  }

  public getChannel(): RadioType {
    return this.radioChannel;
  }

  public getMessage(): string {
    return this.radioMessagePayload.message;
  }

  public getSenderId(): ActorId | undefined {
    return this.radioMessagePayload.actorId;
  }

  public getRecipientId(): ActorId | undefined {
    return undefined;
  }
}