import { ResourceOrder } from '../../resources/resourceOrdersType';
import { ActionTemplateUid, ActorId, SimDuration, SimTime, TranslationKey } from '../../baseTypes';
import { EvacuationAction, MoveResourcesAssignTaskAction } from '../resourceActions';
import { MoveResourcesAssignTaskEvent } from '../../events/eventTypes';
import { Actor, InterventionRole } from '../../actors/actor';
import { ActionType } from '../../actionType';
import { FullEvent } from '../../events/eventUtils';
import {
  EvacuationActionEvent,
  EvacuationActionPayload,
} from '../../events/evacuationMessageEvent';
import { SimFlag, StartEndTemplate } from './actionTemplateBase';

/**
 * Action template to create an action to send resources to a location and assign a task
 */
export class MoveResourcesAssignTaskActionTemplate extends StartEndTemplate<
  MoveResourcesAssignTaskAction,
  MoveResourcesAssignTaskEvent,
  ResourceOrder
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
      ActionType.RESOURCES_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: ResourceOrder
  ): MoveResourcesAssignTaskEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      commMedia: params.commMedia,
      // an order still being edited has no destination yet, it must not reach the simulation
      orders: params.orders.filter(
        order => order.destination != undefined && order.destinationTask != undefined
      ),
    };
  }

  protected createActionFromEvent(
    event: FullEvent<MoveResourcesAssignTaskEvent>
  ): MoveResourcesAssignTaskAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new MoveResourcesAssignTaskAction(
      payload.triggerTime,
      this.duration,
      this.title,
      event.id,
      ownerId,
      this.uid,
      payload.commMedia,
      payload.orders
    );
  }
}

/**
 * Action to evacuate a patient to a hospital
 */
export class EvacuationActionTemplate extends StartEndTemplate<
  EvacuationAction,
  EvacuationActionEvent,
  EvacuationActionPayload
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly msgTaskRequest: TranslationKey,
    readonly feedbackWhenReturning: TranslationKey,
    readonly msgEvacuationAbort: TranslationKey,
    readonly msgEvacuationHierarchyNotRespected: TranslationKey,
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
      ActionType.EVASAN_RADIO,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<EvacuationActionEvent>): EvacuationAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new EvacuationAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      this.msgTaskRequest,
      this.feedbackWhenReturning,
      this.msgEvacuationAbort,
      this.msgEvacuationHierarchyNotRespected,
      ownerId,
      this.uid,
      payload.evacuationActionPayload,
      this.raisedFlags
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: EvacuationActionPayload
  ): EvacuationActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      evacuationActionPayload: params,
    };
  }
}
