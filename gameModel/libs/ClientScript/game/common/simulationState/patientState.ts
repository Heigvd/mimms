import { HumanBody } from '../../../HUMAn/human';
import {
  getTagNameByCategoryId,
  getPriorityByCategoryId,
  PreTriageResult,
} from '../../pretri/triage';
import { MainSimulationState } from './mainSimulationState';
import { HospitalId, PatientId } from '../baseTypes';
import { LOCATION_ENUM } from './locationState';
import { PatientUnitTypology } from '../evacuation/hospitalType';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export type PatientLocation =
  | {
      kind: 'FixedMapEntity';
      locationId: LOCATION_ENUM;
    }
  | {
      kind: 'Hospital';
      locationId: HospitalId;
      patientUnit: PatientUnitTypology;
    };

export type PatientLocationKind = 'FixedMapEntity' | 'Hospital';
export type PatientLocationId = LOCATION_ENUM | HospitalId;

export type PatientState = {
  patientId: PatientId;
  humanBody: HumanBody;
  location: PatientLocation;
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

export function getPatientsByLocation(
  state: Readonly<MainSimulationState>,
  locationKind: PatientLocationKind,
  locationId: PatientLocationId
): PatientState[] {
  const internalState = state.getInternalStateObject();
  return internalState.patients.filter(
    patient => patient.location.kind === locationKind && patient.location.locationId === locationId
  );
}

export function comparePatientByPreTriageResult(a: PatientState, b: PatientState): number {
  if (a.preTriageResult && b.preTriageResult) {
    if (
      getPriorityByCategoryId(a.preTriageResult.categoryId!) >
      getPriorityByCategoryId(b.preTriageResult.categoryId!)
    ) {
      return 1;
    } else if (
      getPriorityByCategoryId(a.preTriageResult.categoryId!) <
      getPriorityByCategoryId(b.preTriageResult.categoryId!)
    ) {
      return -1;
    }
  }

  // be as deterministic as possible
  return a.patientId.localeCompare(b.patientId);
}

// -------------------------------------------------------------------------------------------------
// pre tri
// -------------------------------------------------------------------------------------------------

function preTriagedPatientPredicate(patient: PatientState, location: LOCATION_ENUM | undefined) {
  return (
    patient.preTriageResult === undefined &&
    (location === undefined || patient.location.locationId === location)
  );
}

export function getNextNonPreTriagedPatient(
  state: Readonly<MainSimulationState>,
  location?: LOCATION_ENUM
): PatientState | undefined {
  const patients = state.getInternalStateObject().patients;

  return patients.find(patient => preTriagedPatientPredicate(patient, location));
}

export function getNonPreTriagedPatientsSize(
  state: Readonly<MainSimulationState>,
  location?: LOCATION_ENUM
): number {
  const patients = state.getInternalStateObject().patients;

  return patients.filter(patient => preTriagedPatientPredicate(patient, location)).length;
}

export function getPreTriagedAmountByCategory(
  state: Readonly<MainSimulationState>,
  location?: LOCATION_ENUM
): Record<string, number> {
  const internalState = state.getInternalStateObject();
  const amountsByCategory: Record<string, number> = {};

  internalState.patients
    .filter(p => location === undefined || p.location.locationId === location)
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

export function getPreTriagedAmountByTagName(
  state: Readonly<MainSimulationState>,
  location?: LOCATION_ENUM
): Record<string, number> {
  const internalState = state.getInternalStateObject();
  const amountsByTagName: Record<string, number> = {};

  internalState.patients
    .filter(p => location === undefined || p.location.locationId === location)
    .map(patient => patient.preTriageResult?.categoryId)
    .filter(categoryId => categoryId != null)
    .forEach(category => {
      if (getTagNameByCategoryId(category!) in amountsByTagName) {
        amountsByTagName[getTagNameByCategoryId(category!)] += 1;
      } else {
        amountsByTagName[getTagNameByCategoryId(category!)] = 1;
      }
    });

  return amountsByTagName;
}

// -------------------------------------------------------------------------------------------------
// transport
// -------------------------------------------------------------------------------------------------

export function getNonTransportedPatientsSize(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM
): number {
  return getPatientsByLocation(state, 'FixedMapEntity', location).length;
}

export function getNextNonTransportedPatientsByPriority(
  state: Readonly<MainSimulationState>,
  location: LOCATION_ENUM,
  excludedIdsList: string[] = []
): PatientState[] {
  return getPatientsByLocation(state, 'FixedMapEntity', location)
    .filter(patient => !excludedIdsList.includes(patient.patientId))
    .sort(comparePatientByPreTriageResult);
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
  location: PatientLocation
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
