import { HospitalId, PatientUnitId } from '../game/common/baseTypes';
import {
  deleteHospital,
  deletePatientUnit,
  getHospitalById,
  getHospitals,
  getPatientUnitById,
  getPatientUnits,
  insertHospital,
  insertPatientUnit,
  updateHospitalData,
  updateHospitalIndex,
  updateHospitalTranslatableData,
  updateHospitalUnitCapacity,
  updatePatientUnitIndex,
  updatePatientUnitTranslatableData,
} from '../game/common/evacuation/hospitalController';
import {
  HospitalDefinition,
  HospitalProximity,
  PatientUnitDefinition,
} from '../game/common/evacuation/hospitalType';
import { getProximityTranslation } from '../game/common/radio/radioLogic';

// -------------------------------------------------------------------------------------------------
// UI state
// -------------------------------------------------------------------------------------------------

export interface HospitalUIState {
  /** Can we edit the data or is it readonly */
  edit: boolean;
  /** Are all data of hospitals displayed */
  hospitals: boolean;
  /** Are all data of the patient units displayed */
  services: boolean;
}

export function getInitialHospitalUIState(): HospitalUIState {
  return {
    edit: false,
    hospitals: true,
    services: true,
  };
}

// -------------------------------------------------------------------------------------------------
// hospitals
// -------------------------------------------------------------------------------------------------

export interface HospitalToDisplay {
  id: HospitalId;
  index: number;
  fullName: string;
  shortName: string;
  preposition: ITranslatableContent;
  distance: number;
  proximity: HospitalProximity;
  units: Record<PatientUnitId, number>;
}

/**
 * Get the list of hospitals
 */
export function getAllHospitals(): HospitalToDisplay[] {
  const hospitals: Record<HospitalId, HospitalDefinition> = getHospitals();
  return Object.entries(hospitals)
    .map(([id, hospital]) => ({ ...hospital, id: id }))
    .sort((a, b) => {
      return a.index - b.index;
    });
}

/**
 * Get the label for a hospital proximity
 */
export function getHospitalProximityLabel(proximity: HospitalProximity): string {
  return getProximityTranslation(HospitalProximity[proximity]!);
}

/**
 * Get the choices for the proximity
 */
export function getHospitalProximityChoices(): { label: string; value: string }[] {
  return (
    Object.entries(HospitalProximity)
      // hack to have all items from enum only once
      .filter(([k, _]) => isNaN(parseInt(k)))
      .map(([k, v]) => ({
        label: getProximityTranslation(k),
        value: `${v}`,
      }))
  );
}

/**
 * Update a data of a hospital.
 * @param id       The id of the hospital
 * @param field    The name of the field (fullName, shortName, distance or proximity)
 * @param newValue The new value to set
 */
//export function changeHospitalData(id: HospitalId, field: keyof HospitalDefinition, newValue: string | number) {
export function changeHospitalData(
  id: HospitalId,
  field: 'fullName' | 'shortName' | 'distance' | 'proximity',
  newValue: string | number
) {
  updateHospitalData(id, field, newValue);
}

/**
 * Update a translatable data of a hospital. The new value is set to the current player language.
 * @param id       The id of the hospital
 * @param field    The name of the field (preposition)
 * @param newValue The new value to set
 */
//export function changeHospitalTranslatableData(id: HospitalId, field: keyof HospitalDefinition, newValue: string) {
export function changeHospitalTranslatableData(
  id: HospitalId,
  field: 'preposition',
  newValue: string
) {
  updateHospitalTranslatableData(id, field, newValue);
}

/**
 * Update the position (index) of the hospital to the top.
 */
export function moveHospitalUp(id: HospitalId) {
  updateHospitalIndex(id, 'decrement');
}

/**
 * Update the position (index) of the hospital to the bottom.
 */
export function moveHospitalDown(id: HospitalId) {
  updateHospitalIndex(id, 'increment');
}

/**
 * Delete a hospital
 */
export function removeHospital(id: HospitalId) {
  deleteHospital(id);
}

/**
 * Create a new hospital
 */
export function createHospital() {
  insertHospital();
}

/**
 * Get hospital index
 */
export function getHospitalIndex(id: HospitalId) {
  return getHospitalById(id)?.index;
}

// -------------------------------------------------------------------------------------------------
// patient units
// -------------------------------------------------------------------------------------------------

export interface PatientUnitToDisplay {
  id: PatientUnitId;
  index: number;
  name: ITranslatableContent;
}

/**
 * Get the list of patient units
 */
export function getAllPatientUnits(): PatientUnitToDisplay[] {
  const units: Record<PatientUnitId, PatientUnitDefinition> = getPatientUnits();
  return Object.entries(units)
    .map(([patientUnitId, patientUnit]) => ({ ...patientUnit, id: patientUnitId }))
    .sort((a, b) => {
      return a.index - b.index;
    });
}

/**
 * Update the name of a patient unit
 */
export function changePatientUnitName(id: PatientUnitId, newName: string) {
  updatePatientUnitTranslatableData(id, 'name', newName);
}

/**
 * Update the position (index) of the patient unit to the left.
 */
export function movePatientUnitLeft(id: PatientUnitId) {
  updatePatientUnitIndex(id, 'decrement');
}

/**
 * Update the position (index) of the patient unit to the right.
 */
export function movePatientUnitRight(id: PatientUnitId) {
  updatePatientUnitIndex(id, 'increment');
}

/**
 * Delete a patient unit
 */
export function removePatientUnit(id: PatientUnitId) {
  deletePatientUnit(id);
}

/**
 * Create a new patient unit
 */
export function createPatientUnit() {
  insertPatientUnit();
}

/**
 * Get patient unit index
 */
export function getPatientUnitIndex(id: PatientUnitId) {
  return getPatientUnitById(id)?.index;
}

// -------------------------------------------------------------------------------------------------
// hospital x patient unit
// -------------------------------------------------------------------------------------------------

/**
 * Update a capacity of a patient unit in a hospital (units).
 * @param hospitalId    The id of the hospital
 * @param patientUnitId The id of the patient unit
 * @param qty           The new value to set
 */
export function changeHospitalUnitCapacity(
  hospitalId: HospitalId,
  patientUnitId: PatientUnitId,
  qty: number
) {
  const effectiveQty = isNaN(qty) ? 0 : Math.round(qty);
  updateHospitalUnitCapacity(hospitalId, patientUnitId, effectiveQty);
}
