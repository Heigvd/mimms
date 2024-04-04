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
  parcAmbulance = 'parcAmbulance',
  meetingPoint = 'meetingPoint',
  remote = 'remote',
  AccReg = 'AccReg',
}

export function getAvailableLocations(): FixedMapEntity[] {
  return getCurrentState()
    .getInternalStateObject()
    .mapLocations.filter(mapLocation => mapLocation.buildingStatus === BuildingStatus.ready);
}

/**
 * Hospital details proximity
 */
export enum HospitalProximity {
  Regional,
  National,
  International,
}
