import { HumanResourceTypeArray, ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getResourcesForLocationTaskAndType } from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';

// used in page 67
export function getHumanResourceTypes(): readonly ResourceType[] {
  return HumanResourceTypeArray;
}

// used in page 67
export function countAvailableResourcesToAllocate(
  location: LOCATION_ENUM | undefined,
  taskId: number | undefined,
  resourceType: ResourceType
) {
  if (location == undefined || taskId == undefined) {
    return '0';
  } else {
    return getResourcesForLocationTaskAndType(
      getCurrentState(),
      location,
      taskId,
      resourceType
    ).length.toString();
  }
}
