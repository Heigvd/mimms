import {
  HumanResourceTypeArray,
  ResourcesArray,
  ResourceType,
} from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getFreeResourcesByTypeLocationAndTask } from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { isGodView } from '../gameInterface/interfaceConfiguration';
import { canPlanAction } from '../gameInterface/main';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { canViewLocation } from '../gameMap/mapEntities';
import { getSelectedActorLocation } from './actorFacade';
import { getIdleTaskUid } from './taskFacade';

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
  if (
    location == undefined ||
    taskId == undefined ||
    (!isGodView() && !canViewLocation(location))
  ) {
    return '0';
  } else {
    return getFreeResourcesByTypeLocationAndTask(
      getCurrentState(),
      resourceType,
      location,
      taskId
    ).length.toString();
  }
}

export function updateResourceValues(stateKey: string, value: string): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey][stateKey] = value;
  Context.interfaceState.setState(newState);
}

export function updateCurrentLocation(value: string): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey]['currentLocation'] = value;
  newState.resources[paramKey]['currentTaskId'] = getIdleTaskUid();
  Context.interfaceState.setState(newState);
}

export function updateTargetDestination(value: string): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey]['targetLocation'] = value;
  newState.resources[paramKey]['targetTaskId'] = undefined; // reset task
  Context.interfaceState.setState(newState);
}

export function updateResourceTypesValues(): void {
  const paramKey = getStateKeyForResource();
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey][Context.resourceType.enum] = Context.resourceAllocationNbForType;
  Context.interfaceState.setState(newState);
}

/**
 * returns the key to store the state of a resource request
 * depending on the interface state
 * TODO improvement: return the subreference directly (return Context.....[paramKey]), change in pages too
 */
export function getStateKeyForResource(): string {
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    return 'allocateResources';
  } else if (panel === SelectedPanel.radios) {
    return 'allocateResourcesRadio';
  }
  // code is sometimes called when in 'action' panel
  return 'allocateResourcesRadio';
}

/**
 * Hack to get the actor current location when dealing with location panel else the selected location
 */
// TODO better ! Absolutely awful but working
export function getAllocateResourcesCurrentLocation(): LOCATION_ENUM | undefined {
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    return getSelectedActorLocation() || LOCATION_ENUM.pcFront;
  }

  const paramKey = getStateKeyForResource();
  return Context.interfaceState.state.resources[paramKey].currentLocation;
}

export function isOrderValidationDisabled(): boolean {
  if (!canPlanAction()) {
    // to be able to cancel the action
    return false;
  }

  const key = getStateKeyForResource();
  const params = Context.interfaceState.state.resources[key];
  if (
    getAllocateResourcesCurrentLocation() == params.targetLocation &&
    params.currentTaskId == params.targetTaskId
  ) {
    // disable if same locations and actions
    return true;
  }

  if (Object.values(params).some(p => p === undefined || p === '')) {
    // disable if any param is unset
    return true;
  }

  let nbResourcesRequested = 0;
  ResourcesArray.forEach(resourceType => {
    nbResourcesRequested += params[resourceType];
  });
  // disable when 0 resources requested
  return nbResourcesRequested === 0;
}

export function isPretriageReportRequestDisabled(): boolean {
  if (!canPlanAction()) {
    // to be able to cancel the action
    return false;
  }
  return (
    Context.interfaceState.state.resourcesManagement.pretriageReportRequestLocation === undefined
  );
}
