import { ActorId } from "../baseTypes";
import { ResourceType, ResourcePool } from "../resources/resourcePool";
import { MainSimulationState } from "./mainSimulationState";

/**
 * @returns All pool resources matching actor id and type
 */
export function getResources(state: MainSimulationState, actorId: ActorId, type: ResourceType): Readonly<ResourcePool>[] {
  return internallyGetResources(state, actorId, type);
}

/**
 * Get, but for internal use, return object can be updated
 *
 * @returns All pool resources matching actor id and type
 */
function internallyGetResources(state: MainSimulationState, actorId: ActorId, type: ResourceType): ResourcePool[] {
  const internalState = state.getInternalStateObject();

  return internalState.resources.filter(res => res.ownerId === actorId && res.type === type);
}

export function getNbResourcesAvailable(state: MainSimulationState, actorId: ActorId, type: ResourceType): number {
  const allMatching = internallyGetResources(state, actorId, type);

  if (allMatching != null && allMatching.length === 1 && allMatching[0] != null) {
    const matching = allMatching[0];
    return matching.nbAvailable;
  }

  return 0;
}

/**
 * Change the number of resources in the matching resource pool.
 * <p>
 * If none, create a resource pool.
 */
export function addResources(state: MainSimulationState, actorId: ActorId, type: ResourceType, nb: number): void {
  const internalState = state.getInternalStateObject();

  const allMatching = internallyGetResources(state, actorId, type);

  if (allMatching != null && allMatching.length === 1 && allMatching[0] != null) {
    const matching = allMatching[0];
    matching.nbAvailable += nb;
  } else {
    internalState.resources.push(new ResourcePool(actorId, type, nb));
  }
}
