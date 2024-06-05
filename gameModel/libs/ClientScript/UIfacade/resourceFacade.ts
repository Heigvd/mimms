import { HumanResourceTypeArray, ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getResourcesForLocationTaskAndType } from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { SelectedPanel } from '../gameInterface/selectedPanel';

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

/**
 * Only use this method inside the resource allocation interface
 */
export function updateResourceValues(interfaceKey: string, stateKey: string): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey][stateKey] = Context[interfaceKey];
  Context.interfaceState.setState(newState);
}

/**
 * Only use this method inside the resource allocation interface
 */
export function updateResourceTypesValues(): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey][Context.resourceType.enum] = Context.resourceAllocationNbForType;
  Context.interfaceState.setState(newState);
}

/**
 * returns the key to store the state of a resource request
 * depending on the interface state
 */
export function getStateKeyForResource(): string {
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    return 'allocateResources';
  } else if (panel === SelectedPanel.radios) {
    return 'allocateResourcesRadio';
  }
  return '';
}
