import { resourceLogger, taskLogger } from '../../../tools/logger';
import { ActorId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { MainSimulationState } from './mainSimulationState';
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { isManagedBy, ResourceGroup } from '../resources/resourceGroup';
import { entries } from '../../../tools/helper';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the unoccupied resources.
 *
 * @param state The state
 * @param ownerActorId The actor who owns the resources
 * @param resourceType The type of the resources
 *
 * @returns The matching resources
 */
export function getUnoccupiedResources(
	state: Readonly<MainSimulationState>,
	ownerActorId: ActorId,
	resourceType: ResourceType,
): Readonly<Resource>[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res =>
			isManagedBy(state, res, ownerActorId) &&
			res.type === resourceType &&
			res.currentActivity == null,
	);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function transferResourcesBetweenActors(
	state: MainSimulationState,
	senderActor: ActorId,
	receiverActor: ActorId,
	sentResources: ResourceTypeAndNumber,
): void {
	const internalState = state.getInternalStateObject();

	entries(sentResources).forEach(([resourceType, nbResourcesToTransfer]) => {
		if (nbResourcesToTransfer && nbResourcesToTransfer > 0) {
			const matchingResources = internalState.resources.filter(
				res => isManagedBy(state, res, senderActor) && res.type === resourceType,
			);

			const senderGroup = state.getResourceGroupByActorId(senderActor);
			const targetGroup = state.getResourceGroupByActorId(receiverActor);
			if (targetGroup && senderGroup) {
				if (matchingResources.length >= nbResourcesToTransfer) {
					for (let i = 0; i < nbResourcesToTransfer; i++) {
						const r = matchingResources[i]!;
						// first remove, then add. Otherwise we have problems transferring resource to ourselves
						senderGroup.removeResource(r);
						targetGroup.addResource(r);
					}
				} else {
					resourceLogger.error(
						`trying to transfer ${nbResourcesToTransfer} resources but has only ${matchingResources.length}`,
					);
				}
			} else {
				resourceLogger.error('actor id should have resource group', receiverActor);
			}
		} else {
			resourceLogger.error(`trying to transfer ${nbResourcesToTransfer} resources `);
		}
	});
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data - old
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * @returns The number of resources that are currently without activity, owned by the given actor and of the given type
 */
export function getResourcesAvailable(
	state: Readonly<MainSimulationState>,
	actorId: ActorId,
	resourceType: ResourceType,
): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res =>
			isManagedBy(state, res, actorId) && res.type === resourceType && res.currentActivity == null,
	);
}

/**
 * @returns The number of resources allocated to the given task
 */
export function getResourcesAllocatedToTask(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(res => res.currentActivity === taskId);
}

/**
 * @returns The number of resources allocated to the given task
 */
export function getResourcesAllocatedToTaskOfType(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
	resourceType: ResourceType,
): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res => res.currentActivity === taskId && res.type === resourceType,
	);
}

/**
 * @returns The number of resources allocated to the given task, owner by the given actor and of the given type
 */
export function getResourcesAllocatedToTaskForActor(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
	actorId: ActorId,
	resourceType: ResourceType,
): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res =>
			res.currentActivity === taskId &&
			isManagedBy(state, res, actorId) &&
			res.type === resourceType,
	);
}

/**
 * @returns The resources owned by the given actor and allocated to any task
 */
export function getResourcesAllocatedToAnyTaskForActor(
	state: Readonly<MainSimulationState>,
	actorId: ActorId,
): Resource[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res => res.currentActivity !== null && isManagedBy(state, res, actorId),
	);
}

/**
 * @returns The resources of the given kind, owned by the given actor and without current activity
 */
export function getAvailableResources(
	state: Readonly<MainSimulationState>,
	actorId: ActorId,
	type: ResourceType,
): Readonly<Resource>[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res => isManagedBy(state, res, actorId) && res.type === type && res.currentActivity == null,
	);
}

/**
 * @returns The resources of the given kind and allocated to the given task
 */
export function getAllocatedResources(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
	resourceType: ResourceType,
): Readonly<Resource>[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(
		res => res.type === resourceType && res.currentActivity === taskId,
	);
}

/**
 * @returns The resources allocated to the given task
 */
export function getAllocatedResourcesAnyKind(
	state: Readonly<MainSimulationState>,
	taskId: TaskId,
): Readonly<Resource>[] {
	const internalState = state.getInternalStateObject();

	return internalState.resources.filter(res => res.currentActivity === taskId);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world - old
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Add resources to an actor.
 */
export function addIncomingResourcesToActor(
	state: MainSimulationState,
	resourceGroup: ResourceGroup,
	resourceType: ResourceType,
	amount: number,
): void {
	const internalState = state.getInternalStateObject();

	for (let i = 0; i < amount; i++) {
		const r = new Resource(resourceType);
		resourceGroup.addResource(r);
		internalState.resources.push(r);
	}
}

/**
 * Allocate resources to a task.
 */
export function allocateResourcesToTask(
	state: MainSimulationState,
	taskId: TaskId,
	actorId: ActorId,
	resourceType: ResourceType,
	nb: number,
): void {
	const available = getResourcesAvailable(state, actorId, resourceType);

	if (available.length < nb) {
		taskLogger.error(
			'try to allocate too many resources (' +
				nb +
				') of type ' +
				resourceType +
				' for task ' +
				taskId +
				' and actor ' +
				actorId,
		);
		return;
	}

	for (let i = 0; i < nb && i < available.length; i++) {
		available[i]!.currentActivity = taskId;
	}
}

/**
 * Release (deallocate) resources from a task.
 */
export function releaseResourcesFromTask(
	state: MainSimulationState,
	taskId: TaskId,
	actorId: ActorId,
	resourceType: ResourceType,
	nb: number,
): void {
	const atDisposal = getResourcesAllocatedToTaskForActor(state, taskId, actorId, resourceType);

	if (atDisposal.length < nb) {
		taskLogger.error(
			'try to release too many resources (' +
				nb +
				') of type ' +
				resourceType +
				' of task ' +
				taskId +
				' for actor ' +
				actorId,
		);
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
