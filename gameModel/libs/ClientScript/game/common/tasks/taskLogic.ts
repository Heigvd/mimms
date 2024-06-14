import { MainSimulationState } from '../simulationState/mainSimulationState';
import { WaitingTask } from './taskBaseWaiting';
import { EvacuationTask } from './taskBaseEvacuation';
import { TaskBase } from './taskBase';
import { TaskId } from '../baseTypes';

export function getIdleTaskUid(state: Readonly<MainSimulationState>): TaskId {
  return getIdleTask(state).Uid;
}

export function getIdleTask(state: Readonly<MainSimulationState>): TaskBase {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof WaitingTask)!;
}

export function getEvacuationTask(state: MainSimulationState): EvacuationTask {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof EvacuationTask)! as EvacuationTask;
}
