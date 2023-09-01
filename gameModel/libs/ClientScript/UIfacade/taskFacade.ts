/**
 * All UX interactions related to tasks should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ActorId, TaskId } from "../game/common/baseTypes";
import { ChangeNbResourcesLocalEvent, TaskAllocationLocalEvent } from "../game/common/localEvents/localEventBase";
import { localEventManager } from "../game/common/localEvents/localEventManager";
import { ResourceType } from "../game/common/resources/resourcePool";
import { TaskBase } from "../game/common/tasks/taskBase";
import { buildAndLaunchResourceAllocation, fetchAvailableTasks, getCurrentState } from "../game/mainSimulationLogic";

export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  return fetchAvailableTasks(actorId);
}

export async function fakeTaskAllocation(taskId: TaskId, actorId: ActorId, type: ResourceType, nbResources: number): Promise<IManagedResponse | undefined> {
  const currentSimTime = getCurrentState().getSimTime();

  // temporary cheat
  localEventManager.queueLocalEvent(new ChangeNbResourcesLocalEvent(0, currentSimTime, actorId, type, -nbResources));
  localEventManager.queueLocalEvent(new TaskAllocationLocalEvent(0, currentSimTime, taskId, nbResources));

  return await buildAndLaunchResourceAllocation(taskId, actorId, nbResources);
}

export async function allocateResource(taskId: TaskId, actorId: ActorId, nbResources: number): Promise<IManagedResponse | undefined> {

  return await buildAndLaunchResourceAllocation(taskId, actorId, nbResources);
}
