import { TaskId } from "../game/common/baseTypes";
import { Resource } from "../game/common/resources/resource";
import { ResourceType } from "../game/common/resources/resourceType";
import { LOCATION_ENUM } from "../game/common/simulationState/locationState";
import { getInStateCountInactiveResourcesByLocationAndType, getInStateCountResourcesByLocationAndTaskInProgressAndType, getInStateHumanResourcesByLocation } from "../game/common/simulationState/resourceStateAccess";
import { getCurrentState } from "../game/mainSimulationLogic";

export function getHumanResourcesByLocation(location: LOCATION_ENUM): Resource[] {
	return getInStateHumanResourcesByLocation(getCurrentState(), location);
}

export function getCountInactiveResourcesByLocationAndType(location: LOCATION_ENUM): Partial<Record<ResourceType, number>> {
	return getInStateCountInactiveResourcesByLocationAndType(getCurrentState(), location);
}

export function getCountResourcesByLocationAndTaskInProgressAndType(location: LOCATION_ENUM, taskId: TaskId): Partial<Record<ResourceType, number>> {
	return getInStateCountResourcesByLocationAndTaskInProgressAndType(getCurrentState(), location, taskId);
}