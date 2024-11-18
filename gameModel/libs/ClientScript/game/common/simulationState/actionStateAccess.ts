import { ActionBase } from '../actions/actionBase';
import { MainSimulationState } from './mainSimulationState';

export function getOngoingActionsForActor(
  state: Readonly<MainSimulationState>,
  actorUid: number
): ActionBase[] {
  return getOngoingActions(state).filter((a: ActionBase) => a.ownerId === actorUid);
}

export function getOngoingActions(state: Readonly<MainSimulationState>): ActionBase[] {
  return state.getAllActions().filter((a: ActionBase) => a.getStatus() === 'OnGoing');
}

export function isOngoingAndStartedAction<T extends ActionBase>(
  state: Readonly<MainSimulationState>,
  actorUid: number,
  actionClass: { new (...args: any[]): T }
): boolean {
  return (
    getOngoingActionsForActor(state, actorUid).find(
      (a: ActionBase) => a instanceof actionClass && isActionOngoingAndStarted(state, a)
    ) != undefined
  );
}

function isActionOngoingAndStarted(
  state: Readonly<MainSimulationState>,
  action: ActionBase
): boolean {
  return action.getStatus() === 'OnGoing' && action.startTime < state.getSimTime();
}
