import { MainSimulationState } from '../simulationState/mainSimulationState';
import { EvacuationTask } from './taskBaseEvacuation';
import { TaskBase, TaskType } from './taskBase';
import { TaskId } from '../baseTypes';

export function getIdleTaskUid(state: Readonly<MainSimulationState>): TaskId {
  return getIdleTask(state).Uid;
}

export function getIdleTask(state: Readonly<MainSimulationState>): TaskBase {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task.taskType ===  TaskType.Waiting)!;
}

export function getEvacuationTask(state: MainSimulationState): EvacuationTask {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task.taskType === TaskType.Evacuation)! as EvacuationTask;
}
