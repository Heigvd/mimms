import { isPlayerAwaitingTimeForward } from '../game/common/simulationState/timeState';
import {
  getCurrentState,
  triggerTimeForward,
  triggerTimeForwardCancel,
} from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';

/**
 * Triggers time forward in simulation
 */
export function timeForwardAskConfirmation(): void {
  setInterfaceState({ timeForwardAwaitingConfirmation: true });
}

export async function timeForward(): Promise<IManagedResponse> {
  setInterfaceState({ timeForwardAwaitingConfirmation: false });
  return await triggerTimeForward();
}

export async function cancelTimeForward(): Promise<IManagedResponse> {
  setInterfaceState({ timeForwardAwaitingConfirmation: false }); // just to make sure
  return await triggerTimeForwardCancel();
}

/**
 * Get the current sim time
 */
export function getSimTime(): number {
  return getCurrentState().getSimTime();
}

/** NOT USED YET => will be used for user confirmation on time forward button */
export function showTimeForwardConfirmation(): boolean {
  return Context.interfaceState.state.timeForwardAwaitingConfirmation;
}

/**
 * Return true when this player's actors are all ready to time forward
 */
export function showWaitingModal(): boolean {
  return isPlayerAwaitingTimeForward(getCurrentState());
}

export function getActorsTimeForwardReadiness() {
  const state = getCurrentState();
  const actors = state.getOnSiteActors();
  const tf = state.getCurrentTimeFrame();

  return actors.map(a => {
    return {
      id: a.Uid,
      actor: a,
      isReady: tf.waitingTimeForward[a.Uid] > 0,
    };
  });
}
