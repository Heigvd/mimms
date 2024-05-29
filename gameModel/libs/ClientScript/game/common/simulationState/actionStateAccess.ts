import { ActionBase } from '../actions/actionBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';

export function getOngoingActionsForActor(
  state: Readonly<MainSimulationState>,
  actorUid: number
): ActionBase[] {
  return state
    .getAllActions()
    .filter((a: ActionBase) => a.ownerId === actorUid && a.getStatus() === 'OnGoing');
}

export function getOngoingActions(state: Readonly<MainSimulationState>): ActionBase[] {
  return state.getAllActions().filter((a: ActionBase) => a.getStatus() === 'OnGoing');
}
