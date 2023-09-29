/**
 * All UX interactions related to resources and tasks should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActorId, TaskId } from "../game/common/baseTypes";
import { TaskBase } from "../game/common/tasks/taskBase";
import { buildAndLaunchResourceAllocation,buildAndLaunchResourceRelease,  getCurrentState } from "../game/mainSimulationLogic";
import * as ResourceState from '../game/common/simulationState/resourceStateAccess';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { ResourceType } from '../game/common/resources/resourceType';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the tasks that can be performed currently by resources owned by the given actor.
 *
 * @param actorId The actor who can allocate resource to those tasks
 *
 * @returns array of matching tasks
 */
export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
	return TaskState.fetchAvailableTasks(getCurrentState(), actorId);
}

/**
 * Retrieve how many human resources are available.
 *
 * @param actorId The actor responsible for these resources
 *
 * @return the number of matching resources
 */
export function countAvailableResources(actorId: ActorId, resourceType: ResourceType): number {
  return ResourceState.getAvailableResources(getCurrentState(), actorId, resourceType).length;
}

/**
 * Retrieve how many human resources (of any kind) are allocated to the given task.
 *
 * @param taskId The task of concern
 * @param resourceType The type of resources
 *
 * @returns the number of matching resources
 */
export function countAllocatedResources(taskId: TaskId, resourceType: ResourceType): number {
	return ResourceState.getAllocatedResources(getCurrentState(), taskId, resourceType).length;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Allocate resources to a task.
 *
 * @param taskId      The task to be performed
 * @param actorId     The owner of the resources
 * @param resourceType        The type of resources
 * @param nbResources The number of resources
 *
 * @returns The promise of a response from the server
 */
export async function allocateResource(taskId: TaskId, actorId: ActorId, resourceType: ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
	return await buildAndLaunchResourceAllocation(taskId, actorId, resourceType, nbResources);
}

/**
 * Release a resources from a task.
 *
 * @param taskId The task where the resources were allocated
 * @param actorId The owner of the resources
 * @param resourceType The type of resources
 * @param nbResources The number of resources
 *
 * @returns The promise of a response from the server
 */
export async function releaseResource(taskId: TaskId, actorId: ActorId, resourceType: ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
	return await buildAndLaunchResourceRelease(taskId, actorId, resourceType, nbResources);
}
