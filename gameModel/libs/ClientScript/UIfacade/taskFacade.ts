import { ActorId, TaskId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import * as TaskLogic from '../game/common/tasks/taskLogic';
import { getCurrentState } from '../game/mainSimulationLogic';

// used in page 67
export function getSourceTaskChoices(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined,
  radioComm: boolean
): { label: string; value: string }[] {
  // FIXME Do we need to restrict the tasks to now available for the actor ?
  if (location === undefined) {
    return [];
  }

  return TaskState.fetchTaskChoicesForActorAndLocation(
    getCurrentState(),
    actorId,
    location,
    radioComm
  ).map(task => {
    return { label: task.getTitle(), value: '' + task.Uid };
  });
}

export function getSourceTaskChoicesCount(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined,
  radioComm: boolean
): number {
  return getSourceTaskChoices(actorId, location, radioComm).length;
}

// used in page 67
export function getTargetTaskChoices(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined
): { label: string; value: string }[] {
  // FIXME Is it too restrictive to restrict the tasks to now available ?
  if (location === undefined) {
    return [];
  }
  return TaskState.fetchAvailableStandardTasksForActorAndLocation(
    getCurrentState(),
    actorId,
    location
  ).map(task => {
    return { label: task.getTitle(), value: '' + task.Uid };
  });
}

export function getIdleTaskUid(): TaskId {
  return TaskLogic.getIdleTaskUid(getCurrentState());
}
