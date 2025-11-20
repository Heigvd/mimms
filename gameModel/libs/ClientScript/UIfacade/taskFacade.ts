import { ActorId, TaskId } from '../game/common/baseTypes';
import { CommMedia } from '../game/common/resources/resourceReachLogic';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { TaskType } from '../game/common/tasks/taskBase';
import { getActiveMapEntityDescriptors } from '../game/loaders/mapEntitiesLoader';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { getLocationTranslation } from '../UIfacade/locationFacade';

export function getCommMedia() {
  return getTypedInterfaceState().selectedPanel === SelectedPanel.radios
    ? CommMedia.Radio
    : CommMedia.Direct;
}

// used in page 67
export function getResourceManagementSourceTaskChoices(
  actorId: ActorId | undefined,
  location: LOCATION_ENUM | undefined,
  commMedia?: CommMedia
): { label: string; value: string }[] {
  if (actorId === undefined || location === undefined) {
    return [];
  }

  const effectiveCommMedia = commMedia ?? getCommMedia();

  return TaskState.fetchReachableTasks(
    getCurrentState(),
    actorId,
    location,
    effectiveCommMedia
  ).map(task => {
    return { label: task.getTitle(), value: '' + task.Uid };
  });
}

export function initResourceManagementCurrentTaskId(
  actorId: ActorId | undefined,
  location: LOCATION_ENUM | undefined,
  commMedia?: CommMedia
): TaskId | undefined {
  const choices = getResourceManagementSourceTaskChoices(actorId, location, commMedia);
  if (choices.length === 1) {
    return +choices[0]!.value;
  }
  return undefined;
}

// used in page 67
export function getResourceManagementTargetTaskChoices(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined
): { label: string; value: string }[] {
  if (location === undefined) {
    return [];
  }

  return TaskState.fetchAvailableStandardTasks(getCurrentState(), actorId, location).map(task => {
    return { label: task.getTitle(), value: '' + task.Uid };
  });
}

export function initResourceManagementTargetTaskId(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined
): TaskId | undefined {
  const choices = getResourceManagementTargetTaskChoices(actorId, location);
  if (choices.length === 1) {
    return +choices[0]!.value;
  }
  return undefined;
}

// used in page 68
export function getLocationChoicesForTaskType(
  taskType: TaskType
): { label: string; value: string }[] {
  const locations = TaskState.getLocationsByTaskType(getCurrentState(), taskType);

  return Object.values(getActiveMapEntityDescriptors())
    .filter(descriptor => locations.includes(descriptor.binding))
    .map(location => {
      return {
        label: getLocationTranslation(location.binding),
        value: location.binding,
      };
    });
}
