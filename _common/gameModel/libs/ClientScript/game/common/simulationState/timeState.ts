import { ActorId } from '../baseTypes';
import { MainSimulationState } from './mainSimulationState';

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
