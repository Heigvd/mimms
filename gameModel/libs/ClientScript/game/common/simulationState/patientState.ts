import { HumanBody } from '../../../HUMAn/human';
import { getPriorityByCategoryId, PreTriageResult } from '../../pretri/triage';
import { MainSimulationState } from './mainSimulationState';
import { Location, PatientId } from '../baseTypes';
import { LOCATION_ENUM } from './locationState';

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
// get data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function getPatient(
  state: Readonly<MainSimulationState>,
  patientId: string
): PatientState | undefined {
  return state.getInternalStateObject().patients.find(patient => patient.patientId === patientId);
}

// -------------------------------------------------------------------------------------------------
// pre tri
// -------------------------------------------------------------------------------------------------

export function getNextNonPreTriagedPatient(
  state: Readonly<MainSimulationState>
): PatientState | undefined {
  return state
    .getInternalStateObject()
    .patients.find(patient => patient.preTriageResult === undefined);
}

export function getNonPreTriagedPatientsSize(state: Readonly<MainSimulationState>): number {
  return state
    .getInternalStateObject()
    .patients.filter(patient => patient.preTriageResult === undefined).length;
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

// -------------------------------------------------------------------------------------------------
// transport
// -------------------------------------------------------------------------------------------------

export function getNonTransportedPatientsSize(state: Readonly<MainSimulationState>): number {
  return state
    .getInternalStateObject()
    .patients.filter(patient => patient.location === LOCATION_ENUM.chantier).length;
}

export function getNextNonTransportedPatientByPriority(
  state: Readonly<MainSimulationState>,
  excludedIdsList: string[] = []
): PatientState | undefined {
  const internalState = state.getInternalStateObject();
  return internalState.patients
    .sort((a, b) =>
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// update data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Change the location of a patient
 */
export function changePatientLocation(
  state: MainSimulationState,
  patientId: string,
  location: Location
): void {
  const patient = getPatient(state, patientId);
  if (patient) {
    patient.location = location;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
