import { ActorId, GlobalEventId, SimDuration, SimTime } from '../baseTypes';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { mainSimLogger } from '../../../tools/logger';
import { Actor, InterventionRole } from '../actors/actor';
import { LocalEventBase, SourceType } from './localEventBase';
import { OnTheRoadAction } from '../actions/actionActors';

export class AddActorLocalEvent extends LocalEventBase {
  /**
   * Adds an actor in the game
   */
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly role: InterventionRole; // spawned role
      readonly location?: LOCATION_ENUM | undefined; // if undefined automatically resolved
      readonly travelTime?: SimDuration; // if 0 no travel time, if greater, a travel action is planned
    }
  ) {
    super({ ...props, type: 'AddActorLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const actor = new Actor(this.props.role);
    const loc = this.props.location || actor.getComputedSymbolicLocation(state);
    actor.setLocation(loc);
    state.getInternalStateObject().actors.push(actor);

    if (this.props.travelTime != undefined && this.props.travelTime > 0) {
      actor.setLocation(LOCATION_ENUM.remote);
      const now = state.getSimTime();
      const travelAction = new OnTheRoadAction(
        now,
        this.props.travelTime,
        'on-the-road',
        0,
        actor.Uid,
        '' // TODO SAM add the template id (from UniqueActionTemplates list -> InternalActionTemplates)
      );
      state.getInternalStateObject().actions.push(travelAction);
    }
  }
}

export class MoveActorLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly actorUid: ActorId;
      readonly location: LOCATION_ENUM;
    }
  ) {
    super({ ...props, type: 'MoveActorLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    // TODO Replace with canMoveToLocation2
    if (!canMoveToLocation(state, 'Actors', this.props.location)) {
      mainSimLogger.warn('The actor could not be moved as the target location is invalid');
    } else {
      so.actors
        .filter(a => a.Uid === this.props.actorUid)
        .forEach(a => (a.Location = this.props.location));
    }
  }
}
