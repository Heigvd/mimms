import {
  getAllHospitals,
  getHospitalById,
  getPatientUnitByHospital,
} from '../game/common/evacuation/hospitalController';
import { HospitalId, PatientId } from '../game/common/baseTypes';
import {
  EvacuationSquadDefinition,
  EvacuationSquadType,
  getAllSquadDefinitions,
} from '../game/common/evacuation/evacuationSquadDef';
import { isEvacSquadAvailable } from '../game/common/evacuation/evacuationLogic';
import { getCurrentState } from '../game/mainSimulationLogic';
import { PatientUnitTypology } from '../game/common/evacuation/hospitalType';

// used in radioChannelEvacuation page

// Data choices

export function getEvacHospitalsChoices(): { label: string; value: string }[] {
  // Note : if we would like to have only the hospital mentioned by CASU, use getHospitalsMentionedByCasu(getCurrentState())
  return getAllHospitals().map(hospital => {
    return { label: hospital.shortName, value: hospital.hospitalId };
  });
}

export function getPatientUnitAtHospitalChoices(
  hospitalId: HospitalId | undefined
): { label: string; value: string }[] {
  if (hospitalId == undefined) {
    return [];
  }
  return getPatientUnitByHospital(hospitalId).map(patientUnit => {
    return { label: patientUnit, value: patientUnit };
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
  return Context.interfaceState.state.evacuation.data.patientId;
}

export function getHospitalId(): HospitalId | undefined {
  return Context.interfaceState.state.evacuation.data.hospitalId;
}

export function getHospitalShortName(): string {
  const hospitalId = getHospitalId();
  if (hospitalId != undefined) {
    return getHospitalById(hospitalId).shortName;
  }

  return '';
}

export function getPatientUnitAtHospital(): PatientUnitTypology | undefined {
  return Context.interfaceState.state.evacuation.data.patientUnitAtHospital;
}

export function getTransportSquad(): EvacuationSquadType | undefined {
  return Context.interfaceState.state.evacuation.data.transportSquad;
}

export function isSelectedSquad(transportSquad: EvacuationSquadType): boolean {
  return getTransportSquad() === transportSquad;
}

export function isResourcesComeBack(): boolean {
  return Context.interfaceState.state.evacuation.data.doResourcesComeBack;
}

// update data

export function selectPatientId(patientId: PatientId | undefined) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.data.patientId = patientId;
  Context.interfaceState.setState(newState);
}

export function selectHospitalId(hospitalId: HospitalId | undefined) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.data.hospitalId = hospitalId;
  newState.evacuation.data.patientUnitAtHospital = undefined;
  Context.interfaceState.setState(newState);
}

export function selectPatientUnitAtHospital(
  patientUnitAtHospital: PatientUnitTypology | undefined
) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.data.patientUnitAtHospital = patientUnitAtHospital;
  Context.interfaceState.setState(newState);
}

export function selectTransportSquad(transportSquad: EvacuationSquadType | undefined) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.data.transportSquad = transportSquad;
  Context.interfaceState.setState(newState);
}

export function selectDoResourcesComeBack(doResourcesComeBack: boolean) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.data.doResourcesComeBack = doResourcesComeBack;
  Context.interfaceState.setState(newState);
}

// Evacuation form

export function toggleOpenClosePatientChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.form.showPatientChoice =
    !Context.interfaceState.state.evacuation.form.showPatientChoice;
  Context.interfaceState.setState(newState);
}

export function toggleOpenCloseDestinationChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.form.showDestinationChoice =
    !Context.interfaceState.state.evacuation.form.showDestinationChoice;
  Context.interfaceState.setState(newState);
}

export function toggleOpenCloseVectorChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.form.showVectorChoice =
    !Context.interfaceState.state.evacuation.form.showVectorChoice;
  Context.interfaceState.setState(newState);
}

export function isPatientChoiceOpen() {
  return Context.interfaceState.state.evacuation.form.showPatientChoice;
}

export function isDestinationChoiceOpen() {
  return Context.interfaceState.state.evacuation.form.showDestinationChoice;
}

export function isVectorChoiceOpen() {
  return Context.interfaceState.state.evacuation.form.showVectorChoice;
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
  return getHospitalId() != undefined && getPatientUnitAtHospital() != undefined;
}

export function isVectorChoiceFilled() {
  return getTransportSquad() != undefined;
}
