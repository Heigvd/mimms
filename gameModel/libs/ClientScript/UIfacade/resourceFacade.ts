import { HumanResourceTypeArray, ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getResourcesByTypeLocationAndTask } from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { getSelectedActorLocation } from './actorFacade';

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
    return getResourcesByTypeLocationAndTask(
      getCurrentState(),
      resourceType,
      location,
      taskId
    ).length.toString();
  }
}

/**
 * Only use this method inside the resource allocation interface
 */
export function updateResourceValues(stateKey: string, value: string): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey][stateKey] = value;
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

/**
 * Hack to get the actor current location when dealing with location panel else the selected location
 */
// TODO better ! Absolutely awful but working
export function getAllocateResourcesCurrentLocation(): LOCATION_ENUM | undefined {
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    return getSelectedActorLocation() || LOCATION_ENUM.meetingPoint;
  }

  const paramKey = getStateKeyForResource();
  return Context.interfaceState.state.resources[paramKey].currentLocation;
}
