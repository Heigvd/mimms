import {
  getCurrentState,
  triggerTimeForward,
  triggerTimeForwardCancel,
} from '../game/mainSimulationLogic';
import { TimeForwardState } from '../gameInterface/timeline';

/**
 * Triggers time forward in simulation
 */
export async function timeForward(): Promise<IManagedResponse> {
  return await triggerTimeForward();
}

export async function cancelTimeForward(): Promise<IManagedResponse> {
  return await triggerTimeForwardCancel();
}

/**
 * Get the current sim time
 */
export function getSimTime(): number {
  return getCurrentState().getSimTime();
}

export function showTimeForwardConfirmation(): boolean {
  return Context.interfaceState.state.timeForwardState === TimeForwardState.WaitingConfirmation;
}
