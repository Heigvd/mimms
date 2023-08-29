/**
 * All UX interactions related to tasks should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ActorId } from "../game/common/baseTypes";
import { TaskBase } from "../game/common/tasks/taskBase";
import { fetchAvailableTasks } from "../game/mainSimulationLogic";

export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  return fetchAvailableTasks(actorId);
}
