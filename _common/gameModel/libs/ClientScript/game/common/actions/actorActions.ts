import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { ActionTemplateUid, ActorId, GlobalEventId, SimDuration, SimTime, TranslationKey } from '../baseTypes';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { AddNotificationLocalEvent } from '../localEvents/localEventRadio';
import { AddActorLocalEvent, MoveActorLocalEvent } from '../localEvents/localEventActors';
import { InterventionRole } from '../actors/actor';
import { doesOrderRespectHierarchy } from '../resources/resourceLogic';
import * as RadioLogic from '../radio/radioLogic';
import { StartEndAction } from './actionBase';

/**
 * Action to move actor from one location to another
 */
export class MoveActorAction extends StartEndAction {
  public readonly location: LOCATION_ENUM;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = [],
    location: LOCATION_ENUM,
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState,
    );
    this.location = location;
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    if (!canMoveToLocation(state, 'Actors', this.location)) {
      getLocalEventManager().queueLocalEvent(
        new AddNotificationLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          recipientId: this.ownerId,
          message: 'move-actor-no-location',
        }),
      );
    } else {
      getLocalEventManager().queueLocalEvent(
        new MoveActorLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          actorUid: this.ownerId,
          location: this.location,
        }),
      );
    }
  }
}

export class AppointActorAction extends StartEndAction {
  private location: LOCATION_ENUM | undefined;
  private compliantWithHierarchy: boolean;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = [],
    readonly actorRole: InterventionRole,
    readonly hierarchyNotRespectedMessageKey: TranslationKey,
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState,
    );

    this.location = undefined;
    this.compliantWithHierarchy = false;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.location = state.getActorById(this.ownerId)!.Location;
    this.compliantWithHierarchy = doesOrderRespectHierarchy(state, this.ownerId, this.location);
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    getLocalEventManager().queueLocalEvent(
      new AddActorLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        role: this.actorRole,
        location: this.location,
      }),
    );

    if (!this.compliantWithHierarchy) {
      // The order is carried out anyway, but the chain of command was not respected
      getLocalEventManager().queueLocalEvent(
        new AddNotificationLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          senderName: RadioLogic.getResourceAsSenderName(),
          recipientId: this.ownerId,
          message: this.hierarchyNotRespectedMessageKey,
        }),
      );
    }
  }
}

/**
 * Action book a moment for situation update (point de situation)
 */
export class SituationUpdateAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[] = [],
  ) {
    super(
      startTimeSec,
      durationSeconds,
      eventId,
      actionNameKey,
      ownerId,
      templateUid,
      provideFlagsToState,
    );
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    // nothing to do
  }

  protected dispatchEndedEvents(_state: Readonly<MainSimulationState>): void {
    // nothing to do
  }
}

export class OnTheRoadAction extends StartEndAction {
  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, ownerId, templateUid);
  }

  protected dispatchInitEvents(_state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event OnTheRoadAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event OnTheRoadAction');
    // Once actor arrives, we change location from remote
    const actor = state.getActorById(this.ownerId)!;
    actor.setLocation(actor.getComputedSymbolicLocation(state));
  }
}