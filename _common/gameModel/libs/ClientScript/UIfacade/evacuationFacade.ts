import { HospitalId, PatientId, PatientUnitId } from '../game/common/baseTypes';
import { isEvacSquadAvailable } from '../game/common/evacuation/evacuationLogic';
import {
  EvacuationSquadDefinition,
  EvacuationSquadType,
  getAllSquadDefinitions,
  getNumberDriverNeeded,
  getNumberHealersNeeded,
} from '../game/common/evacuation/evacuationSquadDef';
import { HospitalDefinition } from '../game/common/evacuation/hospitalType';
import { EvacuationActionPayload } from '../game/common/events/evacuationMessageEvent';
import { Resource } from '../game/common/resources/resource';
import {
  getCachedHospitalById,
  getCachedHospitals,
  getCachedPatientUnitById,
} from '../game/loaders/hospitalLoader';
import { getCurrentState } from '../game/mainSimulationLogic';
import { runActionButton } from '../gameInterface/actionsButtonLogic';
import { getTypedInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { uniqueActionTemplates } from '../UIfacade/actionFacade';

// used in radioChannelEvacuation page

export function toggleEvacuationModal(show: boolean): void {
  setInterfaceState({ showEvacuationModal: show });
}

// Data choices

export function getEvacHospitalsChoices(): { label: string; value: string }[] {
  // Note : if we would like to have only the hospital mentioned by CASU, use getHospitalsMentionedByCasu(getCurrentState())
  const hospitals: Record<HospitalId, HospitalDefinition> = getCachedHospitals();
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

  return Object.keys(getCachedHospitalById(hospitalId).units).map(patientUnitId => {
    return {
      label: I18n.translate(getCachedPatientUnitById(patientUnitId).name),
      value: patientUnitId,
    };
  });
}

export function getEvacSquadDefinitions(): EvacuationSquadDefinition[] {
  return getAllSquadDefinitions();
}

export function getVehicleIcon(evacSquadDef: EvacuationSquadDefinition): string {
  return evacSquadDef.vehicleIcon;
}

export function getNbDrivers(evacSquadDef: EvacuationSquadDefinition): number {
  return getNumberDriverNeeded(evacSquadDef.uid);
}

export function getNbHealers(evacSquadDef: EvacuationSquadDefinition): number {
  return getNumberHealersNeeded(evacSquadDef.uid);
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
    return getCachedHospitalById(hospitalId).shortName;
  }

  return '';
}

export function getPatientUnitId(): PatientUnitId | undefined {
  return getTypedInterfaceState().evacuation.data.patientUnitId;
}

export function getPatientUnitName(): string {
  const patientUnitId = getTypedInterfaceState().evacuation.data.patientUnitId;
  if (patientUnitId) {
    return I18n.translate(getCachedPatientUnitById(patientUnitId).name);
  }
  return '';
}

export function getTransportSquad(): EvacuationSquadType | undefined {
  return getTypedInterfaceState().evacuation.data.transportSquad;
}

export function isSelectedSquad(transportSquad: EvacuationSquadType): boolean {
  return getTransportSquad() === transportSquad;
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

// -------------------------------------------------------------------------------------------------
// evacuation selection state (used in page evacuationView)
// -------------------------------------------------------------------------------------------------

export interface EvacuationSelectionState {
  selectedPatientId: PatientId | undefined;
  selectedHospitalId: HospitalId | undefined;
  selectedServiceId: PatientUnitId | undefined;
  selectedVectorType: EvacuationSquadType | undefined;
}

export function getInitialEvacuationSelectionState(): EvacuationSelectionState {
  return {
    selectedPatientId: undefined,
    selectedHospitalId: undefined,
    selectedServiceId: undefined,
    selectedVectorType: undefined,
  };
}

/**
 * @param update, an object that only contains the change set to be applied to the evacuation selection state
 */
export function setEvacuationSelectionState(update: Partial<EvacuationSelectionState>): void {
  const newState = Helpers.cloneDeep(Context.evacuationState.state);
  Object.assign(newState, update);
  Context.evacuationState.setState(newState);
}

/**
 * For convenience
 * Just casting the evacuation selection state properly
 */
export function getTypedEvacuationSelectionState(): EvacuationSelectionState {
  return Context.evacuationState?.state;
}

export function resetEvacuationState(): void {
  setEvacuationSelectionState(getTypedEvacuationSelectionState());
}

export function sendEvacuationOrder(): void {
  if (canSendEvacuationOrder()) {
    const template = uniqueActionTemplates()?.EvacuationActionTemplate;
    runActionButton(template);
    resetEvacuationState();
    toggleEvacuationModal(false);
  }
}

export function canSendEvacuationOrder(): boolean {
  const values = Object.values(getTypedEvacuationSelectionState());
  return values?.length == 4 && values.every(v => v !== undefined);
}

export function getEvacuationOrderPayload(): EvacuationActionPayload | undefined {
  const selection = getTypedEvacuationSelectionState();
  if (canSendEvacuationOrder()) {
    return {
      patientId: selection.selectedPatientId!,
      transportSquad: selection.selectedVectorType!,
      hospitalId: selection.selectedHospitalId!,
      patientUnitId: selection.selectedPatientId!,
    };
  }
}

interface PartialSquad {
  type: EvacuationSquadType;
  vehicleId: Resource;
  driver: number;
  healer: number;
}

export function listAvailableSquads(squadType: EvacuationSquadType): PartialSquad[] {
  return [];
}
