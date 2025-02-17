import { HospitalId, PatientId, PatientUnitId } from '../game/common/baseTypes';
import { isEvacSquadAvailable } from '../game/common/evacuation/evacuationLogic';
import {
  EvacuationSquadDefinition,
  EvacuationSquadType,
  getAllSquadDefinitions,
} from '../game/common/evacuation/evacuationSquadDef';
import {
  getHospitalById,
  getHospitals,
  getPatientUnitById,
} from '../game/common/evacuation/hospitalController';
import { HospitalDefinition } from '../game/common/evacuation/hospitalType';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { getText } from '../tools/translation';

// used in radioChannelEvacuation page

// Data choices

export function getEvacHospitalsChoices(): { label: string; value: string }[] {
  // Note : if we would like to have only the hospital mentioned by CASU, use getHospitalsMentionedByCasu(getCurrentState())
  const hospitals: Record<HospitalId, HospitalDefinition> = getHospitals();
  return Object.entries(hospitals).map(([id, hospital]) => {
    return { label: hospital.shortName, value: id };
  });
}

export function getPatientUnitsChoices(
  hospitalId: HospitalId | undefined
): { label: string; value: string }[] {
  if (hospitalId == undefined) {
    return [];
  }

  return Object.keys(getHospitalById(hospitalId).units).map(patientUnitId => {
    return { label: getText(getPatientUnitById(patientUnitId).name), value: patientUnitId };
  });
}

export function getEvacSquadDefinitions(): EvacuationSquadDefinition[] {
  return getAllSquadDefinitions();
}

export function getVehicleIcon(evacSquadDef: EvacuationSquadDefinition): string {
  return evacSquadDef.vehicleIcon;
}

export function getNbDrivers(evacSquadDef: EvacuationSquadDefinition): number {
  return evacSquadDef.infoNbDrivers;
}

export function getNbHealers(evacSquadDef: EvacuationSquadDefinition): number {
  return evacSquadDef.infoNbHealers;
}

export function isEvacSquadEnabled(type: EvacuationSquadType): boolean {
  return isEvacSquadAvailable(getCurrentState(), type);
}

// get data

export function getPatientId(): PatientId | undefined {
  return getTypedInterfaceState().evacuation.data.patientId;
}

export function getHospitalId(): HospitalId | undefined {
  return getTypedInterfaceState().evacuation.data.hospitalId;
}

export function getHospitalShortName(): string {
  const hospitalId = getHospitalId();
  if (hospitalId != undefined) {
    return getHospitalById(hospitalId).shortName || '';
  }

  return '';
}

export function getPatientUnitId(): PatientUnitId | undefined {
  return getTypedInterfaceState().evacuation.data.patientUnitId;
}

export function getPatientUnitName(): string {
  const patientUnitId = getTypedInterfaceState().evacuation.data.patientUnitId;
  if (patientUnitId) {
    return getText(getPatientUnitById(patientUnitId).name);
  }
  return '';
}

export function getTransportSquad(): EvacuationSquadType | undefined {
  return getTypedInterfaceState().evacuation.data.transportSquad;
}

export function isSelectedSquad(transportSquad: EvacuationSquadType): boolean {
  return getTransportSquad() === transportSquad;
}

export function isResourcesComeBack(): boolean {
  return getTypedInterfaceState().evacuation.data.doResourcesComeBack;
}

// update data

export function selectPatientId(patientId: PatientId | undefined) {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.data.patientId = patientId;
  Context.interfaceState.setState(newState);
}

export function selectHospitalId(hospitalId: HospitalId | undefined) {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.data.hospitalId = hospitalId;
  newState.evacuation.data.patientUnitId = undefined;
  Context.interfaceState.setState(newState);
}

export function selectPatientUnitId(patientUnitId: PatientUnitId | undefined) {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.data.patientUnitId = patientUnitId;
  Context.interfaceState.setState(newState);
}

export function selectTransportSquad(transportSquad: EvacuationSquadType | undefined) {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.data.transportSquad = transportSquad;
  Context.interfaceState.setState(newState);
}

export function selectDoResourcesComeBack(doResourcesComeBack: boolean) {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.data.doResourcesComeBack = doResourcesComeBack;
  Context.interfaceState.setState(newState);
}

// Evacuation form

export function toggleOpenClosePatientChoice() {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.form.showPatientChoice =
    !getTypedInterfaceState().evacuation.form.showPatientChoice;
  Context.interfaceState.setState(newState);
}

export function toggleOpenCloseDestinationChoice() {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.form.showDestinationChoice =
    !getTypedInterfaceState().evacuation.form.showDestinationChoice;
  Context.interfaceState.setState(newState);
}

export function toggleOpenCloseVectorChoice() {
  const newState = Helpers.cloneDeep(getTypedInterfaceState());
  newState.evacuation.form.showVectorChoice =
    !getTypedInterfaceState().evacuation.form.showVectorChoice;
  Context.interfaceState.setState(newState);
}

export function isPatientChoiceOpen() {
  return getTypedInterfaceState().evacuation.form.showPatientChoice;
}

export function isDestinationChoiceOpen() {
  return getTypedInterfaceState().evacuation.form.showDestinationChoice;
}

export function isVectorChoiceOpen() {
  return getTypedInterfaceState().evacuation.form.showVectorChoice;
}

export function isPatientChoiceClosedAndFilled() {
  return !isPatientChoiceOpen() && getPatientId() !== undefined;
}

export function isDestinationChoiceClosedAndFilled() {
  return !isDestinationChoiceOpen() && getHospitalId() !== undefined;
  // no check of the patient unit at hospital
}

export function isVectorChoiceClosedAndFilled() {
  return !isVectorChoiceOpen() && getTransportSquad() !== undefined;
}

export function isPatientChoiceFilled() {
  return getPatientId() != undefined;
}

export function isDestinationChoiceFilled() {
  return getHospitalId() != undefined && getPatientUnitId() != undefined;
}

export function isVectorChoiceFilled() {
  return getTransportSquad() != undefined;
}
