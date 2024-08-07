import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
import { MainSimulationState } from './mainSimulationState';

/**
 * Rough indication of locations
 */
export enum LOCATION_ENUM {
  chantier = 'chantier',
  nidDeBlesses = 'nidDeBlesses',
  PMA = 'PMA',
  PC = 'PC',
  ambulancePark = 'ambulancePark',
  helicopterPark = 'helicopterPark',
  pcFront = 'pcFront',
  remote = 'remote',
  AccReg = 'AccReg',
}

export function getAvailableLocations(state: Readonly<MainSimulationState>): FixedMapEntity[] {
  return state
    .getInternalStateObject()
    .mapLocations.filter(mapLocation => isBuiltAndAccessible(mapLocation));
}

export function isLocationAvailableForPatients(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): boolean {
  const matchingFixedMapEntity = state
    .getInternalStateObject()
    .mapLocations.find(loc => loc.id === location);

  return matchingFixedMapEntity != undefined && isBuiltAndAccessible(matchingFixedMapEntity);

  // Note : in the future, PMA could need a special treatment
}

/**
 * Check if an actor or resource is allowed to move to given location
 * @param state MainSimulationState
 * @param targetLocation FixedMapEntity of target location
 */
export function canMoveToLocation(
  state: Readonly<MainSimulationState>,
  targetLocation: LOCATION_ENUM
): boolean {
  // Remote has no conditions for movement
  if (targetLocation === LOCATION_ENUM.remote) return true;

  const so = state.getInternalStateObject();
  const targetLocationEntity = so.mapLocations.find(l => l.id === targetLocation);
  return !(
    targetLocationEntity === undefined ||
    targetLocationEntity.buildingStatus === BuildingStatus.removed
  );
}

function isBuiltAndAccessible(fixedMapEntity: FixedMapEntity): boolean {
  return fixedMapEntity.buildingStatus === BuildingStatus.ready && fixedMapEntity.isAccessible;
}
