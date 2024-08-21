import { hasContainerOfType } from '../game/common/resources/emergencyDepartment';
import {
  ResourceContainerType,
  ResourceContainerTypeArray,
  UniqueResourceTypeMap,
} from '../game/common/resources/resourceContainer';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';

export function isContainerTypeAvailable(type: ResourceContainerType): boolean {
  return hasContainerOfType(getCurrentState(), type);
}

/**
 * Fetches all the available types of ressources, filtered by uniqueness
 */
export function getFilteredResourceContainerTypeArray(
  unique: boolean
): { type: ResourceContainerType }[] {
  return ResourceContainerTypeArray.filter(t => UniqueResourceTypeMap[t] === unique).map(t => {
    return { type: t };
  });
}

export function getRequestValue<T extends boolean | number>(type: ResourceContainerType): T {
  const state = getTypedInterfaceState();
  const value = state.resources.requestedResources[type] || 0;
  if (UniqueResourceTypeMap[type]) {
    return (value > 0) as T;
  }
  return value as T;
}

export function updateRequestValue(type: ResourceContainerType, value: boolean | number): void {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources.requestedResources[type] = +value;
  Context.interfaceState.setState(newState);
}
