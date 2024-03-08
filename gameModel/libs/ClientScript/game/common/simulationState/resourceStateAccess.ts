import { resourceLogger, taskLogger } from '../../../tools/logger';
import { ActorId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { MainSimulationState } from './mainSimulationState';
import { HumanResourceTypeArray, ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { entries } from '../../../tools/helper';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { getTaskResponsibleActorSymbolicLocation } from '../simulationState/taskStateAccess';
import { getIdleTaskUid } from '../tasks/taskLogic';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the unoccupied resources.
 *
 * @param state The state
 * @param ownerActorId The actor who owns the resources // Has been removed, should be location now !
 * @param resourceType The type of the resources
 *
 * @returns The matching resources
 */
export function getUnoccupiedResources(state: Readonly<MainSimulationState>, resourceType: ResourceType):
	Readonly<Resource>[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(res =>
		res.type === resourceType
		&& res.currentActivity == getIdleTaskUid(state));
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function transferResourcesFromToLocation(state: MainSimulationState, sourceLocation: LOCATION_ENUM, destinationLocation: LOCATION_ENUM, sentResources: ResourceTypeAndNumber, sourceTaskId: TaskId): void {

  const internalState = state.getInternalStateObject();

  entries(sentResources).forEach(([resourceType, nbResourcesToTransfer]) => {

    if (nbResourcesToTransfer && nbResourcesToTransfer > 0) {
		
		const matchingResources = internalState.resources.filter(res => res.currentLocation === sourceLocation && res.type === resourceType && ((sourceTaskId) ? res.currentActivity === +sourceTaskId: true));
		if (matchingResources.length >= nbResourcesToTransfer) {
			for (let i = 0; i < nbResourcesToTransfer; i++) {
				matchingResources[i]!.currentLocation = destinationLocation;
				matchingResources[i]!.currentActivity = getIdleTaskUid(state); //remove activity while moving to another location
			}

		} else {
			resourceLogger.error(`trying to transfer ${nbResourcesToTransfer} resources but has only ${matchingResources.length}`);
		}

    } else {
      resourceLogger.error(`trying to transfer ${nbResourcesToTransfer} resources `);
    }
  });
}

/**
 * @returns The number of resources that are currently without activity and of the given type in a specified location
 * 
 */
export function getResourcesAvailableByLocation(state: Readonly<MainSimulationState>, location: LOCATION_ENUM, resourceType: ResourceType): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(res =>
    res.currentLocation === location
    && res.type === resourceType
    && res.currentActivity == getIdleTaskUid(state));
}

/**
 * @returns The resources of the given kind and allocated to the given task and location
 */
export function getAllocatedResourcesByTypeAndLocation(state: Readonly<MainSimulationState>, taskId: TaskId, resourceType: ResourceType, location: LOCATION_ENUM,): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res =>
  	res.currentLocation === location
    && res.type === resourceType
    && ((taskId) ? res.currentActivity === taskId : true));
}

/**
 * @returns checks whether the requested resources are available in a specific location
 */
export function enoughResourcesOfAllTypes(state: Readonly<MainSimulationState>, taskId: TaskId, resources: ResourceTypeAndNumber, location: LOCATION_ENUM,): boolean {
	let enoughResources = true;
	entries(resources).forEach(([resourceType, nbResourcesToTransfer]) => {
		if (nbResourcesToTransfer && nbResourcesToTransfer > 0) {
			if (nbResourcesToTransfer > getAllocatedResourcesByTypeAndLocation(state, taskId, resourceType, location).length){
                enoughResources = false;
			}
		}
	});
	return enoughResources;
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
 * @returns The resources owned by the given actor and allocated to any task
 */
export function getResourcesAllocatedToAnyTaskForActor(state: Readonly<MainSimulationState>, actorId: ActorId): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(res =>
		res.currentActivity !== getIdleTaskUid(state));
}

/**
 * @returns The resources of the given kind, owned by the given actor and without current activity
 */
export function getAvailableResources(state: Readonly<MainSimulationState>, type: ResourceType): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res =>
    res.type === type
    && res.currentActivity == getIdleTaskUid(state));
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

/**
 * @returns The resources allocated to the given task
 */
export function getAllocatedResourcesAnyKind(state: Readonly<MainSimulationState>, taskId: TaskId): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res => res.currentActivity === taskId);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world - old
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Add resources to a location.
 */
export function addIncomingResourcesToLocation(state: MainSimulationState, resourceType: ResourceType, resourceLocation: LOCATION_ENUM, amount: number): void {
  const internalState = state.getInternalStateObject();

  for (let i = 0; i < amount; i++) {
	const r = new Resource(resourceType, resourceLocation, getIdleTaskUid(state));
	internalState.resources.push(r);
  }
}

export function getInStateHumanResourcesByLocation(state: Readonly<MainSimulationState>, location: LOCATION_ENUM): Resource[] {
	return state.getInternalStateObject().resources.filter(
		resource => resource.currentLocation === location &&
			Object.values(HumanResourceTypeArray).some(type => type === resource.type),
	);
}

export function getInStateCountResourcesByLocationAndTaskInProgressAndType(state: Readonly<MainSimulationState>, location: LOCATION_ENUM, taskId: TaskId): Partial<Record<ResourceType, number>> {
	let resByType: Partial<Record<ResourceType, number>> = {};
	state.getInternalStateObject().resources.filter(resource => resource.currentLocation === location && resource.currentActivity === taskId).map(resource => {
		if(resByType[resource.type])
			resByType[resource.type] = resByType[resource.type]! + 1; 
		else
			resByType[resource.type] = 1;
	});
	return resByType;
}

export function getInStateCountInactiveResourcesByLocationAndType(state: Readonly<MainSimulationState>, location: LOCATION_ENUM): Partial<Record<ResourceType, number>> {
	return getInStateCountResourcesByLocationAndTaskInProgressAndType(state, location, getIdleTaskUid(state));
}

/**
 * Allocate resources to a task.
 */
export function allocateResourcesToTask(state: MainSimulationState, taskId : TaskId, actorId: ActorId, sourceLocation: LOCATION_ENUM, resourceType: ResourceType, nb: number): void {
  const available = getResourcesAvailableByLocation(state, sourceLocation, resourceType);

  if (available.length < nb) {
    taskLogger.error("try to allocate too many resources (" + nb + ") of type " + resourceType
      + " for task " + taskId + " and actor " + actorId);
    return;
  }

  for (let i = 0; i < nb && i < available.length; i++) {
    available[i]!.currentActivity = taskId;
	//available[i]!.currentLocation = sourceLocation;
  }
}

/**
 * Release (deallocate) resources from a task.
 */
export function releaseResourcesFromTask(state: MainSimulationState, taskId: TaskId, resourceType: ResourceType, nb: number): void {

  const atDisposal = getResourcesAllocatedToTaskOfType(state, taskId, resourceType);

  if (atDisposal.length < nb) {
    taskLogger.error("try to release too many resources (" + nb + ") of type " + resourceType
      + " of task " + taskId);
    return;
  }

  for (let i = 0; i < nb && i < atDisposal.length; i++) {
    atDisposal[i]!.currentActivity = getIdleTaskUid(state);
	//get task responsible actor symbolic location
	atDisposal[i]!.currentLocation = getTaskResponsibleActorSymbolicLocation(state, taskId);
  }
}

/**
 * Release (deallocate) all resources from a task.
 */
export function releaseAllResourcesFromTask(state: MainSimulationState, taskId: TaskId): void {
  const atDisposal = getResourcesAllocatedToTask(state, taskId);

  for (const resource of atDisposal) {
    resource.currentActivity = getIdleTaskUid(state);
	//get task responsible actor symbolic location
	resource.currentLocation = getTaskResponsibleActorSymbolicLocation(state, taskId);
  }
}
