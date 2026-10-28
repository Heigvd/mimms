import { getCurrentState } from '../game/mainSimulationLogic';

/**
 * Get the current sim time
 */
export function getSimTime(): number {
  return getCurrentState().getSimTime();
}
