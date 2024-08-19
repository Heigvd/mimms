import { ActorId } from '../baseTypes';
import { isOnSite, LOCATION_ENUM } from '../simulationState/locationState';
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

/**
 * Get the actors with the highest hierarchy at the given location.
 * <p>
 * Usually there will be only 1 actor, apart from ACS + MCS who are at same hierarchy level and will be both returned
 */
export function getHighestAuthorityActorsByLocation(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): ActorId[] {
  const actorsAtLocation = state
    .getAllActors()
    .filter((actor: Actor) => actor.Location === location);

  return getHighestAuthorityActors(actorsAtLocation).map((actor: Actor) => actor.Uid);
}

/**
 * Get the actors with the highest hierarchy on site (= not remote).
 * <p>
 * Usually there will be only 1 actor, apart from ACS + MCS who are at same hierarchy level and will be both returned
 */
export function getHighestAuthorityActorOnSite(
  state: Readonly<MainSimulationState>
): ActorId[] {
  const actorsOnSite = state.getAllActors().filter((actor: Actor) => isOnSite(actor.Location));

  return getHighestAuthorityActors(actorsOnSite).map((actor: Actor) => actor.Uid);
}

/**
 * Get the actors with the highest hierarchy from a list
 * <p>
 * Usually there will be only 1 actor, apart from ACS + MCS who are at same hierarchy level and will be both returned
 */
function getHighestAuthorityActors(actors: Actor[]): Actor[] {
  if (actors.length < 2) {
    return actors;
  }

  const mostInfluentHierarchyLevel = hierarchyLevels[sortByHierarchyLevel(actors)[0]!.Role];

  return actors.filter(
    (actor: Actor) => hierarchyLevels[actor.Role] === mostInfluentHierarchyLevel
  );
}
