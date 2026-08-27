import { HumanBody } from '../../../HUMAn/human';
import { getEnv } from '../../../tools/WegasHelper';
//TODO: refactor HumanHealth logic out of the_world
import { HumanHealth } from '../../pretri/patientProcessing';
import {
  doAutomaticTriage_internal,
  PreTriageData,
  PreTriageResult,
  STANDARD_CATEGORY,
  STANDARD_CATEGORY_ARRAY,
} from '../../pretri/triage';
import { SimTime } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { PatientState } from '../simulationState/patientState';

export function doPatientAutomaticTriage(
  patient: HumanBody,
  simTime: number,
  applyPretriageActions = true
): PreTriageResult<string> | undefined {
  const env = getEnv();

  const health: HumanHealth = {
    pathologies: patient.revivedPathologies!,
    effects: patient.effects!,
  };

  if (patient == null || health == null) {
    return undefined;
  }

  const data: PreTriageData = {
    human: patient,
    env: env,
    health: health,
    actions: [],
    console: [],
  };

  return doAutomaticTriage_internal(data, applyPretriageActions, simTime);
}
