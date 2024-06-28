import { ActorId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Actor, hierarchyLevels, InterventionRole, sortByHierarchyLevel } from './actor';

export function getStateActorSymbolicLocation(
  state: Readonly<MainSimulationState>,
  role: InterventionRole
): LOCATION_ENUM {
  // there should only be one
  return state
    .getInternalStateObject()
    .actors.filter(actor => actor.Role === role)[0]!
    .getComputedSymbolicLocation(state);
}

export function getStateActorSymbolicLocationForActor(
  state: Readonly<MainSimulationState>,
  actorId: ActorId
): LOCATION_ENUM {
  // there should only be one
  return state
    .getInternalStateObject()
    .actors.filter(actor => actor.Uid === actorId)[0]!
    .getComputedSymbolicLocation(state);
}

/**
 * Get the most influent actors at the given location.
 * <p>
 * Usually there will be only 1 actor, apart from ACS + MCS who are at same hierarchy level and will be both returned
 */
export function getActorsOfMostInfluentAuthorityLevelByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): ActorId[] {
  const actorsAtLocation = state
    .getAllActors()
    .filter((actor: Actor) => actor.Location === location);

  if (actorsAtLocation.length === 0) {
    return [];
  }
  if (actorsAtLocation.length === 1) {
    return actorsAtLocation.map((actor: Actor) => actor.Uid);
  }

  const mostInfluentHierarchyLevel =
    hierarchyLevels[sortByHierarchyLevel(actorsAtLocation)[0]!.Role];

  return actorsAtLocation
    .filter((actor: Actor) => hierarchyLevels[actor.Role] === mostInfluentHierarchyLevel)
    .map((actor: Actor) => actor.Uid);
}
