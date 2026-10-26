import { TaskId } from '../game/common/baseTypes';
import { CommMedia } from '../game/common/radio/communicationType';
import { HumanResourceTypeArray, ResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getResourcesByTask } from '../game/common/simulationState/resourceStateAccess';
import * as TaskLogic from '../game/common/tasks/taskLogic';
import { getCurrentState } from '../game/mainSimulationLogic';
import {
  getTypedInterfaceState,
  ResourcesManagementActivityType,
  setInterfaceState,
} from '../gameInterface/interfaceState';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { isPCFrontBuilt } from './actionFacade';
import { isCurrentActorAtLocation } from './actorFacade';

// used in page 68
export function getSelectedActivityType(): ResourcesManagementActivityType | undefined {
  return getTypedInterfaceState().resourcesManagement.activityType;
}

export function setActivityType(activityType: ResourcesManagementActivityType | undefined): void {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resourcesManagement.activityType = activityType;
  Context.interfaceState.setState(newState);
}

/**
 * If not yet selected, select it.
 * If already selected, unselect it.
 */
// used in page 68
export function toggleSelectedActivityType(activityType: ResourcesManagementActivityType): void {
  let newActivityType: ResourcesManagementActivityType | undefined = activityType;

  // if already selected, unselect it.
  if (getSelectedActivityType() === activityType) {
    newActivityType = undefined;
  }

  setActivityType(newActivityType);
}

// used in page 43
export function getHumanResourceTypes(): readonly ResourceType[] {
  return HumanResourceTypeArray;
}

// used in page 43
/** Open the panel to talk to resources directly (without radio) */
export function openDirectResourceManagement(location: LOCATION_ENUM): void {
  if (isPCFrontBuilt() && isCurrentActorAtLocation(location)) {
    setInterfaceState({ selectedPanel: SelectedPanel.resources });
  }
}

/** Open the Resources Management modal (see page 43) */
export function openResourcesManagementModal(): void {
  const direct = isCurrentActorAtLocation(Context.overlayItem.id);
  setInterfaceState({
    showResourcesManagementModal: true,
    resourceManagementSourceLocation: Context.overlayItem.id,
    resourceManagementCommMedia: direct ? CommMedia.Direct : CommMedia.Radio,
  });
}

/** Close the Resources Management modal (see page 43) */
export function closeResourcesManagementModal(): void {
  setInterfaceState({
    showResourcesManagementModal: false,
    resourceManagementSourceLocation: undefined,
    resourceManagementCommMedia: undefined,
  });
}

/**
 * Counts resources of the given type currently assigned to the given task, physically present
 * at the given location (excludes resources still traveling there).
 */
export function getResourceCountForTaskAndType(
  taskId: TaskId,
  location: LOCATION_ENUM,
  resourceType: ResourceType
): number {
  const state = getCurrentState();
  const travelingTaskId = TaskLogic.getMoveToTaskUid(state, location);

  return getResourcesByTask(state, taskId).filter(
    resource =>
      resource.type === resourceType &&
      resource.currentLocation === location &&
      resource.currentActivity !== travelingTaskId
  ).length;
}
