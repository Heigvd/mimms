import { taskLogger } from '../../../tools/logger';
import { ActorId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { MainSimulationState } from './mainSimulationState';
import { ResourceType } from '../resources/resourceType';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * @returns The number of resources that are currently without activity, owned by the given actor and of the given type
 */
export function getResourcesAvailable(state: Readonly<MainSimulationState>, actorId: ActorId, resourceType: ResourceType): Resource[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res =>
    res.ownerId === actorId
    && res.type === resourceType
    && res.currentActivity == null);
}

/**
 * @returns The number of resources allocated to the given task
 */
export function getResourcesAllocatedToTask(state: Readonly<MainSimulationState>, taskId : TaskId): Resource[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res => 
    res.currentActivity === taskId);
}

/**
 * @returns The number of resources allocated to the given task
 */
export function getResourcesAllocatedToTaskOfType(state: Readonly<MainSimulationState>, taskId : TaskId, resourceType: ResourceType): Resource[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res => 
    res.currentActivity === taskId
  && res.type === resourceType);
}

/**
 * @returns The number of resources allocated to the given task, owner by the given actor and of the given type
 */
export function getResourcesAllocatedToTaskForActor(state: Readonly<MainSimulationState>, taskId: TaskId,
  actorId: ActorId, resourceType: ResourceType): Resource[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res => 
    res.currentActivity === taskId
    && res.ownerId === actorId
    && res.type === resourceType);
}

/**
 * @returns The resources of the given kind, owned by the given actor and without current activity
 */
export function getAvailableResources(state: Readonly<MainSimulationState>, actorId: ActorId, type: ResourceType): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res =>
    res.ownerId === actorId
    && res.type === type
    && res.currentActivity == null);
}

/**
 * @returns The resources of the given kind and allocated to the given task
 */
export function getAllocatedResources(state: Readonly<MainSimulationState>, taskId: TaskId, resourceType: ResourceType): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res =>
    res.type === resourceType
    && res.currentActivity === taskId);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Add resources to an actor.
 */
export function addIncomingResourcesToActor(state: MainSimulationState, actorId: ActorId, resourceType: ResourceType, nb: number): void {
  const internalState = state.getInternalStateObject();

  for (let i = 0; i < nb; i++) {
    internalState.resources.push(new Resource(resourceType, actorId));
  }
}

/**
 * Allocate resources to a task.
 */
export function allocateResourcesToTask(state: MainSimulationState, taskId : TaskId, actorId: ActorId, resourceType: ResourceType, nb: number): void {

  const available = getResourcesAvailable(state, actorId, resourceType);

  if (available.length < nb) {
    taskLogger.error("try to allocate too many resources (" + nb + ") of type " + resourceType
      + " for task " + taskId + " and actor " + actorId);
    return;
  }

  for (let i = 0; i < nb && i < available.length; i++) {
    available[i]!.currentActivity = taskId;
  }
}

/**
 * Release (deallocate) resources from a task.
 */
export function releaseResourcesFromTask(state: MainSimulationState, taskId: TaskId, actorId: ActorId, resourceType: ResourceType, nb: number): void {
  const atDisposal = getResourcesAllocatedToTaskForActor(state, taskId, actorId, resourceType);

  if (atDisposal.length < nb) {
    taskLogger.error("try to release too many resources (" + nb + ") of type " + resourceType
      + " of task " + taskId + " for actor " + actorId);
    return;
  }

  for (let i = 0; i < nb && i < atDisposal.length; i++) {
    atDisposal[i]!.currentActivity = null;
  }
}

/**
 * Release (deallocate) all resources from a task.
 */
export function releaseAllResourcesFromTask(state: MainSimulationState, taskId: TaskId): void {
  const atDisposal = getResourcesAllocatedToTask(state, taskId);

  for (const resource of atDisposal) {
    resource.currentActivity = null;
  }
}
