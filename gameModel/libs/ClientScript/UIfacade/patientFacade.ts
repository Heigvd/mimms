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
