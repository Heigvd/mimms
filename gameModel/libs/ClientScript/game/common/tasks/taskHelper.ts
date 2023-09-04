import { taskLogger } from "../../../tools/logger";
import { ActorId, TaskId } from "../baseTypes";
import { ResourceAllocationEvent } from "../events/eventTypes";
import { FullEvent } from "../events/eventUtils";
import { ChangeNbResourcesLocalEvent, LocalEventBase, TaskAllocationLocalEvent } from "../localEvents/localEventBase";
import { ResourceType } from "../resources/resourcePool";
import { MainSimulationState } from "../simulationState/mainSimulationState";

export function createResourceAllocationLocalEvents(globalEvent: FullEvent<ResourceAllocationEvent>, state: MainSimulationState): LocalEventBase[] {
  taskLogger.debug("resources asked " + globalEvent.payload.nbResources);

  let effectiveNb = findEffectiveNbResourcesToAllocate(state,
    globalEvent.payload.actorId, globalEvent.payload.taskId, "MEDICAL_STAFF", globalEvent.payload.nbResources);

  taskLogger.debug("resources given " + effectiveNb);

  return [
    new ChangeNbResourcesLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, globalEvent.payload.actorId, "MEDICAL_STAFF", -effectiveNb),
    new TaskAllocationLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, globalEvent.payload.taskId, effectiveNb)
  ];
}

function findEffectiveNbResourcesToAllocate(state: MainSimulationState,
  actorId: ActorId, taskId: TaskId, type: ResourceType, nbRequested: number): number {

  if (nbRequested > 0) {
    // resources go from resource pool to a task
    if (state.isTaskAlive(taskId)) {
      const nbAvailable: number = state.getNbResourcesAvailable(actorId, type);
      const taskNbStillMessingResources = state.getTaskNbResourcesStillMissing(taskId);
      const nbFeasible = Math.min(nbRequested, nbAvailable, taskNbStillMessingResources);
      return nbFeasible;
    }
  }

  if (nbRequested < 0) {
    // resources go from a task to resources pool
    const nbAvailable: number = state.getTaskNbCurrentResources(taskId);
    const nbFeasible = Math.min(Math.abs(nbRequested), nbAvailable);
    return -nbFeasible;
  }

  return 0;
}