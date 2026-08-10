import {
  ActionTemplateUid,
  ActorId,
  GlobalEventId,
  SimDuration,
  SimTime,
  TranslationKey,
} from '../baseTypes';
import { SimFlag } from './actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from './choiceDescriptor/choiceDescriptor';
import { getActiveMapEntityFromBinding, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { MoveActorLocalEvent } from '../localEvents/localEventActors';
import {
  AssignResourcesToTaskLocalEvent,
  MoveFreeHumanResourcesByLocationLocalEvent,
  MoveFreeWaitingResourcesByTypeLocalEvent,
  MoveResourcesLocalEvent,
} from '../localEvents/localEventResources';
import { ChangeMapActivableStatusLocalEvent } from '../localEvents/localEventActivable';
import { VehicleType } from '../resources/resourceType';
import { ChoiceAction } from './actionBase';
import { getIdleTaskUid } from '../tasks/taskLogic';

export class MapChoiceAction extends ChoiceAction {
  public readonly binding?: LOCATION_ENUM;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[],
    choice: ChoiceDescriptor,
    binding?: LOCATION_ENUM
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
    this.binding = binding;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    if (!this.choice.displayedMapEntity) {
      this.logger.error('Choice has no map entity to display');
      return;
    }

    getLocalEventManager().queueLocalEvent(
      new ChangeMapActivableStatusLocalEvent(
        {
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          target: this.choice.displayedMapEntity,
          option: 'activate',
        },
        'pending'
      )
    );
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);

    if (!this.choice.displayedMapEntity) {
      this.logger.error('Choice has no map entity to display');
      return;
    }

    getLocalEventManager().queueLocalEvent(
      new ChangeMapActivableStatusLocalEvent(
        {
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          target: this.choice.displayedMapEntity,
          option: 'activate',
        },
        'built'
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place PC Front
// -------------------------------------------------------------------------------------------------

export class PCFrontChoiceAction extends MapChoiceAction {
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
      choice,
      LOCATION_ENUM.pcFront
    );
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);

    getLocalEventManager().queueLocalEvent(
      new MoveActorLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        actorUid: this.ownerId,
        location: this.binding!,
      })
    );

    // First and only resource on scene comes with
    const resourceUid = state.getInternalStateObject().resources[0]!.Uid;
    getLocalEventManager().queueLocalEvent(
      new MoveResourcesLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        ownerUid: this.ownerId,
        resourcesId: [resourceUid],
        targetLocation: this.binding!,
      })
    );
    getLocalEventManager().queueLocalEvent(
      new AssignResourcesToTaskLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        resourcesId: [resourceUid],
        taskId: getIdleTaskUid(state, this.binding!),
      })
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place PC
// -------------------------------------------------------------------------------------------------

export class PCChoiceAction extends MapChoiceAction {
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
      choice,
      LOCATION_ENUM.PC
    );
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);
    // Move actors to PC
    const actors = state
      .getInternalStateObject()
      .actors.filter(a => a.Location === LOCATION_ENUM.pcFront);

    for (const actor of actors) {
      getLocalEventManager().queueLocalEvent(
        new MoveActorLocalEvent({
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          actorUid: actor.Uid,
          location: this.binding!,
        })
      );
    }
    // Move human resources to PC
    getLocalEventManager().queueLocalEvent(
      new MoveFreeHumanResourcesByLocationLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        ownerUid: this.ownerId,
        sourceLocation: LOCATION_ENUM.pcFront,
        targetLocation: this.binding!,
      })
    );
    // Remove PC Front once all actors and resources have been moved
    const pcFrontActivable = getActiveMapEntityFromBinding(state, LOCATION_ENUM.pcFront);
    getLocalEventManager().queueLocalEvent(
      new ChangeMapActivableStatusLocalEvent(
        {
          parentEventId: this.eventId,
          source: { type: 'action', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          target: pcFrontActivable!.uid,
          option: 'deactivate',
        },
        'pending'
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// place park
// -------------------------------------------------------------------------------------------------

export class ParkChoiceAction extends MapChoiceAction {
  // The binding is always ambulancePark or helicopterPark
  public declare readonly binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark;
  public readonly vehicleType: VehicleType;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    eventId: GlobalEventId,
    actionNameKey: TranslationKey | ITranslatableContent,
    ownerId: ActorId,
    templateUid: ActionTemplateUid,
    provideFlagsToState: SimFlag[],
    choice: ChoiceDescriptor,
    binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark,
    vehicleType: VehicleType
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
    this.binding = binding;
    this.vehicleType = vehicleType;
  }

  protected override dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    super.dispatchEndedEvents(state);

    getLocalEventManager().queueLocalEvent(
      new MoveFreeWaitingResourcesByTypeLocalEvent({
        parentEventId: this.eventId,
        source: { type: 'action', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        ownerUid: this.ownerId,
        resourceType: this.vehicleType,
        targetLocation: this.binding,
      })
    );
  }
}
