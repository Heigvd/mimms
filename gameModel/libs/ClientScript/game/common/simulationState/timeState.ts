import { getCurrentPlayerActorIds } from '../../../UIfacade/actorFacade';
import { timeLogger } from '../../../tools/logger';
import { ActorId } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';

/**
 * Data structure used to handle time forward for multiplayer.
 * Time forward occurs only if all present actors on site
 * have been set ready to time forward.
 * An actor is set ready when a player controlling it
 * clicks on the time forward button.
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
      .reduce<Record<ActorId, number>>((acc, actor) => ((acc[actor.Uid] = 0), acc), {}),
  };
}

/**
 * Returns true if all involved actors on site are ready to time forward on the state's current time frame
 */
export function isTimeForwardReady(state: MainSimulationState): boolean {
  const actors = state.getOnSiteActors();
  const timeFrame = state.getCurrentTimeFrame();
  return actors.every(a => timeFrame.waitingTimeForward[a.Uid] || 0 > 0);
}

/**
 * Returns true if the player's controlled actors are all ready to time forward
 */
export function isPlayerAwaitingTimeForward(state: Readonly<MainSimulationState>): boolean {
  const actorIds = getCurrentPlayerActorIds(state.getOnSiteActors());
  const timeFrame = state.getCurrentTimeFrame();
  return actorIds.every(a => timeFrame.waitingTimeForward[a] || 0 > 0);
}

/**
 * Fetches the current timeframe and updates its time forward readiness for the given actors.
 * used to apply a time forward event.
 * If the expected time stamp (i.e. the timeforward event time stamp), doesn't match the current time frame's
 * timestamp, no changes are applied.
 */
export function updateCurrentTimeFrame(
  state: MainSimulationState,
  actors: ActorId[],
  increment: number,
  expectedTimeStamp: number
) {
  const timeFrame = state.getCurrentTimeFrame();
  if (timeFrame.currentTime !== expectedTimeStamp) {
    timeLogger.warn(`Current simulation time doesn't match the expected time. time frame update cancelled.
      (current time ${timeFrame.currentTime})(event ts ${expectedTimeStamp})`);
  } else {
    actors.forEach(actorId => {
      const v = timeFrame.waitingTimeForward[actorId] || 0;
      timeFrame.waitingTimeForward[actorId] = Math.max(0, v + increment);
    });
  }
}
