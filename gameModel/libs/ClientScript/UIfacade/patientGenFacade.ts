// TODO generate patients function

import { generateRandomPatient } from '../edition/patientGeneration';
import { PatientId, SimDuration } from '../game/common/baseTypes';
import { TimeSliceDuration } from '../game/common/constants';
import {
  computeInitialAfflictedPathologies,
  computeInitialEffects,
  computeNewPatientsState,
  reviveAfflictedPathologies,
} from '../game/common/patients/handleState';
import { doPatientAutomaticTriage } from '../game/common/patients/pretriage';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { PatientState } from '../game/common/simulationState/patientState';
import { STANDARD_CATEGORY } from '../game/pretri/triage';
import { BodyFactoryParam, createHumanBody } from '../HUMAn/human';
import { makeAsync } from '../tools/helper';
import { getEnv, getPatientsBodyFactoryParams, saveToObjectDescriptor } from '../tools/WegasHelper';

export type InjuryCategoryStats = Record<STANDARD_CATEGORY, number>;

/**
 * Maximum number of attempts to generate a patient that fits in the required statistics
 */
const MAX_RETRIES = 50;

/**
 * Number of samples after injury to compute for view
 */
const SAMPLES_NUMBER = 4;

/**
 * Time interval between each sample
 */
const SAMPLE_INTERVAL_SEC = TimeSliceDuration * 15;

export type PatientSamples = Record<SimDuration, PatientState>;
let patientsSamplesCache: Record<PatientId, PatientSamples> = {};

export function getPatientsSamples(): { id: string; value: PatientSamples }[] {
  return Object.entries(patientsSamplesCache).map(([k, v]) => {
    return { id: k, value: v };
  });
}

export function getPatientSamples(
  patient: PatientSamples
): { id: string; patient: PatientState }[] {
  return Object.entries(patient).map(([k, v]) => {
    return { id: k, patient: v };
  });
}

export function addPatients(targetStats: InjuryCategoryStats): Record<PatientId, BodyFactoryParam> {
  const t = Date.now();
  const total = Object.values(targetStats).reduce((acc, v) => acc + v);

  const stillNeeded = Helpers.cloneDeep(targetStats);

  const patients: Record<string, BodyFactoryParam> = {};
  getPatientsBodyFactoryParams();
  for (let i = 0; i < total; i++) {
    bestEffortGenerate(patients, stillNeeded);
  }
  wlog(stillNeeded);
  wlog(Date.now() - t);
  return patients;
}

export function addPatientsAsync(
  targetStats: InjuryCategoryStats
): Promise<Record<PatientId, BodyFactoryParam>> {
  patientsSamplesCache = {}; // TODO remove
  const f = () => {
    const updatedPatientSet = addPatients(targetStats);
    const patientDesc = Variable.find(gameModel, 'patients');
    saveToObjectDescriptor(patientDesc, updatedPatientSet);
    return updatedPatientSet;
  };
  return makeAsync(f);
}

function bestEffortGenerate(
  patients: Record<PatientId, BodyFactoryParam>,
  remaining: InjuryCategoryStats
) {
  let { instance, bodyParams } = generateOnePatientAndTriage(patients);

  for (let r = 0; r < MAX_RETRIES; r++) {
    const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY; // ?? check
    if (cat && remaining[cat] > 0) {
      wlog(r);
      break;
    }
    ({ instance, bodyParams } = generateOnePatientAndTriage(patients));
  }

  const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY; // ?? check
  if (!cat) {
    throw new Error('Patient should have a category. ' + JSON.stringify(instance));
  }
  remaining[cat] = (remaining[cat] || 0) - 1;
  wlog(remaining);
  patients[instance.patientId] = bodyParams;
  updateCache(instance);
}

function generateOnePatientAndTriage(patients: Record<PatientId, BodyFactoryParam>): {
  instance: PatientState;
  bodyParams: BodyFactoryParam;
} {
  const { uid, params } = generateRandomPatient(patients);

  const humanBody = createHumanBody(params, getEnv());
  humanBody.id = uid;
  humanBody.revivedPathologies = reviveAfflictedPathologies(
    computeInitialAfflictedPathologies(humanBody)
  );
  humanBody.effects = computeInitialEffects(humanBody);
  const patientState: PatientState = {
    patientId: uid,
    humanBody: humanBody,
    preTriageResult: undefined,
    location: { kind: 'FixedMapEntity', locationId: LOCATION_ENUM.chantier },
  };
  computeNewPatientsState([patientState], getInitialTimeJumpSeconds(), getEnv());
  patientState.preTriageResult = doPatientAutomaticTriage(
    humanBody,
    getInitialTimeJumpSeconds(),
    false
  );
  return {
    bodyParams: params,
    instance: patientState,
  };
}

function getInitialTimeJumpSeconds(): number {
  return Variable.find(gameModel, 'patients-elapsed-minutes').getValue(self) * 60;
}

export function getSampleTimesSec(): number[] {
  const t0 = getInitialTimeJumpSeconds();
  const times = [t0];
  for (let i = 1; i < SAMPLES_NUMBER; i++) {
    times.push(t0 + i * SAMPLE_INTERVAL_SEC);
  }
  return times;
}

/**
 * Instance is expected to be at T0 (after initial time interval)
 */
function updateCache(startInstance: PatientState): void {
  const id: PatientId = startInstance.patientId;
  const entry: PatientSamples = {};
  let sampleInstance = startInstance;
  let t = startInstance.humanBody.state.time;
  entry[t] = sampleInstance;
  for (let i = 1; i < SAMPLES_NUMBER; i++) {
    sampleInstance = Helpers.cloneDeep(sampleInstance);
    computeNewPatientsState([sampleInstance], SAMPLE_INTERVAL_SEC, getEnv());
    t = sampleInstance.humanBody.state.time;
    sampleInstance.preTriageResult = doPatientAutomaticTriage(sampleInstance.humanBody, t, false);
    entry[t] = sampleInstance;
  }
  patientsSamplesCache[id] = entry;
}
