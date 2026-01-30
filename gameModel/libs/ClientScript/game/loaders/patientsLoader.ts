import { createHumanBody } from '../../HUMAn/human';
import { quickHash } from '../../tools/helper';
import { mainSimLoaderLogger } from '../../tools/logger';
import { getEnv, getPatientsBodyFactoryParamsArray } from '../../tools/WegasHelper';
import {
  computeInitialAfflictedPathologies,
  computeInitialEffects,
  computeNewPatientsState,
  getInitialTimeJumpSeconds,
  reviveAfflictedPathologies,
} from '../common/patients/handleState';
import { LOCATION_ENUM } from '../common/simulationState/locationState';
import { PatientState } from '../common/simulationState/patientState';

// used in testing mode when recomputing the state whole starting state
let patientCache: Record<string, PatientState[]> = {};

Helpers.registerEffect(() => {
  // reinitialize on script loading
  patientCache = {};
  mainSimLoaderLogger.info('Resetting patient cache');
});

export function loadPatients(): PatientState[] {
  const env = getEnv();
  const humanParams = getPatientsBodyFactoryParamsArray();
  const initialTimeJump = getInitialTimeJumpSeconds();
  const hash = quickHash(JSON.stringify(env) + JSON.stringify(humanParams) + initialTimeJump);
  if (patientCache[hash]) {
    mainSimLoaderLogger.info('***** cache hit on patient state', hash);
    return Helpers.cloneDeep(patientCache[hash]);
  }

  mainSimLoaderLogger.info('Computing patients initial state');
  const humanBodies = humanParams
    .map(bodyFactoryParamWithId => {
      const humanBody = createHumanBody(bodyFactoryParamWithId.meta, env);
      humanBody.id = bodyFactoryParamWithId.id;
      return humanBody;
    })
    .map(humanBody => {
      humanBody.revivedPathologies = reviveAfflictedPathologies(
        computeInitialAfflictedPathologies(humanBody)
      );
      humanBody.effects = computeInitialEffects(humanBody);
      return humanBody;
    });

  const patients: PatientState[] = humanBodies.map(humanBody => {
    return {
      patientId: humanBody.id!,
      humanBody: humanBody,
      preTriageResult: undefined,
      location: { kind: 'FixedMapEntity', locationId: LOCATION_ENUM.chantier },
    };
  });
  computeNewPatientsState(patients, initialTimeJump);
  patientCache[hash] = patients;
  return patients;
}
