/**
 * All UX interactions related to tasks should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ActorId, TaskId } from "../game/common/baseTypes";
import { ResourceType } from "../game/common/resources/resourcePool";
import { TaskBase } from "../game/common/tasks/taskBase";
import { buildAndLaunchResourceAllocation, fetchAvailableTasks } from "../game/mainSimulationLogic";

export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  return fetchAvailableTasks(actorId);
}

export async function allocateResource(taskId: TaskId, actorId: ActorId, _type: ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
  return await buildAndLaunchResourceAllocation(taskId, actorId, nbResources);
}
