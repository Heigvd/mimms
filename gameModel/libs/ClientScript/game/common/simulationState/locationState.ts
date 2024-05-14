import { getCurrentState } from '../../mainSimulationLogic';
import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';

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

export function getAvailableLocations(): FixedMapEntity[] {
  return getCurrentState()
    .getInternalStateObject()
    .mapLocations.filter(mapLocation => mapLocation.buildingStatus === BuildingStatus.ready);
}

export function isLocationAvailable(location: LOCATION_ENUM): boolean {
  return getAvailableLocations().find(loc => loc.id === location) != undefined;
  // Note : PMA could need a special treatment
}

/**
 * Hospital details proximity
 */
export enum HospitalProximity {
  Regional = 0,
  National,
  International,
}
