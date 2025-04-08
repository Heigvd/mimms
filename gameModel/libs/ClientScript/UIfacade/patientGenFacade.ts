import { generateRandomPatient } from '../edition/patientGeneration';
import { PathologyId, PatientId, SimDuration } from '../game/common/baseTypes';
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
import {
  getCategory,
  getPriorityByCategoryId,
  STANDARD_CATEGORY,
  STANDARD_CATEGORY_ARRAY,
} from '../game/pretri/triage';
import { BodyFactoryParam, createHumanBody } from '../HUMAn/human';
import { getPathologies } from '../HUMAn/registries';
import { getPathologyDefinitionById } from '../HUMAn/registry/pathologies';
import { group } from '../tools/groupBy';
import { entries, makeAsync, upperCaseFirst } from '../tools/helper';
import { patientGenerationLogger } from '../tools/logger';
import {
  alphaNumericSort,
  getEnv,
  getPatientsBodyFactoryParams,
  parseObjectDescriptor,
  saveToObjectDescriptor,
} from '../tools/WegasHelper';

/**
 * Maximum number of attempts to generate a patient that fits in the required statistics
 */
const MAX_RETRIES = 50;

/**
 * Default minutes at which patients state are computed for display
 */
const SAMPLE_VALUES_MINUTE: number[] = [0, 15, 30, 45, 60, 90, 120];

type PatientSamples = Record<SimDuration, PatientState>;
type BodyParamsWithPathology = BodyFactoryParam & { pathologyNames: string[] };

interface PatientEntry {
  id: PatientId;
  samples: PatientSamples;
  params: BodyParamsWithPathology;
}
type InjuryCategoryStats = Record<STANDARD_CATEGORY, number>;

let patientsSamplesCache: Record<PatientId, PatientSamples> = {};
let patientsBodyParamsCache: Record<PatientId, BodyParamsWithPathology> = {};
let cacheInitDone = false;

// restart scenario reset
Helpers.registerEffect(() => {
  patientsSamplesCache = {};
  patientsBodyParamsCache = {};
  cacheInitDone = false;
});

/**
 * foreach adapter for all patients
 */
export function getPatientsSamples(): PatientEntry[] {
  const genCtx = getGenCtx();
  const sortFunc = sortFunctions[genCtx?.state?.sort || 'priority'];
  return Object.entries(patientsSamplesCache)
    .map(([id, ps]) => {
      return { id: id, samples: ps, params: patientsBodyParamsCache[id]! };
    })
    .sort(sortFunc);
}

export function getPatientTotal(): { id: STANDARD_CATEGORY; count: number }[] {
  const t0 = getInitialTimeJumpSeconds();
  const grouped = group(
    getPatientsSamples(),
    entry => entry.samples[t0]?.preTriageResult?.categoryId || ''
  );
  delete grouped['']; // remove any undefined category
  const counts = Object.entries(grouped).map(([key, value]) => ({
    id: key as STANDARD_CATEGORY,
    count: value.length,
  }));
  STANDARD_CATEGORY_ARRAY.forEach(category => {
    if (counts.findIndex(c => c.id === category) === -1) {
      counts.push({ id: category, count: 0 });
    }
  });
  return counts;
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
  return times.concat(SAMPLE_VALUES_MINUTE.map(t => t * 60).filter(t => t > t0));
}

export function resetAll(): void {
  patientsSamplesCache = {};
  patientsBodyParamsCache = {};
  savePatients();
  getGenCtx().setState(getDefaultGenerationState());
}

export function deleteOne(id: PatientId): void {
  delete patientsSamplesCache[id];
  delete patientsBodyParamsCache[id];
  savePatients();
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

  const { instance, bodyParams } = await makeAsync(
    _ => bestEffortGenerate(target, MAX_RETRIES * 2),
    {}
  );
  //keep old id
  instance.patientId = id;
  updateCache(instance, bodyParams);
  savePatients();
}

export function totalExistingPatients(): number {
  return Object.values(getPatientsBodyFactoryParams()).length;
}

export async function addPatientsAsync(targetStats: InjuryCategoryStats): Promise<void> {
  const t = Date.now();
  const genCtx = getGenCtx();
  const total = Object.values(targetStats).reduce((acc, v) => acc + v, 0);
  genCtx.state = Helpers.cloneDeep(genCtx.state);
  genCtx.state.status = 'generating-modal';
  genCtx.state.generation.pending = total;
  genCtx.setState(genCtx.state);

  const stillNeeded = Helpers.cloneDeep(targetStats);

  const tasks: Promise<void>[] = [];
  const genFunction = (ctx: GenerationCtx) => bestEffortGenerateAndStore(stillNeeded, ctx);

  for (let i = 0; i < total; i++) {
    tasks.push(makeAsync(genFunction, genCtx, i * 10));
  }
  await Promise.all(tasks);

  savePatients();
  patientGenerationLogger.info('Generation duration', Date.now() - t);
  genCtx.setState(getDefaultGenerationState());
}

export function initCache(force: boolean = false): void {
  if (cacheInitDone && !force) return;
  const existingPatients: Record<string, BodyFactoryParam> = getPatientsBodyFactoryParams();
  for (const id in existingPatients) {
    const params = existingPatients[id]!;
    const ps = instantiateAndPretriage(id, params);
    updateCache(ps, params);
  }
  cacheInitDone = true;
}

function bestEffortGenerateAndStore(remaining: InjuryCategoryStats, genCtx: GenerationCtx) {
  const { instance, bodyParams } = bestEffortGenerate(remaining, MAX_RETRIES);

  const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY;
  if (!cat) {
    throw new Error('Patient should have a category. ' + JSON.stringify(instance));
  }
  remaining[cat] = (remaining[cat] || 0) - 1;
  patientGenerationLogger.info(remaining);
  updateCache(instance, bodyParams);
  incrementGenerated(genCtx);
}

function incrementGenerated(genState: GenerationCtx): void {
  const clone = Helpers.cloneDeep(genState.state);
  clone.generation.generated++;
  genState.state = clone;
  genState.setState(clone);
}

/**
 * Generates a random patients until one fits in the stats
 */
function bestEffortGenerate(
  remaining: InjuryCategoryStats,
  maxAttempts: number
): { instance: PatientState; bodyParams: BodyFactoryParam } {
  let { instance, bodyParams } = generateOnePatientAndTriage();

  for (let r = 0; r < maxAttempts; r++) {
    const cat = instance.preTriageResult?.categoryId as STANDARD_CATEGORY;
    if (cat && remaining[cat] > 0) {
      break;
    }
    ({ instance, bodyParams } = generateOnePatientAndTriage());
  }
  return { instance, bodyParams };
}

function generateOnePatientAndTriage(): {
  instance: PatientState;
  bodyParams: BodyFactoryParam;
} {
  const { uid, params } = generateRandomPatient(patientsBodyParamsCache);
  const patientState = instantiateAndPretriage(uid, params);
  return {
    bodyParams: params,
    instance: patientState,
  };
}

/**
 * Generates a random patient, updates it to T0, compute its pretriage
 */
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
 * Builds snapshots of patients at required times
 * startInstance is expected to be at T0 (after initial time interval elapsed)
 */
function updateCache(startInstance: PatientState, body: BodyFactoryParam): void {
  const id: PatientId = startInstance.patientId;
  const entry: PatientSamples = {};
  let sampleInstance = startInstance;
  let t = startInstance.humanBody.state.time;
  entry[t] = sampleInstance;
  const timeValues = getSampleTimesSec();
  for (let i = 1; i < timeValues.length; i++) {
    sampleInstance = Helpers.cloneDeep(sampleInstance);
    const delta = timeValues[i]! - timeValues[i - 1]!;
    computeNewPatientsState([sampleInstance], delta, false);
    t = sampleInstance.humanBody.state.time;
    sampleInstance.preTriageResult = doPatientAutomaticTriage(sampleInstance.humanBody, t, false);
    entry[t] = sampleInstance;
  }
  patientsSamplesCache[id] = entry;
  const pathoNames = body.scriptedEvents?.map(se => {
    if (se.payload.type === 'HumanPathology') {
      return getPathologyDefinitionById(se.payload.pathologyId)?.shortDescription || '';
    }
    return '';
  });
  patientsBodyParamsCache[id] = { ...body, pathologyNames: pathoNames || [] };
}

// INTERFACE STATE ============================================================
type ModalState =
  | 'patient-list'
  | 'pathology-modal'
  | 'stats-modal'
  | 'patient-modal'
  | 'generating-modal'
  | 'delete-all-modal';
interface PatientGenerationState {
  status: ModalState;
  sort: SortType;
  generation: {
    pending: number;
    generated: number;
    target: InjuryCategoryStats;
  };
  patientId: string;
  details: boolean;
}

export function setModalState(modalState: ModalState, patientId: PatientId = ''): void {
  const ctx = getGenCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  newState.status = modalState;
  newState.patientId = patientId;
  ctx.setState(newState);
}

export function setGenerationValue(category: STANDARD_CATEGORY, qty: number): void {
  const ctx = getGenCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  newState.generation.target[category] = qty;
  newState.generation.pending = Object.values(newState.generation.target).reduce(
    (acc, v) => acc + v,
    0
  );
  ctx.setState(newState);
}

export function totalPendingPatients() {
  return getTypedGenState()?.generation?.pending || 0;
}

export function getDefaultGenerationState(): PatientGenerationState {
  return {
    status: 'patient-list',
    sort: 'priority',
    generation: {
      generated: 0,
      pending: 0,
      target: {
        dead: 0,
        immediate: 0,
        non_urgent: 0,
        urgent: 0,
      },
    },
    patientId: '',
    details: false,
  };
}

export function getPatientModalData(selectedTime: number | undefined = undefined) {
  const mainState = getTypedGenState();
  const time = selectedTime || getInitialTimeJumpSeconds();
  const patient = patientsSamplesCache[mainState.patientId]![time];
  return { ...patient, observedBlock: '' };
}

export function setPatientModalData(selectedTime: number | undefined = undefined) {
  Context.currentPatient.setState(getPatientModalData(selectedTime));
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

function savePatients(): void {
  const patientDesc = Variable.find(gameModel, 'patients');
  saveToObjectDescriptor(patientDesc, patientsBodyParamsCache);
}

/**
 * Html formated pre-triage category
 */
export function categoryToHtml(categoryId: string | undefined): string {
  if (!categoryId) {
    return `<div class='tagCategory notCategorized'></div>`;
  }

  const cat = getCategory(categoryId)?.category;
  if (cat) {
    return `<div class='patientGenerationTagCategory' style="color: ${cat.color}; background-color: ${cat.bgColor}"></div>`;
  } else {
    return `Error: unresolved category: ${categoryId}`;
  }
}

// PATHOLOGIES =================================================================

export function getPathologiesChoices(): { id: PathologyId; selected: boolean; label: string }[] {
  const saved = parseObjectDescriptor<boolean>(Variable.find(gameModel, 'selected_pathologies'));
  return getPathologies().map(p => ({
    id: p.value,
    selected: saved[p.value] || false,
    label: upperCaseFirst(p.label),
  }));
}

export function togglePathology(id: PathologyId): void {
  const desc = Variable.find(gameModel, 'selected_pathologies');
  const current = parseObjectDescriptor<boolean>(desc);
  current[id] = !current[id];
  saveToObjectDescriptor(desc, current);
}

export function toggleAllPathologies(toggle: boolean): void {
  const current: Record<string, boolean> = {};
  getPathologies().forEach(p => {
    current[p.value] = toggle;
  });
  const desc = Variable.find(gameModel, 'selected_pathologies');
  saveToObjectDescriptor(desc, current);
}

export function anyPathologySelected(): boolean {
  const desc = Variable.find(gameModel, 'selected_pathologies');
  const current = parseObjectDescriptor<boolean>(desc);
  return Object.values(current).some(selected => selected);
}

// SORTING ====================================================================

type SortType = 'id' | 'priority';
type SortFunc = (a: PatientEntry, b: PatientEntry) => number;
const sortFunctions: Record<SortType, SortFunc> = {
  id: sortById,
  priority: sortByPriority,
};

function sortById(a: PatientEntry, b: PatientEntry): number {
  return alphaNumericSort(a.id, b.id);
}

function sortByPriority(a: PatientEntry, b: PatientEntry): number {
  const t0 = getInitialTimeJumpSeconds();
  if (a.samples[t0] && b.samples[t0]) {
    const catA = a.samples[t0]?.preTriageResult?.categoryId;
    const prioA = getPriorityByCategoryId(catA || 'dead');

    const catB = b.samples[t0]?.preTriageResult?.categoryId;
    const prioB = getPriorityByCategoryId(catB || 'dead');
    if (prioA !== prioB) {
      return prioA > prioB ? 1 : -1;
    }
  }
  return 0;
}
