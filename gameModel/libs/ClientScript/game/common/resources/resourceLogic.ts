import { hierarchyLevels } from '../actors/actor';
import { ActorId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ResourceContainerType } from './resourceContainer';
import { ResourceType, isHuman } from './resourceType';

/**
 * Resolves which location new resources should be sent to
 */
export function resourceArrivalLocationResolution(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceType
): LOCATION_ENUM {
  const so = state.getInternalStateObject();

  if (isHuman(resourceType)) {
    const acsArrived = so.flags.ACS_ARRIVED;
    const mcsArrived = so.flags.MCS_ARRIVED;
    const pcBuilt = so.flags.PC_BUILT;

    if (acsArrived && mcsArrived && pcBuilt) {
      return LOCATION_ENUM.PC;
    }
  }

  if (resourceType === 'ambulance' && so.flags.AMBULANCE_PARK_BUILT) {
    return LOCATION_ENUM.ambulancePark;
  }

  if (resourceType === 'helicopter' && so.flags.HELICOPTER_PARK_BUILT) {
    return LOCATION_ENUM.helicopterPark;
  }

  return LOCATION_ENUM.meetingPoint;
}

/**
 * Determines if an ambulance or helicopter container can arrive on site
 */
export function resourceContainerCanArrive(
  state: Readonly<MainSimulationState>,
  resourceType: ResourceContainerType
): boolean {
  const so = state.getInternalStateObject();
  if (resourceType === 'Ambulance') return so.flags.AMBULANCE_PARK_BUILT || false;
  if (resourceType === 'Helicopter') return so.flags.HELICOPTER_PARK_BUILT || false;

  return true; // all other resource container types can arrive
}

/**
 * Resolve whether a resource should obey move and task order
 * @param actorUid Actor emitting the order
 * @param sourceLocation Current location of the resource
 * @param state
 * @returns boolean
 */
export function doesOrderRespectHierarchy(
  state: Readonly<MainSimulationState>,
  actorUid: ActorId,
  sourceLocation: LOCATION_ENUM
): boolean {
  const actor = state.getActorById(actorUid)!;
  // Actors whose location is remote are irrelevant
  const currentActors = state
    .getAllActors()
    .filter(a => a.Location !== LOCATION_ENUM.remote)
    .map(a => a.Role);
  const locationLeaderRoles = state
    .getMapLocations()
    .find(l => l.id === sourceLocation)!.leaderRoles;

  return currentActors
    .filter(a => locationLeaderRoles.includes(a))
    .every(r => hierarchyLevels[r] >= hierarchyLevels[actor.Role]);
}
