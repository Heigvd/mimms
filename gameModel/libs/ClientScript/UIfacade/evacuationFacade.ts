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
