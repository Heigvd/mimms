import { getCurrentState, triggerTimeForward } from "../game/mainSimulationLogic";

/**
 * Triggers time forward in simulation
 */
export async function timeForward(): Promise<IManagedResponse>{
  return await triggerTimeForward();
}

/**
 * Get the current sim time
 */
export function getSimTime(): number {
	return getCurrentState().getSimTime();
}