import { getCurrentState } from '../game/mainSimulationLogic';
import { PreTriageResult } from '../game/pretri/triage';
import { Location } from '../game/common/baseTypes';

export function getAllPatients() {
  let patientNumber = 1;

  const patients = Object.values(getCurrentState().getInternalStateObject().patients);
  const response: {
    n: number;
    data: {
      id: string;
      categorization: PreTriageResult<string> | undefined;
      location: Location | undefined;
      effects: string[];
    };
    id: string;
  }[] = [];

  patients.forEach(patient => {
    const patientId = patient.humanBody.id;
    if (patientId) {
      let effectsStringArray = [''];
      if (patient.humanBody.effects && patient.humanBody.effects.length > 0) {
        effectsStringArray = patient.humanBody.effects.map(effect =>
          effect.source !== undefined ? effect.source.id : '',
        );
      }
      response.push({
        n: patientNumber,
        data: {
          id: patientId,
          categorization: patient.preTriageResult,
          location: patient.location,
          effects: effectsStringArray,
        },
        id: patientId,
      });
      patientNumber++;
    }
  });
  return response;
}
