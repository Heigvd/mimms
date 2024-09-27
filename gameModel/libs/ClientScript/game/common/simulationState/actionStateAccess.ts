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
