import { mainSimStateLogger, taskLogger } from '../../../tools/logger';
import { ActorId, TaskId } from '../baseTypes';
import { TaskBase, TaskStatus } from '../tasks/taskBase';
import { MainSimulationState } from './mainSimulationState';
import * as ResourceState from './resourceStateAccess';
import { ResourceType } from '../resources/resourceType';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * @returns All the tasks (no filter)
 */
export function getAllTasks(state: Readonly<MainSimulationState>): Readonly<TaskBase>[] {
	const internalState = state.getInternalStateObject();

	return internalState.tasks;
}

/**
 * @returns The tasks that can be handled by the actor regarding the current state.
 * (= the tasks to which the actor can allocate resources)
 */
export function fetchAvailableTasks(
	state: Readonly<MainSimulationState>,
	actorId: ActorId,
): Readonly<TaskBase>[] {
	const actor = state.getActorById(actorId);
	if (actor) {
		return Object.values(getAllTasks(state)).filter(ta => ta.isAvailable(state, actor));
	} else {
		taskLogger.warn('Actor not found. id = ' + actorId + '. And so no task is available');
		return [];
	}
}

export function fetchTasksWithResources(
	state: Readonly<MainSimulationState>,
	actorId: ActorId,
): Readonly<TaskBase>[] {
	const allocatedResources = ResourceState.getResourcesAllocatedToAnyTaskForActor(state, actorId);
	const tasksIdWhereResources = allocatedResources.flatMap(resource => [resource.currentActivity!]);
	return Object.values(getAllTasks(state)).filter(ta =>
		tasksIdWhereResources.find(taskId => taskId == ta.Uid),
	);
}

/**
 * @returns True if the task has a status that is not final. It means that the task can still evolve.
 * The final status are 'Cancelled' and 'Completed'
 */
export function isTaskAlive(state: Readonly<MainSimulationState>, taskId: TaskId): boolean {
	const task = internallyGetTask(state, taskId);

	return task.getStatus() != 'Cancelled' && task.getStatus() != 'Completed';
}

/**
 * @returns The nb of resources that are still useful to perform the task. (More resources would be useless)
 */
export function getNbResourcesStillUsefulForTask(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
	type: ResourceType,
): number {
	const task = internallyGetTask(state, taskId);

	// TODO pro type

	return task.getNbMaxResources() - ResourceState.getResourcesAllocatedToTask(state, taskId).length;
}

/**
 * @returns Whether the allocated resources are enough to perform the task
 */
export function hasEnoughResources(state: Readonly<MainSimulationState>, task: TaskBase): boolean {
	// TODO for each type
	return (
		ResourceState.getResourcesAllocatedToTask(state, task.Uid).length >= task.getNbMinResources()
	);
}

/**
 * @returns The task matching the Uid. Previously check that it is unique.
 */
function internallyGetTask(state: Readonly<MainSimulationState>, taskId: TaskId): TaskBase {
	const internalState = state.getInternalStateObject();

	const matchingTasks = internalState.tasks.filter(ta => ta.Uid === taskId);

	if (matchingTasks.length === 0 || matchingTasks[0] == null) {
		mainSimStateLogger.error('No task matches id : ' + taskId);
	}

	if (matchingTasks.length > 1) {
		mainSimStateLogger.error('Error in data : there must not be 2 tasks with same id : ' + taskId);
	}

	return matchingTasks[0]!;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Change the status of a task
 */
export function changeTaskStatus(
	state: MainSimulationState,
	taskId: TaskId,
	status: TaskStatus,
): void {
	const task = internallyGetTask(state, taskId);

	task.setStatus(status);
}
