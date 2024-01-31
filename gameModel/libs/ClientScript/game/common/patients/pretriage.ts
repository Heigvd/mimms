import { HumanBody } from '../../../HUMAn/human';
import { getEnv } from '../../../tools/WegasHelper';
//TODO: refactor HumanHealth logic out of the_world
import { HumanHealth } from '../../legacy/the_world';
import { doAutomaticTriage_internal, PreTriageData, PreTriageResult } from '../../pretri/triage';

export function doPatientAutomaticTriage(
  patient: HumanBody,
  simTime: number = 0,
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

  return doAutomaticTriage_internal(data, true, simTime);
}
