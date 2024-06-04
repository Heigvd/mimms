import { getCurrentState } from '../game/mainSimulationLogic';
import { PreTriageResult } from '../game/pretri/triage';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getPatientsByLocation } from '../game/common/simulationState/patientState';

// -------------------------------------------------------------------------------------------------
// evacuation
// -------------------------------------------------------------------------------------------------

// used in page 52
export function getPatientsAvailableForEvacuation(): { label: string; value: string }[] {
  return getPatientsByLocation(getCurrentState(), 'FixedMapEntity', LOCATION_ENUM.PMA).map(
    patient => {
      return { label: patient.patientId, value: patient.patientId };
    }
  );
}

// -------------------------------------------------------------------------------------------------
// summary
// -------------------------------------------------------------------------------------------------

// used in page 57
export function getPatientsSummary() {
  let patientNumber = 1;

  const patients = Object.values(getCurrentState().getInternalStateObject().patients);
  const response: {
    n: number;
    data: {
      id: string;
      categorization: PreTriageResult<string> | undefined;
      location: string;
      effects: string[];
      patientUnitAtHospital: string;
    };
    id: string;
  }[] = [];

  patients.forEach(patient => {
    const patientId = patient.humanBody.id;
    if (patientId) {
      let effectsStringArray = [''];
      if (patient.humanBody.effects && patient.humanBody.effects.length > 0) {
        effectsStringArray = patient.humanBody.effects.map(effect => effect.source.id || '');
      }
      response.push({
        n: patientNumber,
        data: {
          id: patientId,
          categorization: patient.preTriageResult,
          location: patient.location.locationId,
          effects: effectsStringArray,
          patientUnitAtHospital:
            patient.location.kind === 'Hospital' ? patient.location.patientUnit : '',
        },
        id: patientId,
      });
      patientNumber++;
    }
  });
  return response;
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
