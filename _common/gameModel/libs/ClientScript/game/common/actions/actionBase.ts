// EVALUATION_PRIORITY 10

import { entries } from '../../../tools/helper';
import { actionLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { getContextUidGenerator } from '../../executionContext/gameExecutionContextController';
import { getCachedHospitalById } from '../../loaders/hospitalLoader';
import {
  ActionId,
  ActionTemplateUid,
  ActorId,
  GlobalEventId,
  HospitalId,
  PatientId,
  PatientUnitId,
  ResourceId,
  SimDuration,
  SimTime,
  TaskId,
  TranslationKey,
} from '../baseTypes';
import { PretriageReportResponseDelay } from '../constants';
import * as EvacuationLogic from '../evacuation/evacuationLogic';
import { computeTravelTime } from '../evacuation/evacuationLogic';
import { EvacuationSquadType, getSquadDef } from '../evacuation/evacuationSquadDef';
import { EvacuationActionPayload } from '../events/evacuationMessageEvent';
import { RadioMessagePayload } from '../events/radioMessageEvent';
import { Effect, evaluateEffectImpacts } from '../impacts/effect';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { getResourceAsSenderName } from '../radio/radioLogic';
import { Resource } from '../resources/resource';
import { doesOrderRespectHierarchy } from '../resources/resourceLogic';
import { CommMedia } from '../resources/resourceReachLogic';
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ChoiceActivable, getChoiceActivable } from '../simulationState/activableState';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskLogic from '../tasks/taskLogic';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from './choiceDescriptor/choiceDescriptor';
import { AddNotificationLocalEvent, AddRadioMessageLocalEvent } from '../localEvents/localEventRadio';
import { PretriageReportResponseLocalEvent } from '../localEvents/localEventHospital';
import {
  AssignResourcesToTaskLocalEvent,
  AssignResourcesToWaitingTaskLocalEvent,
  MoveResourcesLocalEvent,
  ReserveResourcesLocalEvent,
  UnReserveResourcesLocalEvent,
} from '../localEvents/localEventResources';
import { RadioDrivenAction } from './radioActions';

export type ActionStatus = 'Uninitialized' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined;

const ACTION_SEED_ID: ActionId = 3000;

/**
 * Instantiated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase {
  protected static slogger = Helpers.getLogger('actions-logger');

  protected readonly logger = ActionBase.slogger;

  public readonly Uid: ActionId;

  protected status: ActionStatus;

  protected constructor(
    readonly startTime: SimTime,
    protected readonly eventId: GlobalEventId,
    public readonly ownerId: ActorId,
    protected readonly templateId: ActionTemplateUid
  ) {
    this.Uid = getContextUidGenerator().getNext('ActionBase', ACTION_SEED_ID);
    this.status = 'Uninitialized';
  }

  /**
   * Will update the given status
   * @param state the current state that will be updated
   */
  public abstract update(state: MainSimulationState): void;

  public abstract duration(): SimDuration;

  public getStatus(): ActionStatus {
    return this.status;
  }

  public getTemplateId(): ActionTemplateUid {
    return this.templateId;
  }
}

/**
 * An action that has a fixed duration and only start and finish effects
 */
export abstract class StartEndAction extends ActionBase {
  protected readonly durationSec;
  /**
   * Translation key for the name of the action (displayed in the timeline)
   */
  public readonly actionNameKey: TranslationKey | ITranslatableContent;
  /**
   * Adds SimFlags values to state at the end of the action
   */
  public provideFlagsToState: SimFlag[];

  protected constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = []
  ) {
    super(startTimeSec, eventId, ownerId, templateUid);
    this.durationSec = durationSeconds;
    this.actionNameKey = actionNameKey;
    this.provideFlagsToState = provideFlagsToState;
  }

  protected abstract dispatchInitEvents(state: Readonly<MainSimulationState>): void;

  protected abstract dispatchEndedEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {
    const simTime = state.getSimTime();
    switch (this.status) {
      case 'Cancelled': // should action do something ?
      case 'Completed':
        return;
      case 'Uninitialized':
        {
          if (simTime >= this.startTime) {
            // if action did start
            this.logger.debug('dispatching start events...');
            this.dispatchInitEvents(state);
            this.status = 'OnGoing';
          }
        }
        break;
      case 'OnGoing':
        {
          if (simTime >= this.startTime + this.duration()) {
            // if action did end
            this.logger.debug('dispatching end events...');
            // update flags in state as provided when action completes
            this.provideFlagsToState.forEach(
              flag => (state.getInternalStateObject().flags[flag] = true)
            );
            //execute dispatched events
            this.dispatchEndedEvents(state);
            this.status = 'Completed';
          }
        }
        break;
      default:
        this.logger.error('Undefined status cannot update action');
    }
  }

  public duration(): number {
    return this.durationSec;
  }

  public getTitle(): string {
    if (typeof this.actionNameKey === 'string') {
      return getTranslation('mainSim-actions-tasks', this.actionNameKey);
    } else {
      return I18n.translate(this.actionNameKey);
    }
  }
}

export abstract class ChoiceAction extends StartEndAction {
  // visibility ?
  public readonly choice: ChoiceDescriptor;

  protected constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    //messageKey: TranslationKey,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = [],
    choice: ChoiceDescriptor
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      //messageKey,
      ownerId,
      templateUid,
      provideFlagsToState
    );
    this.choice = choice;
  }

  protected applyChoice(state: Readonly<MainSimulationState>): void {
    if (this.choice != undefined) {
      const choiceActivable: ChoiceActivable | undefined = getChoiceActivable(
        state,
        this.choice.uid
      );
      const selectedEffect: Effect | undefined = this.choice.effects.find(
        e => e.uid === choiceActivable?.selectedEffect
      );

      if (selectedEffect) {
        const eventsToQueue = evaluateEffectImpacts(state, selectedEffect, this.Uid);
        eventsToQueue.forEach(localEvent => getLocalEventManager().queueLocalEvent(localEvent));
      } else {
        actionLogger.warn(`choice '${this.choice.uid}' has no selected effect`);
      }
    } else {
      actionLogger.error('a choice is needed to run the action');
    }
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>) {
    this.applyChoice(state);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// fully configurable choice action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class FullyConfigurableChoiceAction extends ChoiceAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[],
    choice: ChoiceDescriptor
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState,
      choice
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    // nothing to do
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);
    // nothing more to do
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Actors
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to send resources to a location and assign a task
 */
export class MoveResourcesAssignTaskAction extends RadioDrivenAction {
  public static readonly TIME_REQUIRED_TO_MOVE_TO_LOCATION = 60;

  public readonly commMedia: CommMedia;
  public readonly sourceLocation: LOCATION_ENUM;
  public readonly targetLocation: LOCATION_ENUM;
  public readonly sentResources: ResourceTypeAndNumber;
  public readonly sourceTaskId: TaskId;
  public readonly targetTaskId: TaskId;

  private compliantWithHierarchy: boolean;
  private isSameLocation: boolean;
  private timeDelay: number;
  private involvedResourcesId: ResourceId[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey | ITranslatableContent,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    commMedia: CommMedia,
    sourceLocation: LOCATION_ENUM,
    targetLocation: LOCATION_ENUM,
    sentResources: ResourceTypeAndNumber,
    sourceTaskId: TaskId,
    targetTaskId: TaskId
  ) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, ownerId, templateUid);
    this.commMedia = commMedia;
    this.sourceLocation = sourceLocation;
    this.targetLocation = targetLocation;
    this.sentResources = sentResources;
    this.sourceTaskId = sourceTaskId;
    this.targetTaskId = targetTaskId;
    this.compliantWithHierarchy = false;
    this.isSameLocation = false;
    this.timeDelay = 0;
    this.involvedResourcesId = [];
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event MoveResourcesAssignTaskAction');

    this.compliantWithHierarchy = doesOrderRespectHierarchy(
      state,
      this.ownerId,
      this.sourceLocation
    );

    this.isSameLocation = this.sourceLocation === this.targetLocation;

    if (!this.isSameLocation) {
      this.timeDelay = MoveResourcesAssignTaskAction.TIME_REQUIRED_TO_MOVE_TO_LOCATION;
    } else {
      this.timeDelay = 0;
    }

    this.involvedResourcesId = ResourceState.getFreeResourcesByNumberTypeLocationAndTask(
      state,
      this.sentResources,
      this.sourceLocation,
      this.sourceTaskId
    ).map(resource => resource.Uid);

    // we reserve the resources for this action so that they cannot be used by anything else
    getLocalEventManager().queueLocalEvent(
      new ReserveResourcesLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: this.involvedResourcesId,
        actionId: this.Uid,
      })
    );
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event MoveResourcesAssignTaskAction');

    if (this.commMedia === CommMedia.Radio) {
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
    }

    // we free the resources so that they are available again
    // ! but we free them only when everything is done !
    getLocalEventManager().queueLocalEvent(
      new UnReserveResourcesLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime() + this.timeDelay,
        resourcesId: this.involvedResourcesId,
      })
    );

    if (!this.compliantWithHierarchy) {
      // The order is carried out anyway, but the chain of command was not respected
      this.sendFeedbackMessage(state, 'move-res-task-hierarchy-not-respected');
    }

    if (!canMoveToLocation(state, 'Resources', this.targetLocation)) {
      // Resources cannot move to a non-existent location
      this.sendFeedbackMessage(state, 'move-res-task-no-location');
    } else {
      if (!this.isSameLocation) {
        getLocalEventManager().queueLocalEvent(
          new MoveResourcesLocalEvent({
            parentEventId: this.eventId,
            source: { type: 'action', id: this.Uid },
            simTimeStamp: state.getSimTime(),
            ownerUid: this.ownerId,
            resourcesId: this.involvedResourcesId,
            targetLocation: this.targetLocation,
          })
        );

        // during the travel set the resources as waiting
        getLocalEventManager().queueLocalEvent(
          new AssignResourcesToWaitingTaskLocalEvent({
            parentEventId: this.eventId,
            source: { type: 'action', id: this.Uid },
            simTimeStamp: state.getSimTime(),
            resourcesId: this.involvedResourcesId,
          })
        );
      }

      // during the travel set the resources as waiting
      getLocalEventManager().queueLocalEvent(
        new AssignResourcesToTaskLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime() + this.timeDelay,
          resourcesId: this.involvedResourcesId,
          taskId: this.targetTaskId,
        })
      );

      let nbResourcesNeeded: number = 0;
      // Note : please change code to be more straight forward
      entries(this.sentResources).forEach(([_resourceType, nbResources]) => {
        nbResourcesNeeded += nbResources || 0;
      });

      const isEnoughResources = this.involvedResourcesId.length === nbResourcesNeeded;

      if (this.involvedResourcesId.length === 0) {
        this.sendFeedbackMessage(state, 'move-res-task-no-resource');
      } else if (!isEnoughResources) {
        this.sendFeedbackMessage(state, 'move-res-task-not-enough-resources');
      }
      // no feed-back if everything works as expected
    }
  }

  private sendFeedbackMessage(state: Readonly<MainSimulationState>, messageKey: string) {
    // TODO Improve the way messages are handled => messageKey should be the translation prefix and then handle as may as needed with suffixes

    const isRadioMessage: boolean = this.commMedia === CommMedia.Radio;
    if (isRadioMessage) {
      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderName: getResourceAsSenderName(),
          recipientId: this.ownerId,
          message: messageKey,
          channel: RadioType.RESOURCES,
        })
      );
    } else {
      getLocalEventManager().queueLocalEvent(
        new AddNotificationLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderName: getResourceAsSenderName(),
          recipientId: this.ownerId,
          message: messageKey,
        })
      );
    }
  }

  public getChannel(): RadioType {
    return RadioType.RESOURCES;
  }

  public getMessage(): string {
    const arg0 = Object.keys(this.sentResources)
      .map(
        res =>
          this.sentResources[res as ResourceType] +
          ' ' +
          getTranslation('mainSim-resources', '' + res)
      )
      .join(', ');
    return getTranslation('mainSim-actions-tasks', 'move-res-task-request', true, [
      arg0,
      getTranslation('mainSim-locations', 'location-' + this.sourceLocation),
      TaskLogic.getTaskTitle(this.sourceTaskId),
      getTranslation('mainSim-locations', 'location-' + this.targetLocation),
      TaskLogic.getTaskTitle(this.targetTaskId),
    ]);
  }

  public getSenderId(): ActorId | undefined {
    return this.ownerId;
  }

  public getRecipientId(): ActorId | undefined {
    return undefined;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//  radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

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
    private pretriageLocation: LOCATION_ENUM
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
      })
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
      })
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
    private radioMessagePayload: RadioMessagePayload
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
      })
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Evacuation
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Action to evacuate a patient to a hospital
 */
export class EvacuationAction extends RadioDrivenAction {
  private readonly patientId: PatientId;
  private readonly hospitalId: HospitalId;
  private readonly patientUnitId: PatientUnitId;
  private readonly transportSquad: EvacuationSquadType;
  private readonly doResourcesComeBack: boolean;

  private compliantWithHierarchy: boolean;
  private isEnoughResources: boolean;
  private involvedResourcesId: ResourceId[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    readonly msgTaskRequest: TranslationKey,
    readonly feedbackWhenReturning: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    readonly msgEvacuationHierarchyNotRespected: TranslationKey,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    readonly evacuationActionPayload: EvacuationActionPayload,
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
    this.patientId = evacuationActionPayload.patientId;
    this.hospitalId = evacuationActionPayload.hospitalId;
    this.patientUnitId = evacuationActionPayload.patientUnitId;
    this.transportSquad = evacuationActionPayload.transportSquad;
    this.doResourcesComeBack = !!evacuationActionPayload.doResourcesComeBack;

    this.compliantWithHierarchy = false;
    this.isEnoughResources = false;
    this.involvedResourcesId = [];
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event EvacuationAction');

    const squadDef = getSquadDef(this.transportSquad);
    const sourceLocation = squadDef.location;

    this.compliantWithHierarchy = doesOrderRespectHierarchy(state, this.ownerId, sourceLocation);

    this.isEnoughResources = EvacuationLogic.isEvacSquadAvailable(state, this.transportSquad);

    this.involvedResourcesId = EvacuationLogic.getResourcesForEvacSquad(
      state,
      this.transportSquad
    ).map((resource: Resource) => resource.Uid);

    // we reserve the resources for this action so that they cannot be used by anything else
    getLocalEventManager().queueLocalEvent(
      new ReserveResourcesLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: this.involvedResourcesId,
        actionId: this.Uid,
      })
    );
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event EvacuationAction');

    // we free the resources so that they are available again
    getLocalEventManager().queueLocalEvent(
      new UnReserveResourcesLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: this.involvedResourcesId,
      })
    );

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

    if (!this.compliantWithHierarchy) {
      // The order is carried out anyway, but the chain of command was not respected
      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderName: RadioLogic.getResourceAsSenderName(),
          recipientId: this.ownerId,
          message: this.msgEvacuationHierarchyNotRespected,
          channel: this.getChannel(),
        })
      );
    }

    if (!this.isEnoughResources) {
      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderName: RadioLogic.getResourceAsSenderName(),
          recipientId: this.ownerId,
          message: this.msgEvacuationAbort,
          channel: this.getChannel(),
        })
      );
    } else {
      const travelTime = computeTravelTime(this.hospitalId, this.transportSquad);

      const evacuationTask = TaskLogic.getEvacuationTask(state);

      getLocalEventManager().queueLocalEvent(
        new AssignResourcesToTaskLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          resourcesId: this.involvedResourcesId,
          taskId: evacuationTask.Uid,
        })
      );

      evacuationTask.createSubTask(
        this.eventId,
        this.ownerId,
        this.involvedResourcesId,
        this.patientId,
        this.hospitalId,
        this.patientUnitId,
        this.doResourcesComeBack,
        travelTime,
        this.feedbackWhenReturning,
        getSquadDef(this.evacuationActionPayload.transportSquad)
      );
    }
  }

  private formatRequestMessage(payload: EvacuationActionPayload) {
    const hospital = getCachedHospitalById(payload.hospitalId);

    const patientId: string = payload.patientId;
    const toHospital: string = `${I18n.translate(hospital.preposition)} ${hospital.shortName}`;
    const squadDef = getSquadDef(payload.transportSquad);
    const byVector: string = getTranslation(
      'mainSim-actions-tasks',
      squadDef.mainVehicleTranslation,
      false
    );
    const healerPresence: string = getTranslation(
      'mainSim-actions-tasks',
      squadDef.healerPresenceTranslation,
      false
    );

    return getTranslation('mainSim-actions-tasks', this.msgTaskRequest, true, [
      patientId,
      toHospital,
      byVector,
      healerPresence,
    ]);
  }

  public getChannel(): RadioType {
    return RadioType.EVASAN;
  }

  public getMessage(): string {
    return this.formatRequestMessage(this.evacuationActionPayload);
  }

  public getSenderId(): ActorId | undefined {
    return this.ownerId;
  }

  public getRecipientId(): ActorId | undefined {
    return undefined;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
