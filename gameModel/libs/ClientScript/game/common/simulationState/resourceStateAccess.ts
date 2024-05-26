import { entries } from '../../../tools/helper';
import { mainSimStateLogger, resourceLogger, taskLogger } from '../../../tools/logger';
import { ActorId, ResourceId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { isAHuman, ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { getIdleTaskUid } from '../tasks/taskLogic';
import { LOCATION_ENUM } from './locationState';
import { MainSimulationState } from './mainSimulationState';
import { getTaskResponsibleActorSymbolicLocation } from './taskStateAccess';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function getResourceById(
  state: Readonly<MainSimulationState>,
  resourceId: ResourceId
): Resource {
  const internalState = state.getInternalStateObject();

  const matchingResources = internalState.resources.filter(
    (resource: Resource) => resource.Uid === resourceId
  );

  if (matchingResources.length === 0 || matchingResources[0] == null) {
    mainSimStateLogger.error('No resource matches id : ' + resourceId);
  }

  if (matchingResources.length > 1) {
    mainSimStateLogger.error(
      'Error in data : there must not be 2 resources with same id : ' + resourceId
    );
  }

  return matchingResources[0]!;
}

export function getResourcesForLocationTaskAndType(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM,
  taskId: TaskId,
  resourceType: ResourceType
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      resource =>
        resource.currentLocation === location &&
        resource.currentActivity === taskId &&
        resource.type === resourceType
    );
}

export function getResourcesForLocationAndType(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM,
  resourceType: ResourceType
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      resource => resource.currentLocation === location && resource.type === resourceType
    );
}

/**
 * @returns The resources allocated to the given task
 */
export function getResourcesForTask(
  state: Readonly<MainSimulationState>,
  taskId: TaskId
): Readonly<Resource>[] {
  return state
    .getInternalStateObject()
    .resources.filter(resource => resource.currentActivity === taskId);
}

export function getHumanResourcesForLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(resource => resource.currentLocation === location && isAHuman(resource.type));
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the unoccupied resources.
 *
 * @param state The state
 * @param resourceType The type of the resources
 *
 * @returns The matching resources
 */
export function getUnoccupiedResources(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType
): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    res => res.type === resourceType && res.currentActivity == getIdleTaskUid(state)
  );
}

/**
 * @returns The number of resources that are currently without activity and of the given type in a specified location
 *
 */
export function getIdleResourcesForLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    res => res.currentLocation === location && res.currentActivity == getIdleTaskUid(state)
  );
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function transferResourcesFromToLocation(
  state: MainSimulationState,
  sourceLocation: LOCATION_ENUM,
  destinationLocation: LOCATION_ENUM,
  sentResources: ResourceTypeAndNumber,
  sourceTaskId: TaskId
): void {
  const internalState = state.getInternalStateObject();

  entries(sentResources).forEach(([resourceType, nbResourcesToTransfer]) => {
    if (nbResourcesToTransfer && nbResourcesToTransfer > 0) {
      const matchingResources = internalState.resources.filter(
        res =>
          res.currentLocation === sourceLocation &&
          res.type === resourceType &&
          (sourceTaskId ? res.currentActivity === +sourceTaskId : true)
      );
      if (matchingResources.length >= nbResourcesToTransfer) {
        for (let i = 0; i < nbResourcesToTransfer; i++) {
          matchingResources[i]!.currentLocation = destinationLocation;
          matchingResources[i]!.currentActivity = getIdleTaskUid(state); //remove activity while moving to another location
        }
      } else {
        resourceLogger.error(
          `trying to transfer ${nbResourcesToTransfer} resources but has only ${matchingResources.length}`
        );
      }
    } else {
      resourceLogger.error(`trying to transfer ${nbResourcesToTransfer} resources `);
    }
  });
}

export function sendResourcesToLocation(resources: Resource[], targetLocation: LOCATION_ENUM) {
  resources.forEach(resource => {
    resource.currentLocation = targetLocation;
  });
}

/**
 * @returns The number of resources that are currently without activity and of the given type in a specified location
 *
 */
export function getResourcesAvailableByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM,
  resourceType: ResourceType
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    res =>
      res.currentLocation === location &&
      res.type === resourceType &&
      res.currentActivity == getIdleTaskUid(state)
  );
}

/**
 * @returns The resources of the given kind and allocated to the given task and location
 */
export function getAllocatedResourcesByTypeAndLocation(
  state: Readonly<MainSimulationState>,
  taskId: TaskId,
  resourceType: ResourceType,
  location: LOCATION_ENUM
): Readonly<Resource>[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    res =>
      res.currentLocation === location &&
      res.type === resourceType &&
      (taskId ? res.currentActivity === +taskId : true)
  );
}

/**
 * @returns checks whether the requested resources are available in a specific location
 */
export function enoughResourcesOfAllTypes(
  state: Readonly<MainSimulationState>,
  taskId: TaskId,
  resources: ResourceTypeAndNumber,
  location: LOCATION_ENUM
): boolean {
  let enoughResources = true;
  entries(resources).forEach(([resourceType, nbResourcesToTransfer]) => {
    if (nbResourcesToTransfer && nbResourcesToTransfer > 0) {
      if (
        nbResourcesToTransfer >
        getAllocatedResourcesByTypeAndLocation(state, taskId, resourceType, location).length
      ) {
        enoughResources = false;
      }
    }
  });
  return enoughResources;
}

/**
 * @returns The number of resources allocated to the given task
 */
export function getResourcesAllocatedToTask(
  state: Readonly<MainSimulationState>,
  taskId: TaskId
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(res => res.currentActivity === taskId);
}

/**
 * @returns The resources owned by the given actor and allocated to any task
 */
export function getResourcesAllocatedToAnyTaskForActor(
  state: Readonly<MainSimulationState>,
  actorId: ActorId
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(res => res.currentActivity !== getIdleTaskUid(state));
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world - old
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Add resources to a location.
 */
export function addIncomingResourcesToLocation(
  state: MainSimulationState,
  resourceType: ResourceType,
  resourceLocation: LOCATION_ENUM,
  amount: number
): void {
  const internalState = state.getInternalStateObject();
  for (let i = 0; i < amount; i++) {
    const r = new Resource(resourceType, resourceLocation, getIdleTaskUid(state));
    internalState.resources.push(r);
  }
}

export function getInStateCountResourcesByLocationAndTaskInProgressAndType(
  state: Readonly<MainSimulationState>,
  types: Readonly<ResourceType[]>,
  location: LOCATION_ENUM,
  taskId: TaskId
): Partial<Record<ResourceType, number>> {
  const resByType: Partial<Record<ResourceType, number>> = {};
  state
    .getInternalStateObject()
    .resources.filter(
      resource =>
        types.some(type => type === resource.type) &&
        resource.currentLocation === location &&
        resource.currentActivity === taskId
    )
    .map(resource => {
      if (resByType[resource.type]) resByType[resource.type] = resByType[resource.type]! + 1;
      else resByType[resource.type] = 1;
    });
  return resByType;
}

export function getInStateCountInactiveResourcesByLocationAndType(
  state: Readonly<MainSimulationState>,
  types: Readonly<ResourceType[]>,
  location: LOCATION_ENUM
): Partial<Record<ResourceType, number>> {
  return getInStateCountResourcesByLocationAndTaskInProgressAndType(
    state,
    types,
    location,
    getIdleTaskUid(state)
  );
}

/**
 * Allocate resources to a task.
 */
export function allocateResourcesToTask(
  state: MainSimulationState,
  taskId: TaskId,
  sourceLocation: LOCATION_ENUM,
  resourceType: ResourceType,
  nb: number
): void {
  const available = getResourcesAvailableByLocation(state, sourceLocation, resourceType);

  if (available.length < nb) {
    taskLogger.error(
      'try to allocate too many resources (' +
        nb +
        ') of type ' +
        resourceType +
        ' for task ' +
        taskId
    );
    return;
  }

  for (let i = 0; i < nb && i < available.length; i++) {
    available[i]!.currentActivity = taskId;
  }
}

export function allocateResourceToTask(
  state: MainSimulationState,
  resourceId: ResourceId,
  taskId: TaskId
): void {
  const resource = getResourceById(state, resourceId);
  resource.currentActivity = taskId;
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

/**
 * Delete one idle resource
 */
export function deleteIdleResource(
  state: MainSimulationState,
  location: LOCATION_ENUM,
  resourceType: ResourceType
): void {
  const atDisposal: Resource[] = getResourcesAvailableByLocation(state, location, resourceType);
  const internalState = state.getInternalStateObject();

  const theWinner = atDisposal[0];
  if (theWinner == undefined) {
    taskLogger.error(
      `No idle resource found to delete for location ${location} and resourceType ${resourceType}`
    );
  } else {
    internalState.resources.splice(internalState.resources.indexOf(theWinner), 1);
  }
}
