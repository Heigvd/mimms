import { Actor } from '../game/common/actors/actor';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';

/**
 * @returns All currently present actors
 */
export function getAllActors(): Readonly<Actor[]> {
  return getCurrentState().getAllActors();
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
