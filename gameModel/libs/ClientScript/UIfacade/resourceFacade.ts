import { TaskId } from '../game/common/baseTypes';
import { Resource } from '../game/common/resources/resource';
import { ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import {
  getInStateCountInactiveResourcesByLocationAndType,
  getInStateCountResourcesByLocationAndTaskInProgressAndType,
  getInStateHumanResourcesByLocation,
} from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';

export function getHumanResourcesByLocation(location: LOCATION_ENUM): Resource[] {
  return getInStateHumanResourcesByLocation(getCurrentState(), location);
}

function getCountInactiveResourcesByLocationAndType(
  location: LOCATION_ENUM
): Partial<Record<ResourceType, number>> {
  return getInStateCountInactiveResourcesByLocationAndType(getCurrentState(), location);
}

function getCountResourcesByLocationAndTaskInProgressAndType(
  location: LOCATION_ENUM,
  taskId: TaskId
): Partial<Record<ResourceType, number>> {
  return getInStateCountResourcesByLocationAndTaskInProgressAndType(
    getCurrentState(),
    location,
    taskId
  );
}

export function getCountAvailableResourcesToAllocate(
  location: LOCATION_ENUM,
  taskId: number,
  resourceType: ResourceType
) {
  if (taskId === 0) {
    return (getCountInactiveResourcesByLocationAndType(location)[resourceType] || 0).toString();
  } else {
    return (
      getCountResourcesByLocationAndTaskInProgressAndType(location, taskId)[resourceType] || 0
    ).toString();
  }
}
