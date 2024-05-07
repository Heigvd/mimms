/**
 * All UX interactions related to resources and tasks should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActorId } from '../game/common/baseTypes';
import { TaskBase } from '../game/common/tasks/taskBase';
import { getCurrentState } from '../game/mainSimulationLogic';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the tasks that can be performed currently by resources owned by the given actor.
 *
 * @param actorId The actor who can allocate resource to those tasks // Deprecated, should be location instead !
 *
 * @returns array of matching tasks
 */
export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  return TaskState.fetchAvailableTasks(getCurrentState(), actorId);
}

export function getAvailableTasksByLocation(
  actorId: ActorId,
  location: LOCATION_ENUM
): Readonly<TaskBase>[] {
  return TaskState.fetchAvailableTasksByLocation(getCurrentState(), actorId, location);
}

export function getTasksWithResources(actorId: ActorId): Readonly<TaskBase>[] {
  return TaskState.fetchTasksWithResources(getCurrentState(), actorId);
}
