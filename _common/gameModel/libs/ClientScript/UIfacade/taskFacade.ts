import { ActorId, TaskId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { TaskType } from '../game/common/tasks/taskBase';
import * as TaskLogic from '../game/common/tasks/taskLogic';
import { getActiveMapEntityDescriptors } from '../game/loaders/mapEntitiesLoader';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getLocationTranslation } from './locationFacade';

/**
 * @returns The tasks an actor can act on at a location, as drop down choices
 */
function getTaskChoices(
  actorId: ActorId,
  location: LOCATION_ENUM
): { label: string; value: string }[] {
  return TaskState.fetchAvailableTasks(getCurrentState(), actorId, location).map(task => {
    return { label: task.getTitle(), value: '' + task.Uid };
  });
}

// used in page 67
export function getResourceManagementSourceTaskChoices(
  actorId: ActorId | undefined,
  location: LOCATION_ENUM | undefined
): { label: string; value: string }[] {
  if (actorId === undefined || location === undefined) {
    return [];
  }

  return getTaskChoices(actorId, location);
}

export function initResourceManagementCurrentTaskId(
  actorId: ActorId | undefined,
  location: LOCATION_ENUM | undefined
): TaskId | undefined {
  const choices = getResourceManagementSourceTaskChoices(actorId, location);
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

  return getTaskChoices(actorId, location);
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

export function getTasksForLocation(location: LOCATION_ENUM): { Uid: TaskId; title: string }[] {
  const state = getCurrentState();
  const travelingTaskId = TaskLogic.getMoveToTaskUid(state, location);

  return TaskState.getAllTasks(state)
    .filter(task => task.location === location && task.Uid !== travelingTaskId)
    .map(task => ({ Uid: task.Uid, title: task.getTitle() }));
}
