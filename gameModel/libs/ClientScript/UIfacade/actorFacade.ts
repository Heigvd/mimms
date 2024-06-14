import { Actor, InterventionRole } from '../game/common/actors/actor';
import { ActorId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getInterfaceConfiguration } from '../gameInterface/interfaceConfiguration';
import { getPlayerRolesSelf } from '../multiplayer/multiplayerManager';

/**
 * @returns All currently present actors
 */
export function getAllActors(): Readonly<Actor[]> {
  return getCurrentState().getAllActors();
}

/**
 * @returns All actors available to the current player
 */
export function getCurrentPlayerActors(): Readonly<Actor[]> {
  const actors = getCurrentState().getAllActors();
  const currentPlayerRoles = getPlayerRolesSelf();

  const currentPlayerRolesKeys = Object.keys(currentPlayerRoles).filter(
    key => currentPlayerRoles[key as InterventionRole]
  );

  return actors.filter(actor => currentPlayerRolesKeys.includes(actor.Role));
}

/**
 * @returns All actors visible to the current player (in the timeline)
 */
export function getVisibleActorsInTimelineForCurrentPlayer() {
  return getInterfaceConfiguration().timeline.viewNonPlayerActors
    ? getAllActors().filter(actor => actor.Role != 'CASU')
    : getCurrentPlayerActors();
}

/**
 * Given a list of actors, filters those which are played by the current player
 */
export function getCurrentPlayerActorIds(actors: Readonly<Actor[]>): ActorId[] {
  const roles = getPlayerRolesSelf();
  return actors.filter(a => roles[a.Role]).map(a => a.Uid);
}

/**
 * Returns the number of actors playable by the current player
 */
export function getCurrentPlayerOnsiteActorCount(): number {
  return getCurrentPlayerActors().filter(a => a.isOnSite()).length;
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

export function getSelectedActorLocation(): LOCATION_ENUM | undefined {
  const currentActorUid = Context.interfaceState.state.currentActorUid;
  return getActor(currentActorUid)?.Location;
}
