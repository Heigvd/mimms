import { HumanBody } from '../../../HUMAn/human';
import { getPriorityByCategoryId, PreTriageResult } from '../../pretri/triage';
import { MainSimulationState } from './mainSimulationState';
import { Location, PatientId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export type PatientState = {
  patientId: PatientId;
  humanBody: HumanBody;
  location: Location | undefined;
  preTriageResult: PreTriageResult<string> | undefined;
};

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function getNextNonPreTriagedPatient(
  state: Readonly<MainSimulationState>
): PatientState | undefined {
  const internalState = state.getInternalStateObject();
  return internalState.patients.find(patient => patient.preTriageResult === undefined);
}

export function getNonPreTriagedPatientsSize(state: Readonly<MainSimulationState>): number {
  const internalState = state.getInternalStateObject();
  return internalState.patients.filter(patient => patient.preTriageResult === undefined).length;
}

export function getPreTriagedAmountByCategory(
  state: Readonly<MainSimulationState>
): Record<string, number> {
  const internalState = state.getInternalStateObject();
  const amountsByCategory: Record<string, number> = {};

  internalState.patients
    .map(patient => patient.preTriageResult?.categoryId)
    .filter(categoryId => categoryId != null)
    .forEach(category => {
      if (category! in amountsByCategory) {
        amountsByCategory[category!] += 1;
      } else {
        amountsByCategory[category!] = 1;
      }
    });

  return amountsByCategory;
}

export function getNonTransportedPatientsSize(state: Readonly<MainSimulationState>): number {
  const internalState = state.getInternalStateObject();
  return internalState.patients.filter(patient => patient.location === LOCATION_ENUM.chantier)
    .length;
}

export function getNextNonTransportedPatient(
  state: Readonly<MainSimulationState>,
  excludedIdsList: string[] = []
): PatientState | undefined {
  return state
    .getInternalStateObject()
    .patients.find(
      patient =>
        patient.location === LOCATION_ENUM.chantier && !excludedIdsList.includes(patient.patientId)
    );
}

export function getNextNonTransportedPatientByPriority(
  state: Readonly<MainSimulationState>,
  excludedIdsList: string[] = []
): PatientState | undefined {
  return state
    .getInternalStateObject()
    .patients.sort((a, b) =>
      a.preTriageResult && b.preTriageResult
        ? getPriorityByCategoryId(a.preTriageResult.categoryId!) >
          getPriorityByCategoryId(b.preTriageResult.categoryId!)
          ? 1
          : getPriorityByCategoryId(a.preTriageResult.categoryId!) <
            getPriorityByCategoryId(b.preTriageResult.categoryId!)
          ? -1
          : 0
        : 0
    )
    .find(
      patient =>
        patient.location === LOCATION_ENUM.chantier && !excludedIdsList.includes(patient.patientId)
    );
}

export function getPatient(
  state: Readonly<MainSimulationState>,
  patientId: string
): PatientState | undefined {
  return state.getInternalStateObject().patients.find(patient => patient.patientId === patientId);
}

/**
 * Change the position of a patient
 */
export function changePatientPosition(
  state: MainSimulationState,
  patientId: string,
  location: LOCATION_ENUM
): void {
  const patient = state
    .getInternalStateObject()
    .patients.find(patient => patient.patientId === patientId);
  if (patient) patient.location = location;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
