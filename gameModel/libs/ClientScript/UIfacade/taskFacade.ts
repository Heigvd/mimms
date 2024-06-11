import { ActorId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';

// used in page 67
export function getSourceTaskChoices(
  actorId: ActorId,
  location: LOCATION_ENUM | undefined
): { label: string; value: string }[] {
  // FIXME Do we need to restrict the tasks to now available for the actor ?
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
