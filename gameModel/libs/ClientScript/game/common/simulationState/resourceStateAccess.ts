import { entries } from '../../../tools/helper';
import { mainSimStateLogger, resourceLogger } from '../../../tools/logger';
import { ActionId, ResourceId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { ResourceType, ResourceTypeAndNumber, isHuman } from '../resources/resourceType';
import { getIdleTaskUid } from '../tasks/taskLogic';
import { LOCATION_ENUM } from './locationState';
import { MainSimulationState } from './mainSimulationState';

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

  const matchingResources: Resource[] = internalState.resources.filter(
    (resource: Resource) => resource.Uid === resourceId
  );

  if (matchingResources.length === 0) {
    // should never happen, but whenever, we have a log
    mainSimStateLogger.error('No resource matches id : ' + resourceId);
  }

  if (matchingResources.length > 1) {
    // should never happen, but whenever, we have a log
    mainSimStateLogger.error(
      'Error in data : there must not be 2 resources with same id : ' + resourceId
    );
  }

  return matchingResources[0]!;
}

export function getResourcesByTypeAndLocation(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType,
  location: LOCATION_ENUM
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      resource => resource.type === resourceType && resource.currentLocation === location
    );
}

export function getResourcesByTask(
  state: Readonly<MainSimulationState>,
  taskId: TaskId
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter((resource: Resource) => resource.currentActivity === taskId);
}

export function getHumanResourcesByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(resource => isHuman(resource.type) && resource.currentLocation === location);
}

export function getFreeResourcesByTypeLocationAndTask(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType,
  location: LOCATION_ENUM,
  taskId: TaskId
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      (resource: Resource) =>
        !resource.isReserved() &&
        resource.type === resourceType &&
        resource.currentLocation === location &&
        resource.currentActivity === taskId
    );
}

export function getFreeResourcesByTypeAndLocation(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType,
  location: LOCATION_ENUM
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      (resource: Resource) =>
        !resource.isReserved() &&
        resource.type === resourceType &&
        resource.currentLocation === location
    );
}

export function getFreeResourcesByTask(
  state: Readonly<MainSimulationState>,
  taskId: TaskId
): Readonly<Resource>[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      (resource: Resource) => !resource.isReserved() && resource.currentActivity === taskId
    );
}

export function getFreeHumanResourcesByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      (resource: Resource) =>
        !resource.isReserved() && isHuman(resource.type) && resource.currentLocation === location
    );
}

export function getFreeWaitingResourcesByTypeAndLocation(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType,
  location: LOCATION_ENUM
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    (resource: Resource) =>
      !resource.isReserved() &&
      resource.type === resourceType &&
      resource.currentLocation === location &&
      resource.currentActivity == getIdleTaskUid(state)
  );
}

export function getFreeWaitingResourcesByType(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    (resource: Resource) =>
      !resource.isReserved() &&
      resource.type === resourceType &&
      resource.currentActivity == getIdleTaskUid(state)
  );
}

export function getFreeWaitingResourcesByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    (resource: Resource) =>
      !resource.isReserved() &&
      resource.currentLocation === location &&
      resource.currentActivity == getIdleTaskUid(state)
  );
}

export function getFreeWaitingHumanResources(state: Readonly<MainSimulationState>): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter(
    (resource: Resource) =>
      !resource.isReserved() &&
      isHuman(resource.type) &&
      resource.currentActivity == getIdleTaskUid(state)
  );
}

export function getFreeResourcesByNumberTypeLocationAndTask(
  state: Readonly<MainSimulationState>,
  sentResources: ResourceTypeAndNumber,
  sourceLocation: LOCATION_ENUM,
  sourceTaskId: TaskId
): Resource[] {
  let resources: Resource[] = [];

  entries(sentResources).forEach(([resourceType, nbResourcesNeeded]) => {
    if (nbResourcesNeeded && nbResourcesNeeded > 0) {
      const matchingResources: Resource[] = getFreeResourcesByTypeLocationAndTask(
        state,
        resourceType,
        sourceLocation,
        sourceTaskId
      );

      const nbResourcesInvolved: number = Math.min(nbResourcesNeeded, matchingResources.length);

      if (nbResourcesInvolved > 0) {
        const involvedResources: Resource[] = matchingResources.slice(0, nbResourcesInvolved);

        resources = [...resources, ...involvedResources];
      }
    }
  });

  return [...resources];
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function addIncomingResources(
  state: MainSimulationState,
  resourceType: ResourceType,
  amount: number,
  location: LOCATION_ENUM
): void {
  const internalState = state.getInternalStateObject();

  for (let i = 0; i < amount; i++) {
    const resource: Resource = new Resource(resourceType, location, getIdleTaskUid(state));
    internalState.resources.push(resource);
  }
}

export function reserveResources(
  state: MainSimulationState,
  resourcesId: ResourceId[],
  actionId: ActionId // The action that reserve the resources for its execution
): void {
  resourcesId.forEach((resourceId: ResourceId) => {
    getResourceById(state, resourceId).reserve(actionId);
  });
}

export function unReserveResources(state: MainSimulationState, resourcesId: ResourceId[]): void {
  resourcesId.forEach((resourceId: ResourceId) => {
    getResourceById(state, resourceId).unReserve();
  });
}

export function sendResourcesToLocation(
  resources: Resource[],
  targetLocation: LOCATION_ENUM
): void {
  resources.forEach((resource: Resource) => {
    resource.currentLocation = targetLocation;
  });
}

export function assignResourcesToTask(
  state: MainSimulationState,
  resourcesId: ResourceId[],
  taskId: TaskId
): void {
  resourcesId.forEach((resourceId: ResourceId) => {
    getResourceById(state, resourceId).currentActivity = +taskId;
  });
}

export function deleteResource(state: MainSimulationState, resourceId: ResourceId): void {
  const internalState = state.getInternalStateObject();

  const resource: Resource = getResourceById(state, resourceId);

  if (resource != undefined) {
    internalState.resources.splice(internalState.resources.indexOf(resource), 1);
  } else {
    resourceLogger.error(`No resource found to delete with id ${resourceId}`);
  }
}
