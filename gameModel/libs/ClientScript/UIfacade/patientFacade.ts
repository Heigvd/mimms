import { PatientState } from '../game/common/simulationState/patientState';
import { getCurrentState } from '../game/mainSimulationLogic';

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
