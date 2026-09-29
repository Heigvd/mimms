import { getCurrentState } from '../../mainSimulationLogic';
import { TaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase } from './taskBase';
import { EvacuationTask } from './taskBaseEvacuation';
import { MoveToTask } from './taskBaseMoveTo';
import { WaitingTask } from './taskBaseWaiting';

export function getIdleTaskUid(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): TaskId | undefined {
  return getIdleTask(state, location)?.Uid;
}

export function getIdleTask(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): TaskBase | undefined {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof WaitingTask && task.location === location);
}

// Unused but useful for debug
export function getMoveToTaskUid(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): TaskId | undefined {
  return getMoveToTask(state, location)?.Uid;
}

/** The task of a resource traveling to a location, for the time of its travel */
export function getMoveToTask(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): TaskBase | undefined {
  return state
    .getInternalStateObject()
    .tasks.find((task: TaskBase) => task instanceof MoveToTask && task.location === location);
}

/**
 * @returns whether the task is a travel, whatever its destination.
 * A resource on such a task is on its way somewhere and is not at anyone's disposal.
 */
export function isMoveToTaskUid(
  state: Readonly<MainSimulationState>,
  taskId: TaskId | null
): boolean {
  if (taskId == undefined) {
    return false;
  }

  return state
    .getInternalStateObject()
    .tasks.some((task: TaskBase) => task instanceof MoveToTask && task.Uid === taskId);
}

export function getEvacuationTask(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): EvacuationTask {
  return state
    .getInternalStateObject()
    .tasks.find(
      (task: TaskBase) => task instanceof EvacuationTask && task.location === location
    )! as EvacuationTask;
}

export function getEvacuationTaskUid(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): TaskId | undefined {
  return getEvacuationTask(state, location)?.Uid;
}

export function getTaskTitle(taskId: TaskId): string {
  return (
    getCurrentState() // it is accurate enough. no need to have the state as a parameter
      .getInternalStateObject()
      .tasks.find(t => t.Uid == taskId)
      ?.getTitle() || '' + taskId
  );
}
