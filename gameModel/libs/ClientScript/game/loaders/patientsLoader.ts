import { createHumanBody } from '../../HUMAn/human';
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

export function loadPatients(): PatientState[] {
  const env = getEnv();

  const humanBodies = getPatientsBodyFactoryParamsArray()
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
  computeNewPatientsState(patients, getInitialTimeJumpSeconds());
  return patients;
}
