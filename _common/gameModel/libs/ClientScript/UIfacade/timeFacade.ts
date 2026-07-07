import { isPlayerAwaitingTimeForward } from '../game/common/simulationState/timeState';
import { getCurrentState, triggerTimeForward } from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';
import { getTranslation } from '../tools/translation';

/**
 * Triggers the confirmation interface for time forward
 */
export function timeForwardAskConfirmation(): void {
  setInterfaceState({ timeForwardAwaitingConfirmation: true });
}

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
    const currentStatus =
      (tf.waitingTimeForward[a.Uid] || 0) > 0 ? 'player-ready' : 'player-unready';

    return {
      id: a.Uid,
      actor: a,
      isReady: ': ' + getTranslation('mainSim-interface', currentStatus),
    };
  });
}
