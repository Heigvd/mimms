import { HospitalDefinition, HospitalProximity, PatientUnitTypology } from './hospitalType';
import { hospitalInfo } from '../../../gameInterface/mock_data';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { HospitalId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { EvacuationSquadType, getSquadDef } from './evacuationSquadDef';

// -------------------------------------------------------------------------------------------------
// hospital
// -------------------------------------------------------------------------------------------------

export function getHospitalById(hospitalId: HospitalId): HospitalDefinition {
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
 * @param squadType the squad that go to the hospital
 *
 * @return The number of time slices needed to go to the hospital
 */
export function computeTravelTime(hospitalId: HospitalId, squadType: EvacuationSquadType): number {
  const squad = getSquadDef(squadType);
  const distance = getHospitalById(hospitalId).distance;

  return Math.ceil(
    (squad.loadingTime + (distance / squad.speed) * 60 + squad.unloadingTime) * OneMinuteDuration
  );
}

export function formatTravelTimeToMinutes(travelTime: number): number {
  return travelTime > 0 ? Math.ceil(travelTime / OneMinuteDuration) : 0;
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
