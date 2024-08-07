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

export function getFixedMapEntityById(state: Readonly<MainSimulationState>, locationKey: LOCATION_ENUM) : FixedMapEntity | undefined {
  return state
    .getInternalStateObject()
    .mapLocations.find((fixedMapEntity: FixedMapEntity) => fixedMapEntity.id === locationKey);
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
  const matchingFixedMapEntity = getFixedMapEntityById(state, location);

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

  const targetLocationEntity = getFixedMapEntityById(state, targetLocation);
  return !(
    targetLocationEntity === undefined ||
    targetLocationEntity.buildingStatus === BuildingStatus.removed
  );
}

function isBuiltAndAccessible(fixedMapEntity: FixedMapEntity): boolean {
  return (
    fixedMapEntity.buildingStatus === BuildingStatus.ready && fixedMapEntity.accessibility.toAll
  );
}
