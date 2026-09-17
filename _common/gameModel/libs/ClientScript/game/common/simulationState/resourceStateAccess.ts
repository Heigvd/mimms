import { mainSimStateLogger, resourceLogger } from '../../../tools/logger';
import { ResourceId, TaskId } from '../baseTypes';
import { Resource } from '../resources/resource';
import { ResourceType, isHuman } from '../resources/resourceType';
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

export function getResourcesByTypeLocationAndTask(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType,
  location: LOCATION_ENUM,
  taskId: TaskId
): Resource[] {
  return state
    .getInternalStateObject()
    .resources.filter(
      (resource: Resource) =>
        resource.type === resourceType &&
        resource.currentLocation === location &&
        resource.currentActivity === taskId
    );
}

/**
 * Gets the resources that wait for orders at the given location
 */
export function getWaitingResourcesByType(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType
): Resource[] {
  const internalState = state.getInternalStateObject();
  return internalState.resources.filter((resource: Resource) => {
    if (resource.type !== resourceType) {
      return false;
    }

    const idleTaskUid: TaskId | undefined = getIdleTaskUid(state, resource.currentLocation);

    return idleTaskUid != undefined && resource.currentActivity === idleTaskUid;
  });
}

export function getWaitingResourcesByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): Resource[] {
  const internalState = state.getInternalStateObject();
  const idleTaskUid: TaskId | undefined = getIdleTaskUid(state, location);

  if (idleTaskUid == undefined) {
    return [];
  }

  return internalState.resources.filter(
    (resource: Resource) => resource.currentActivity === idleTaskUid
  );
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
  const idleTaskUid: TaskId | undefined = getIdleTaskUid(state, location);

  if (idleTaskUid == undefined) {
    resourceLogger.error(
      `Resources cannot wait for orders at ${location}, so ${amount} ${resourceType} cannot arrive there`
    );
    return;
  }

  for (let i = 0; i < amount; i++) {
    const resource: Resource = new Resource(resourceType, location, idleTaskUid);
    internalState.resources.push(resource);
  }
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
    const resource: Resource = getResourceById(state, resourceId);

    resource.currentActivity = +taskId;
    // reset timer for new task
    resource.resetTimeCounters();
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
