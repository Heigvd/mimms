import { getCurrentState, triggerTimeForward } from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';

export async function timeForward(): Promise<IManagedResponse> {
  setInterfaceState({ timeForwardAwaitingConfirmation: false });
  return await triggerTimeForward();
}

/**
 * Get the current sim time
 */
export function getSimTime(): number {
  return getCurrentState().getSimTime();
}
