import { MainSimulationState } from '../simulationState/mainSimulationState';
import { WaitingTask } from './taskBaseWaiting';

export function getIdleTaskUid(state: Readonly<MainSimulationState>) {
  return state.getInternalStateObject().tasks.find(task => task instanceof WaitingTask)!.Uid;
}
