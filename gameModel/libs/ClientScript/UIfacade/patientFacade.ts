import { PatientState } from '../game/common/simulationState/patientState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { Categorization, PreTriageResult } from '../game/pretri/triage';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getPatientsByLocation } from '../game/common/simulationState/patientState';
import { HumanHealth } from '../game/legacy/the_world';
import {
  getAfflictedBlocksOfHuman,
  getHumanVisualInfosOfHuman,
} from '../game/patientZoom/currentPatientZoom';
import { getLocalizedBlocks } from '../game/patientZoom/graphics';
import { PatientId } from '../game/common/baseTypes';
import { HumanBody } from '../HUMAn/human';

/**
 * @returns All currently present patients
 */
export function getAllPatients(): Readonly<PatientState[]> {
  return getCurrentState().getAllPatients();
}

export function getPatient(id: string): Readonly<PatientState | undefined> {
  return getAllPatients().find(patient => patient.patientId === id);
}

/* old hack - to be updated
export function keepStateAlive({ state, setState }: FullState) {
	const ePatient = getCurrentPatientId();
	const cPatient = state.currentPatient;
	if (ePatient !== cPatient) {
		setState({
			...getInitialPatientZoomState(),
			currentPatient: ePatient,
		});
	}
}
*/

// -------------------------------------------------------------------------------------------------
// human body
// -------------------------------------------------------------------------------------------------

function getAfflictedBlocks(id: string): string[] {
  const human = getPatient(id)!.humanBody;
  const health: HumanHealth = {
    pathologies: human.revivedPathologies!,
    effects: human.effects!,
  };
  const currentTime = getCurrentState().getSimTime();

  return getAfflictedBlocksOfHuman(human, health, currentTime);
}

export function getLocalizedAffictedBlocks(id: string) {
  const afflictedBlocks = getAfflictedBlocks(id);

  return getLocalizedBlocks([...afflictedBlocks]).localized;
}

export function getHumanVisualInfos(id: string) {
  const human = getHumanAndCategory(id);
  return getHumanVisualInfosOfHuman(human);
}

function getHumanAndCategory(
  id: PatientId
): (HumanBody & { category: Categorization | undefined }) | undefined {
  const patient = getPatient(id)!;
  const human = patient.humanBody;
  return { ...human, category: undefined /* TODO */ };
}

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
