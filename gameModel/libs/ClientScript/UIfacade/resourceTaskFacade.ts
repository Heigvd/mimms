/**
 * All UX interactions related to resources and tasks should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActorId, TaskId } from '../game/common/baseTypes';
import { TaskBase } from '../game/common/tasks/taskBase';
import {
	getCurrentState,
} from '../game/mainSimulationLogic';
import * as ResourceState from '../game/common/simulationState/resourceStateAccess';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { HumanResourceTypeArray, ResourceType } from '../game/common/resources/resourceType';
import { ResourceFunction, ResourceFunctionArray } from '../game/common/resources/resourceFunction';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * @returns All the human resources types
 */
export function getHumanResourceTypes(): readonly ResourceType[] {
	return HumanResourceTypeArray;
}

export function getResourceFunction(): readonly ResourceFunction[] {
	return ResourceFunctionArray;
}

/**
 * Retrieve how many resources are unoccupied.
 *
 * @param ownerActorId The actor who owns the resources
 * @param resourceType The type of the resources
 *
 * @returns The number of matching resources
 */
export function countUnoccupiedResources(resourceType: ResourceType): number {
	return ResourceState.getUnoccupiedResources(getCurrentState(), resourceType).length;
}

/**
 * Retrieve the tasks that can be performed currently by resources owned by the given actor.
 *
 * @param actorId The actor who can allocate resource to those tasks // Deprecated, should be location instead !
 *
 * @returns array of matching tasks
 */
export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
	return TaskState.fetchAvailableTasks(getCurrentState(), actorId);
}

export function getAvailableTasksByLocation(actorId: ActorId, location: LOCATION_ENUM): Readonly<TaskBase>[] {
	return TaskState.fetchAvailableTasksByLocation(getCurrentState(), actorId, location);
}

export function getTasksWithResources(actorId: ActorId): Readonly<TaskBase>[] {
	return TaskState.fetchTasksWithResources(getCurrentState(), actorId);
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