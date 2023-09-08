import { mainSimStateLogger } from "../../../tools/logger";
import { TaskId } from "../baseTypes";
import { TaskBase, TaskStatus } from "../tasks/taskBase";
import { MainSimulationState } from "./mainSimulationState";
import * as ResourceState from "./resourceStateAccess";


export function getAllTasks(state: MainSimulationState): Readonly<TaskBase>[] {
  const internalState = state.getInternalStateObject();

  return internalState.tasks;
}

function internallyGetTask(state: MainSimulationState, taskId: TaskId): TaskBase {
  const internalState = state.getInternalStateObject();

  const matchingTasks = internalState.tasks.filter(ta => ta.Uid === taskId);

  if (matchingTasks.length === 0 || matchingTasks[0] == null) {
    mainSimStateLogger.error("No task matches id : " + taskId);
  }
  if (matchingTasks.length > 1) {
    mainSimStateLogger.error("There must not be 2 tasks with same id : " + taskId);
  }

  return matchingTasks[0]!;
}

export function getTaskNbCurrentResources(state: MainSimulationState, taskId : TaskId): number {
  const task = internallyGetTask(state, taskId);

  return task.getNbCurrentResources();
}

export function getTaskNbResourcesStillMissing(state: MainSimulationState, taskId : TaskId): number {
  const task = internallyGetTask(state, taskId);

  return task.getNbMaxResources() - task.getNbCurrentResources();
}

export function isTaskAlive(state: MainSimulationState, taskId: TaskId): boolean {
  const task = internallyGetTask(state, taskId);

  return task.getStatus() != 'Cancelled' && task.getStatus() != 'Completed';
}

export function changeTaskAllocation(state: MainSimulationState, taskId : TaskId, nb: number): void {
  const task = internallyGetTask(state, taskId);

  task.incrementNbResources(nb);
}

export function changeTaskStatus(state: MainSimulationState, taskId: TaskId, status: TaskStatus): void {
  const task = internallyGetTask(state, taskId);

  task.setStatus(status);
}

export function releaseTaskResources(state: MainSimulationState, taskId: TaskId): void {
  const task = internallyGetTask(state, taskId);

  const nbResources = task.getNbCurrentResources();
  // TODO remove fake forced values as actors[0] and "MEDICAL_STAFF"
  ResourceState.addResources(state, state.getAllActors()[0]!.Uid, "MEDICAL_STAFF", nbResources);

  task.releaseAllResources();
}
