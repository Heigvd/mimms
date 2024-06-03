import {
  getAllHospitals,
  getPatientUnitByHospital,
} from '../game/common/evacuation/hospitalController';
import { HospitalId } from '../game/common/baseTypes';
import {
  EvacuationSquadType,
  getAllSquadDefinitions,
} from '../game/common/evacuation/evacuationSquadDef';
import { isEvacSquadAvailable } from '../game/common/evacuation/evacuationLogic';
import { getCurrentState } from '../game/mainSimulationLogic';
import { EvasanFormChoice } from '../gameInterface/interfaceState';

// used in page 52
export function getEvacHospitalsChoices(): { label: string; value: string }[] {
  // Note : if we would like to have only the hospital mentioned by CASU, use getHospitalsMentionedByCasu(getCurrentState())
  return getAllHospitals().map(hospital => {
    return { label: hospital.shortName, value: hospital.hospitalId };
  });
}

// used in page 52
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

export function getEvacSquadDefinitions(): { label: string; value: string; disabled: boolean }[] {
  return getAllSquadDefinitions().map(squadDef => {
    return {
      label: squadDef.uid,
      value: squadDef.uid,
      disabled: !isEvacSquadAvailable(getCurrentState(), squadDef.uid),
    };
  });
}

// used in page 52
export function isEvacSquadEnabled(type: EvacuationSquadType): boolean {
  return isEvacSquadAvailable(getCurrentState(), type);
}

// Evacuation form

export function openClosePatientChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuationForm.showPatientChoice =
    !Context.interfaceState.state.evacuationForm.showPatientChoice;
  Context.interfaceState.setState(newState);
}

export function openCloseDestinationChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuationForm.showDestinationChoice =
    !Context.interfaceState.state.evacuationForm.showDestinationChoice;
  Context.interfaceState.setState(newState);
}

export function openCloseVectorChoice() {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuationForm.showVectorChoice =
    !Context.interfaceState.state.evacuationForm.showVectorChoice;
  Context.interfaceState.setState(newState);
}

export function isPatientChoiceClosedAndFilled() {
  return (
    Context.interfaceState.state.evacuationForm.showPatientChoice ||
    Context.interfaceState.state.evacuation.patientId === undefined
  );
}

export function isDestinationChoiceClosedAndFilled() {
  return (
    Context.interfaceState.state.evacuationForm.showDestinationChoice ||
    Context.interfaceState.state.evacuation.patientId === undefined
  );
}

export function isVectorOpen(): boolean {
  return Context.interfaceState.state.evacuationForm.showVectorChoice;
}

export function isPatientChoiceFilled() {
  return Context.interfaceState.state.evacuation.patientId !== undefined;
}

//special vector

export function selectVectorSquad(transportSquad: EvacuationSquadType) {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation.transportSquad = transportSquad;
  Context.interfaceState.setState(newState);
}

export function isSelectedSquad(transportSquad: EvacuationSquadType): boolean {
  return Context.interfaceState.state.evacuation.transportSquad === transportSquad;
}
