import { generateRandomPatient } from '../edition/patientGeneration';
import { PathologyId, PatientId, SimDuration } from '../game/common/baseTypes';
import { TimeSliceDuration } from '../game/common/constants';
import {
  computeInitialAfflictedPathologies,
  computeInitialEffects,
  computeNewPatientsState,
  getInitialTimeJumpSeconds,
  reviveAfflictedPathologies,
} from '../game/common/patients/handleState';
import { doPatientAutomaticTriage } from '../game/common/patients/pretriage';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { PatientState } from '../game/common/simulationState/patientState';
import { getPriorityByCategoryId, STANDARD_CATEGORY } from '../game/pretri/triage';
import { BodyFactoryParam, createHumanBody } from '../HUMAn/human';
import { getPathologies } from '../HUMAn/registries';
import { entries, makeAsync } from '../tools/helper';
import { patientGenerationLogger } from '../tools/logger';
import {
  alphaNumericSort,
  getEnv,
  getPatientsBodyFactoryParams,
  parseObjectDescriptor,
  saveToObjectDescriptor,
} from '../tools/WegasHelper';

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

interface PatientEntry {
  id: PatientId;
  samples: PatientSamples;
}

export type PatientSamples = Record<SimDuration, PatientState>;
let patientsSamplesCache: Record<PatientId, PatientSamples> = {};
let cacheInitDone = false;

/**
 * foreach mapping for all patients
 */
export function getPatientsSamples(): PatientEntry[] {
  const sortFunc = getGenCtx().state?.sort === 'id' ? sortById : sortByPriority;
  return Object.entries(patientsSamplesCache)
    .map(([id, v]) => {
      return { id: id, samples: v };
    })
    .sort(sortFunc);
}

/**
 * Foreach adapter for a patient's time samples
 */
export function getPatientSamples(
  patient: PatientSamples
): { time: number; patient: PatientState }[] {
  return entries(patient).map(([k, v]) => {
    return { time: k, patient: v };
  });
}

export function getSampleTimesSec(): number[] {
  const t0 = getInitialTimeJumpSeconds();
  const times = [t0];
  for (let i = 1; i < SAMPLES_NUMBER; i++) {
    times.push(t0 + i * SAMPLE_INTERVAL_SEC);
  }
  return times;
}

export function resetAll(): void {
  savePatients({});
  patientsSamplesCache = {};
  getGenCtx().setState(getDefaultGenerationState());
}

export function deleteOne(id: PatientId): void {
  const patientsParams = getPatientsBodyFactoryParams();
  delete patientsSamplesCache[id];
  delete patientsParams[id];
  savePatients(patientsParams);
}

export async function regenerateOne(id: PatientId): Promise<void> {
  const t0 = getInitialTimeJumpSeconds();
  if (!patientsSamplesCache[id] || !patientsSamplesCache[id]![t0]) {
    patientGenerationLogger.error('Patient does not exist (id)', id);
    return;
  }

  const patientT0 = patientsSamplesCache[id]![t0];

  const target: InjuryCategoryStats = { dead: 0, immediate: 0, non_urgent: 0, urgent: 0 };
  const cat = patientT0?.preTriageResult?.categoryId;
  if (cat) {
    target[cat as STANDARD_CATEGORY] = 1;
  }

  const patientsParams = getPatientsBodyFactoryParams();
  const { instance, bodyParams } = await makeAsync(
    _ => bestEffortGenerate(patientsParams, target, MAX_RETRIES * 2),
    {}
  );
  //keep old id
  patientsParams[id] = bodyParams;
  instance.patientId = id;
  updateCache(instance);
  savePatients(patientsParams);
}

export async function addPatientsAsync(
  targetStats: InjuryCategoryStats
): Promise<Record<PatientId, BodyFactoryParam>> {
  const t = Date.now();
  const genCtx = getGenCtx();
  const total = Object.values(targetStats).reduce((acc, v) => acc + v, 0);
  genCtx.state = Helpers.cloneDeep(genCtx.state);
  genCtx.state.status = 'generating-modal';
  genCtx.state.generation.pending = total;
  genCtx.setState(genCtx.state);

  const stillNeeded = Helpers.cloneDeep(targetStats);

  const existingPatients: Record<string, BodyFactoryParam> = getPatientsBodyFactoryParams();

  const tasks: Promise<void>[] = [];
  const genFunction = (ctx: GenerationCtx) =>
    bestEffortGenerateAndStore(existingPatients, stillNeeded, ctx);

  for (let i = 0; i < total; i++) {
    tasks.push(makeAsync(genFunction, genCtx, 1));
  }
  await Promise.all(tasks);

  savePatients(existingPatients);
  patientGenerationLogger.info('Generation duration', Date.now() - t);
  genCtx.setState(getDefaultGenerationState());
  return existingPatients;
}

export function initCache(force: boolean = false): void {
  if (cacheInitDone && !force) return;
  const existingPatients: Record<string, BodyFactoryParam> = getPatientsBodyFactoryParams();
  for (const id in existingPatients) {
    const ps = instantiateAndPretriage(id, existingPatients[id]!);
    updateCache(ps);
  }
  cacheInitDone = true;
}

function bestEffortGenerateAndStore(
  patients: Record<PatientId, BodyFactoryParam>,
  remaining: InjuryCategoryStats,
  genCtx: GenerationCtx
) {
  let { instance, bodyParams } = bestEffortGenerate(patients, remaining, MAX_RETRIES);

  const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY;
  if (!cat) {
    throw new Error('Patient should have a category. ' + JSON.stringify(instance));
  }
  remaining[cat] = (remaining[cat] || 0) - 1;
  patientGenerationLogger.info(remaining);
  patients[instance.patientId] = bodyParams;
  updateCache(instance);
  incrementGenerated(genCtx);
}

function incrementGenerated(genState: GenerationCtx): void {
  const clone = Helpers.cloneDeep(genState.state);
  clone.generation.generated++;
  genState.state = clone;
  genState.setState(clone);
}

function bestEffortGenerate(
  patients: Record<PatientId, BodyFactoryParam>,
  remaining: InjuryCategoryStats,
  maxAttempts: number
): { instance: PatientState; bodyParams: BodyFactoryParam } {
  let { instance, bodyParams } = generateOnePatientAndTriage(patients);

  for (let r = 0; r < maxAttempts; r++) {
    const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY;
    if (cat && remaining[cat] > 0) {
      break;
    }
    ({ instance, bodyParams } = generateOnePatientAndTriage(patients));
  }
  return { instance, bodyParams };
}

function generateOnePatientAndTriage(patients: Record<PatientId, BodyFactoryParam>): {
  instance: PatientState;
  bodyParams: BodyFactoryParam;
} {
  const { uid, params } = generateRandomPatient(patients);
  const patientState = instantiateAndPretriage(uid, params);
  return {
    bodyParams: params,
    instance: patientState,
  };
}

function instantiateAndPretriage(id: string, params: BodyFactoryParam): PatientState {
  const humanBody = createHumanBody(params, getEnv());
  humanBody.id = id;
  humanBody.revivedPathologies = reviveAfflictedPathologies(
    computeInitialAfflictedPathologies(humanBody)
  );
  humanBody.effects = computeInitialEffects(humanBody);
  const patientState: PatientState = {
    patientId: id,
    humanBody: humanBody,
    preTriageResult: undefined,
    location: { kind: 'FixedMapEntity', locationId: LOCATION_ENUM.chantier },
  };
  computeNewPatientsState([patientState], getInitialTimeJumpSeconds(), false);
  patientState.preTriageResult = doPatientAutomaticTriage(
    humanBody,
    getInitialTimeJumpSeconds(),
    false
  );
  return patientState;
}

/**
 * Instance is expected to be at T0 (after initial time interval elapsed)
 */
function updateCache(startInstance: PatientState): void {
  const id: PatientId = startInstance.patientId;
  const entry: PatientSamples = {};
  let sampleInstance = startInstance;
  let t = startInstance.humanBody.state.time;
  entry[t] = sampleInstance;
  for (let i = 1; i < SAMPLES_NUMBER; i++) {
    sampleInstance = Helpers.cloneDeep(sampleInstance);
    computeNewPatientsState([sampleInstance], SAMPLE_INTERVAL_SEC, false);
    t = sampleInstance.humanBody.state.time;
    sampleInstance.preTriageResult = doPatientAutomaticTriage(sampleInstance.humanBody, t, false);
    entry[t] = sampleInstance;
  }
  patientsSamplesCache[id] = entry;
}

interface PatientGenerationState {
  status: 'patient-list' | 'pathology-modal' | 'stats-modal' | 'patient-modal' | 'generating-modal';
  sort: 'id' | 'priority';
  generation: {
    pending: number;
    generated: number;
  };
}

function getDefaultGenerationState(): PatientGenerationState {
  return {
    status: 'patient-list',
    sort: 'priority',
    generation: {
      generated: 0,
      pending: 0,
    },
  };
}

export function getTypedGenState(): PatientGenerationState {
  return Context.genState.state as PatientGenerationState;
}

type GenerationCtx = {
  state: PatientGenerationState;
  setState: (newCtx: PatientGenerationState) => void;
};

function getGenCtx(): GenerationCtx {
  return Context.genState as GenerationCtx;
}

function savePatients(patients: Record<PatientId, BodyFactoryParam>): void {
  const patientDesc = Variable.find(gameModel, 'patients');
  saveToObjectDescriptor(patientDesc, patients);
}

// PATHOLOGY =============================================================================

export function getPathologiesChoices(): { id: PathologyId; selected: boolean; label: string }[] {
  const saved = parseObjectDescriptor<boolean>(Variable.find(gameModel, 'selected_pathologies'));
  return getPathologies().map(p => ({
    id: p.value,
    selected: saved[p.value] || false,
    label: p.label,
  }));
}

export function togglePathology(id: PathologyId): void {
  const desc = Variable.find(gameModel, 'selected_pathologies');
  const current = parseObjectDescriptor<boolean>(desc);
  current[id] = !current[id];
  saveToObjectDescriptor(desc, current);
}

// SORTING
function sortById(a: PatientEntry, b: PatientEntry): number {
  return alphaNumericSort(a.id, b.id);
}

function sortByPriority(a: PatientEntry, b: PatientEntry): number {
  const t0 = getInitialTimeJumpSeconds();
  if (a.samples[t0] && b.samples[t0]) {
    const catA = a.samples[t0]?.preTriageResult?.categoryId || 'dead';
    const prioA = getPriorityByCategoryId(catA);

    const catB = b.samples[t0]?.preTriageResult?.categoryId || 'dead';
    const prioB = getPriorityByCategoryId(catB);
    return prioA > prioB ? 1 : -1;
  }
  return 0;
}
