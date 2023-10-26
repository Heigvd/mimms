import { taskLogger } from "../../../tools/logger";
import { ActorId, TaskId } from "../baseTypes";
import { ResourceAllocationEvent, ResourceReleaseEvent } from "../events/eventTypes";
import { FullEvent } from "../events/eventUtils";
import {  LocalEventBase, ResourcesAllocationLocalEvent, ResourcesReleaseLocalEvent  } from "../localEvents/localEventBase";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";
import { ResourceType } from '../resources/resourceType';

// -------------------------------------------------------------------------------------------------
// allocate resource local event
// -------------------------------------------------------------------------------------------------

/**
 * From the global event, create the local events that must be handled when resources are allocaed.
 */
export function createResourceAllocationLocalEvent(globalEvent: FullEvent<ResourceAllocationEvent>, state: MainSimulationState): LocalEventBase | undefined{
  taskLogger.info("resources allocation asked " + JSON.stringify(globalEvent.payload));

  let effectiveNb = findEffectiveNbResourcesToAllocate(state,
    globalEvent.payload.taskId, globalEvent.payload.actorId, globalEvent.payload.resourceType, globalEvent.payload.nbResources);

  taskLogger.debug("resources allocation given " + effectiveNb);

  return new ResourcesAllocationLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, globalEvent.payload.taskId, globalEvent.payload.actorId, globalEvent.payload.resourceType, effectiveNb);
}

/**
 * @returns The number of resources that can be allocated to the given task by the given actor.
 * The restrictions are : how many are requested, how many resources the actor has at disposal,
 * how many maximum resources are useful for the task.
 */
function findEffectiveNbResourcesToAllocate(state: Readonly<MainSimulationState>,
																						taskId: TaskId, actorId: ActorId, type: ResourceType, nbRequested: number): number {

    if (TaskState.isTaskAlive(state, taskId)) {
      const nbAvailable: number = ResourceState.getResourcesAvailable(state, actorId, type).length;
      const taskNbStillMissingResources = TaskState.getNbResourcesStillUsefulForTask(state, taskId, type);
      const nbFeasible = Math.min(nbRequested, nbAvailable, taskNbStillMissingResources);
      return nbFeasible;
    }

  return 0;
}

// -------------------------------------------------------------------------------------------------
// release resource local event
// -------------------------------------------------------------------------------------------------

/**
 * From the global event, create the local events that must be handled when resources are released.
 */
export function createResourceReleaseLocalEvent(globalEvent: FullEvent<ResourceReleaseEvent>, state: MainSimulationState): LocalEventBase | undefined {
  taskLogger.debug("resources release asked " + globalEvent.payload.nbResources);

  let effectiveNb = findEffectiveNbResourcesToRelease(state,
    globalEvent.payload.taskId, globalEvent.payload.actorId, globalEvent.payload.resourceType, Math.abs(globalEvent.payload.nbResources));

  taskLogger.debug("resources release given " + effectiveNb);

  return new ResourcesReleaseLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, globalEvent.payload.taskId, globalEvent.payload.actorId, globalEvent.payload.resourceType, effectiveNb);
}

/**
 * @returns The number of resources owned by the given actor that can be released from the given task.
 * The restrictions are : how many are requested, how many resources are allocated to the task.
 */
function findEffectiveNbResourcesToRelease(state: Readonly<MainSimulationState>,
	taskId: TaskId, actorId: ActorId, type: ResourceType, nbRequested: number): number {

    const nbAvailable: number = ResourceState.getResourcesAllocatedToTaskForActor(state, taskId, actorId, type).length;
    const nbFeasible = Math.min(nbRequested, nbAvailable);
    return nbFeasible;
}
