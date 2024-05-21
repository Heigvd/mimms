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
  meetingPoint = 'meetingPoint',
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

function isBuiltAndAccessible(fixedMapEntity: FixedMapEntity): boolean {
  return fixedMapEntity.buildingStatus === BuildingStatus.ready && !!fixedMapEntity.isAccessible;
}

/**
 * Hospital details proximity
 */
export enum HospitalProximity {
  Regional = 0,
  National,
  International,
}
