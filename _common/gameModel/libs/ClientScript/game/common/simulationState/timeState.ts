import { ActorId } from '../baseTypes';
import { MainSimulationState } from './mainSimulationState';
import { isOngoingAndStartedAction } from './actionStateAccess';
import { CustomDurationAction } from '../actions/actionBase';

/**
 * Data structure used to handle time forward for multiplayer.
 * Time forward occurs only if all present actors on site
 * have been set ready to time forward.
 * An actor is set ready when a player controlling it
 * clicks on the time forward button.
 * An actor is considered to be ready if it is in a situation update.
 */
export interface TimeFrame {
  currentTime: Readonly<number>;
  waitingTimeForward: Record<ActorId, number>;
}

export function buildNewTimeFrame(state: MainSimulationState): TimeFrame {
  return {
    currentTime: state.getSimTime(),
    waitingTimeForward: state
      .getOnSiteActors()
      .reduce<Record<ActorId, number>>(
        (acc, actor) => ((acc[actor.Uid] = getInitialTimeForwardStatus(state, actor.Uid)), acc),
        {}
      ),
  };
}

function getInitialTimeForwardStatus(
  state: Readonly<MainSimulationState>,
  actorUid: ActorId
): number {
  if (isOngoingAndStartedAction(state, actorUid, CustomDurationAction)) {
    return 1;
  }
  return 0;
}

function canActorPlanActionInState(
  state: Readonly<MainSimulationState>,
  actorId: ActorId
): boolean {
  const currentTime = state.getSimTime();
  const actorActions = state.getActionsByActorIds()[actorId];

  if (actorActions === undefined) return true;

  for (const action of actorActions) {
    if (action.startTime === currentTime) return false;
    if (action.startTime + action.duration() > currentTime) return false;
  }

  return true;
}

/**
 * Returns true if all involved actors on site are ready to time forward on the state's current time frame
 */
export function isTimeForwardReady(state: Readonly<MainSimulationState>): boolean {
  return state.getOnSiteActors().every(a => !canActorPlanActionInState(state, a.Uid));
}
