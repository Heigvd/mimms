import {
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
import { getLocalEventManager } from '../localEvents/localEventManager';
import {
  AssignResourcesToTaskLocalEvent,
  MoveResourcesLocalEvent,
} from '../localEvents/localEventResources';
import { doesOrderRespectHierarchy } from '../resources/resourceLogic';
import { SubOrder } from '../resources/resourceOrdersType';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { RadioDrivenAction } from './radioActions';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskLogic from '../tasks/taskLogic';
import * as RadioLogic from '../radio/radioLogic';
import * as EvacuationLogic from '../evacuation/evacuationLogic';
import {
  AddNotificationLocalEvent,
  AddRadioMessageLocalEvent,
} from '../localEvents/localEventRadio';
import { entries } from '../../../tools/helper';
import { getResourceAsSenderName } from '../radio/radioLogic';
import { CommMedia, RadioType } from '../radio/communicationType';
import { getTranslation } from '../../../tools/translation';
import { EvacuationActionPayload } from '../events/evacuationMessageEvent';
import { EvacuationSquadType, getSquadDef } from '../evacuation/evacuationSquadDef';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { Resource } from '../resources/resource';
import { getCachedHospitalById } from '../../loaders/hospitalLoader';

/**
 * A sub-order once the resources it gets have been picked from the state.
 * <p>
 * The tasks themselves need no resolution, the order already refers to them by id.
 */
interface ResolvedOrder {
  readonly order: SubOrder;
  readonly targetLocation: LOCATION_ENUM;
  readonly targetTaskId: TaskId;
  readonly isSameLocation: boolean;
  readonly timeDelay: number;
  /** how many resources the order asked for */
  readonly nbRequested: number;
  /** the resources actually found, they can be less than asked for */
  readonly involvedResourcesId: ResourceId[];
}

/**
 * Action to send resources to a location and assign a task
 */
export class MoveResourcesAssignTaskAction extends RadioDrivenAction {
  public static readonly TIME_REQUIRED_TO_MOVE_TO_LOCATION = 60;

  public readonly commMedia: CommMedia;
  public readonly orders: SubOrder[];

  private compliantWithHierarchy: boolean;
  private resolvedOrders: ResolvedOrder[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey | ITranslatableContent,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    commMedia: CommMedia,
    orders: SubOrder[]
  ) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, ownerId, templateUid);
    this.commMedia = commMedia;
    this.orders = orders;
    this.compliantWithHierarchy = false;
    this.resolvedOrders = [];
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event MoveResourcesAssignTaskAction');

    this.compliantWithHierarchy = this.orders.every(order =>
      doesOrderRespectHierarchy(state, this.ownerId, order.source)
    );

    // the events of every sub-order are queued, not applied, before the next sub-order is resolved,
    // so without this the same resource could be handed to two sub-orders
    const alreadyClaimed = new Set<ResourceId>();

    this.resolvedOrders = this.orders
      .map(order => this.resolveOrder(state, order, alreadyClaimed))
      .filter((resolved): resolved is ResolvedOrder => resolved != undefined);

    // the resources take the road right away, so that they cannot be claimed by anything else.
    // they only reach their destination and their new task when the action is over,
    // hence the travel is longer than the sole travel time
    this.resolvedOrders.forEach(resolved => {
      const moveToTaskUid: TaskId | undefined = TaskLogic.getMoveToTaskUid(
        state,
        resolved.targetLocation
      );

      if (moveToTaskUid == undefined) {
        this.logger.warn('No travelling task to the destination, the resources stay on their task');
        return;
      }

      getLocalEventManager().queueLocalEvent(
        new AssignResourcesToTaskLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          resourcesId: resolved.involvedResourcesId,
          taskId: moveToTaskUid,
        })
      );
    });
  }

  /**
   * Pick the resources one sub-order gets.
   *
   * @param alreadyClaimed resources taken by the previous sub-orders, it is completed as we go
   * @returns undefined when the sub-order cannot be carried out at all
   */
  private resolveOrder(
    state: Readonly<MainSimulationState>,
    order: SubOrder,
    alreadyClaimed: Set<ResourceId>
  ): ResolvedOrder | undefined {
    const sourceTaskId: TaskId | undefined = order.sourceTask;
    if (
      sourceTaskId == undefined ||
      order.destination == undefined ||
      order.destinationTask == undefined
    ) {
      this.logger.warn('Ignoring an incomplete resource order');
      return undefined;
    }

    const isSameLocation = order.source === order.destination;
    const involvedResourcesId: ResourceId[] = [];
    let nbRequested = 0;

    entries(order.resources).forEach(([resourceType, nbResources]) => {
      if (!nbResources || nbResources <= 0) {
        return;
      }
      nbRequested += nbResources;

      ResourceState.getResourcesByTypeLocationAndTask(
        state,
        resourceType,
        order.source,
        sourceTaskId
      )
        .filter(resource => !alreadyClaimed.has(resource.Uid))
        .slice(0, nbResources)
        .forEach(resource => {
          alreadyClaimed.add(resource.Uid);
          involvedResourcesId.push(resource.Uid);
        });
    });

    return {
      order: order,
      targetLocation: order.destination,
      targetTaskId: order.destinationTask,
      isSameLocation: isSameLocation,
      timeDelay: isSameLocation
        ? 0
        : MoveResourcesAssignTaskAction.TIME_REQUIRED_TO_MOVE_TO_LOCATION,
      nbRequested: nbRequested,
      involvedResourcesId: involvedResourcesId,
    };
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

    if (!this.compliantWithHierarchy) {
      // The order is carried out anyway, but the chain of command was not respected
      this.sendFeedbackMessage(state, 'move-res-task-hierarchy-not-respected');
    }

    let anyUnreachableDestination = false;
    let nbCarriedOut: number = 0;
    let nbResourcesNeeded: number = 0;
    let nbResourcesInvolved: number = 0;

    this.resolvedOrders.forEach(resolved => {
      if (!canMoveToLocation(state, 'Resources', resolved.targetLocation)) {
        // Resources cannot move to a non-existent location.
        // They took the road when the order was given, so they are sent back to wait for orders,
        // otherwise they would travel forever to a place they cannot reach.
        anyUnreachableDestination = true;
        this.sendBackToWaitForOrders(state, resolved);
        return;
      }

      nbCarriedOut++;
      nbResourcesNeeded += resolved.nbRequested;
      nbResourcesInvolved += resolved.involvedResourcesId.length;

      if (!resolved.isSameLocation) {
        // move the resource to its new location at end of travel
        getLocalEventManager().queueLocalEvent(
          new MoveResourcesLocalEvent({
            parentEventId: this.eventId,
            source: { type: 'action', id: this.Uid },
            simTimeStamp: state.getSimTime() + resolved.timeDelay,
            ownerUid: this.ownerId,
            resourcesId: resolved.involvedResourcesId,
            targetLocation: resolved.targetLocation,
          })
        );
      }

      // once the travel is over, the resources start their new task
      getLocalEventManager().queueLocalEvent(
        new AssignResourcesToTaskLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime() + resolved.timeDelay,
          resourcesId: resolved.involvedResourcesId,
          taskId: resolved.targetTaskId,
        })
      );
    });

    // one feed-back of each kind for the whole action, whatever the number of sub-orders
    if (anyUnreachableDestination) {
      this.sendFeedbackMessage(state, 'move-res-task-no-location');
    }

    if (nbCarriedOut > 0) {
      if (nbResourcesInvolved === 0) {
        this.sendFeedbackMessage(state, 'move-res-task-no-resource');
      } else if (nbResourcesInvolved !== nbResourcesNeeded) {
        this.sendFeedbackMessage(state, 'move-res-task-not-enough-resources');
      }
      // no feed-back if everything works as expected
    }
  }

  /**
   * Put the resources of a sub-order that cannot be carried out back on the waiting task
   * of the location they never left.
   */
  private sendBackToWaitForOrders(
    state: Readonly<MainSimulationState>,
    resolved: ResolvedOrder
  ): void {
    const idleTaskUid: TaskId | undefined = TaskLogic.getIdleTaskUid(state, resolved.order.source);

    if (idleTaskUid == undefined) {
      this.logger.warn(
        `Resources cannot wait for orders at ${resolved.order.source}, they stay on their task`
      );
      return;
    }

    getLocalEventManager().queueLocalEvent(
      new AssignResourcesToTaskLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: resolved.involvedResourcesId,
        taskId: idleTaskUid,
      })
    );
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

  /**
   * One sentence per sub-order.
   * <p>
   * Built from the orders only, never from the resolved data : the pending radio messages
   * are rendered from an action that has not necessarily started yet.
   */
  public getMessage(): string {
    return this.orders
      .filter(
        order =>
          order.sourceTask != undefined &&
          order.destination != undefined &&
          order.destinationTask != undefined
      )
      .map(order => this.getOrderMessage(order))
      .join('\n');
  }

  private getOrderMessage(order: SubOrder): string {
    return getTranslation('mainSim-actions-tasks', 'move-res-task-request', true, [
      entries(order.resources)
        .filter(([_resourceType, nbResources]) => nbResources)
        .map(
          ([resourceType, nbResources]) =>
            nbResources + ' ' + getTranslation('mainSim-resources', '' + resourceType)
        )
        .join(', '),
      getTranslation('mainSim-locations', 'location-' + order.source),
      TaskLogic.getTaskTitle(order.sourceTask!),
      getTranslation('mainSim-locations', 'location-' + order.destination),
      TaskLogic.getTaskTitle(order.destinationTask!),
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

    if (!this.isEnoughResources) {
      // an incomplete squad cannot evacuate anyone, we leave its resources to the others
      return;
    }

    this.involvedResourcesId = EvacuationLogic.getResourcesForEvacSquad(
      state,
      this.transportSquad
    ).map((resource: Resource) => resource.Uid);

    // the squad is engaged right away, so that it cannot be claimed by anything else.
    // it only takes the patient in charge when the action is over
    getLocalEventManager().queueLocalEvent(
      new AssignResourcesToTaskLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: this.involvedResourcesId,
        taskId: TaskLogic.getEvacuationTask(state, sourceLocation).Uid,
      })
    );
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event EvacuationAction');

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
      const travelTime = EvacuationLogic.computeTravelTime(this.hospitalId, this.transportSquad);

      const evacuationTask = TaskLogic.getEvacuationTask(
        state,
        getSquadDef(this.transportSquad).location
      );

      // the squad is already on the evacuation task since the order was given,
      // it now takes the patient in charge
      evacuationTask.createSubTask(
        this.eventId,
        this.ownerId,
        this.involvedResourcesId,
        this.patientId,
        this.hospitalId,
        this.patientUnitId,
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
