import { HospitalDefinition, HospitalProximity, PatientUnitTypology } from './hospitalType';
import { hospitalInfo } from '../../../gameInterface/mock_data';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { HospitalId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { Resource } from '../resources/resource';
import { isAVehicle } from '../resources/resourceType';

// -------------------------------------------------------------------------------------------------
// hospital
// -------------------------------------------------------------------------------------------------

function getHospitalById(hospitalId: HospitalId): HospitalDefinition {
  return hospitalInfo.find(hospital => hospital.hospitalId === hospitalId)!;
}

export function getHospitalsByProximity(proximity: HospitalProximity): HospitalDefinition[] {
  // Hardcoded, hospital data should be retrieved from scenarist inputs
  return hospitalInfo.filter(h => proximity.valueOf() >= h.proximity);
}

export function getAllHospitals(): HospitalDefinition[] {
  return hospitalInfo;
}

export function getHospitalsMentionedByCasu(state: Readonly<MainSimulationState>) {
  const proximityRequested = state.getInternalStateObject().hospital.proximityWidestRequest;
  if (proximityRequested) {
    return getHospitalsByProximity(proximityRequested);
  }

  return [];
}

/**
 * @param hospitalId the hospital
 * @param resources what are the resources that go to the hospital
 *
 * @return The number of time slices needed to go to the hospital
 */
export function computeTravelTime(hospitalId: HospitalId, resources: Resource[]): number {
  const distance = getHospitalById(hospitalId).distance;

  const vehicles = resources.filter((resource: Resource) => isAVehicle(resource.type));

  let speed: number = 2; /* km/h */
  let loadingTime: number = 1; /* minutes */
  let unloadingTime: number = 1; /* minutes */
  if (vehicles.some(vehicle => vehicle.type === 'helicopter')) {
    speed = 225;
    loadingTime = 2;
    unloadingTime = 2;
  } else if (vehicles.some(vehicle => vehicle.type === 'ambulance')) {
    speed = 80;
    loadingTime = 2;
    unloadingTime = 2;
  }

  return Math.ceil((loadingTime + (distance / speed) * 60 + unloadingTime) * OneMinuteDuration);
}

// -------------------------------------------------------------------------------------------------
// hospital patient unit typology
// -------------------------------------------------------------------------------------------------

export function getPatientUnitByHospital(hospitalId: HospitalId): PatientUnitTypology[] {
  const hospital = getHospitalById(hospitalId);
  return hospital.units.flatMap(unit => unit.placeType.typology);
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
