/**
 * All UX interactions related to tasks should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ActorId } from "../game/common/baseTypes";
import { ChangeNbResourcesLocalEvent, TaskAllocationLocalEvent } from "../game/common/localEvents/localEventBase";
import { localEventManager } from "../game/common/localEvents/localEventManager";
import { TaskBase } from "../game/common/tasks/taskBase";
import { fetchAvailableTasks, getCurrentState } from "../game/mainSimulationLogic";

export function getAvailableTasks(actorId: ActorId): Readonly<TaskBase>[] {
  return fetchAvailableTasks(actorId);
}

export function fakeTaskAllocation(nbResources: number): void {
  const currentSimTime = getCurrentState().getSimTime();
	const actorId = getCurrentState().getInternalStateObject().actors[0]?.Uid!;
  const taskId = getCurrentState().getInternalStateObject().tasks[0]?.Uid!;

  localEventManager.queueLocalEvent(new ChangeNbResourcesLocalEvent(0, currentSimTime, actorId, "MEDICAL_STAFF", -nbResources));
  localEventManager.queueLocalEvent(new TaskAllocationLocalEvent(0, currentSimTime, taskId, nbResources));
}

// export async function taskAllocationAction(taskId: TaskId, selectedActorId: ActorId, nbResources: number): Promise<IManagedResponse | undefined> {
//   return await buildAndLaunchTaskAllocation(taskId, selectedActorId, nbResources);
// }
