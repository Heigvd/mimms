import { TaskId } from "../game/common/baseTypes";
import { Resource } from "../game/common/resources/resource";
import { ResourcesArray, ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from "../game/common/simulationState/locationState";
import {
	getInStateAmbulancesByLocation,
	getInStateCountInactiveResourcesByLocationAndType,
	getInStateCountResourcesByLocationAndTaskInProgressAndType,
	getInStateHelicoptersByLocation,
	getInStateHumanResourcesByLocation,
} from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from "../game/mainSimulationLogic";

export function getHumanResourcesByLocation(location: LOCATION_ENUM): Resource[] {
	return getInStateHumanResourcesByLocation(getCurrentState(), location);
}

export function getAmbulancesByLocation(location: LOCATION_ENUM): Resource[]  {
	return getInStateAmbulancesByLocation(getCurrentState(), location);
}

export function getHelicoptersByLocation(location: LOCATION_ENUM): Resource[]  {
	return getInStateHelicoptersByLocation(getCurrentState(), location);
}

function getCountInactiveResourcesByLocationAndType(location: LOCATION_ENUM): Partial<Record<ResourceType, number>> {
  return getInStateCountInactiveResourcesByLocationAndType(getCurrentState(), ResourcesArray, location);
}

function getCountResourcesByLocationAndTaskInProgressAndType(location: LOCATION_ENUM, taskId: TaskId): Partial<Record<ResourceType, number>> {
  return getInStateCountResourcesByLocationAndTaskInProgressAndType(getCurrentState(), ResourcesArray, location, taskId);
}

export function getCountAvailableResourcesToAllocate(location : LOCATION_ENUM, taskId: number, resourceType: ResourceType) {
	if (taskId === 0) {
		return (getCountInactiveResourcesByLocationAndType(location)[resourceType] || 0).toString();
	} else {
		return (getCountResourcesByLocationAndTaskInProgressAndType(location, taskId)[resourceType] || 0).toString();
	}
}