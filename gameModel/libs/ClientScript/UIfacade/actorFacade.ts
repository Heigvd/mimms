import { Actor } from '../game/common/actors/actor';
import { ActorId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getPlayerRolesSelf } from '../multiplayer/multiplayerManager';

/**
 * @returns All currently present actors
 */
export function getAllActors(): Readonly<Actor[]> {
  return getCurrentState().getAllActors();
}

export function getCurrentPlayerActors(): Readonly<Actor[]> {
  const actors = getCurrentState().getAllActors();
  const currentPlayerRoles = getPlayerRolesSelf();
  // TODO Sort out warning, works but can be unsafe
  const currentPlayerRolesKeys = Object.keys(currentPlayerRoles).filter(
    key => currentPlayerRoles[key]
  );

  return actors.filter(actor => currentPlayerRolesKeys.includes(actor.Role));
}

/**
 * Given a list of actors, filters those which are played by the current player
 */
export function getCurrentPlayerActorIds(actors: Readonly<Actor[]>): ActorId[] {
  const roles = getPlayerRolesSelf();
  return actors.filter(a => roles[a.Role]).map(a => a.Uid);
}

/**
 * @returns Actor with given id or undefined
 */
// used in page 66
export function getActor(id: number): Readonly<Actor | undefined> | undefined {
  return getCurrentState().getActorById(id);
}

/**
 * Returns actors at given location
 * @param location
 */
export function getActorsByLocation(location: LOCATION_ENUM) {
  return getAllActors().filter(actor => actor.Location === location);
}

/**
 * Check if the current actor is at given location
 *
 * @param location Location to check
 */
// used in page 43
export function isCurrentActorAtLocation(location: LOCATION_ENUM): boolean {
  const currentActorUid = Context.interfaceState.state.currentActorUid;
  return getActorsByLocation(location).some(actor => actor.Uid === currentActorUid);
}
