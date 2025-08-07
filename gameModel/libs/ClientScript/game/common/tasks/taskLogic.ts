import { getCurrentState } from '../../mainSimulationLogic';
import { TaskId } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase } from './taskBase';
import { EvacuationTask } from './taskBaseEvacuation';
import { WaitingTask } from './taskBaseWaiting';

export function getIdleTaskUid(state: Readonly<MainSimulationState>): TaskId {
  return getIdleTask(state).Uid;
}

export function getIdleTask(state: Readonly<MainSimulationState>): TaskBase {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof WaitingTask)!;
}

export function getEvacuationTask(state: Readonly<MainSimulationState>): EvacuationTask {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof EvacuationTask)! as EvacuationTask;
}

export function getTaskTitle(taskId: TaskId): string {
  return (
    getCurrentState() // it is accurate enough. no need to have the state as a parameter
      .getInternalStateObject()
      .tasks.find(t => t.Uid == taskId)
      ?.getTitle() || '' + taskId
  );
}
