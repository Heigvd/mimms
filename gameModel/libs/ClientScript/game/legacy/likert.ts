import { formatMetric } from '../patientZoom/currentPatientZoom';
import { getDrillStatus } from '../pretri/drill';
import { BodyStateKeys, computeMetas } from '../../HUMAn/human';
import {
  CellDef,
  DataDef,
  EnhancedCellData,
  MatrixConfig,
  setMatrixState,
} from '../../edition/MatrixEditor';
import { ClKeys, LikertData, PhKeys, run_likert } from '../../HUMAn/run';
import {
  getCurrentPatientBodyParam,
  getCurrentPatientId,
  getSortedPatientIds,
} from '../../tools/WegasHelper';
import { getTranslation } from '../../tools/translation';
import { PatientId } from '../common/baseTypes';

export function isThereAnythingToSave() {
  return Context.likertSaveState.state.somethingToSave;
}

function syncUI() {
  Context.likertSaveState.setState({ somethingToSave: true });
  setMatrixState(state => {
    return { ...state, toggle: !state.toggle };
  });
  //saveData();
}

export async function selectPatient(patientId: string) {
  await saveData();
  return APIMethods.runScript(
    `
	Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'ongoing');
	Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');
	`,
    {}
  );
}

export async function gotoValidatePage() {
  await saveData();
  return APIMethods.runScript(
    `Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'completed_summary');
	 		 Variable.find(gameModel, 'currentPatient').setValue(self, '');`,
    {}
  );
}

/** PAGE STATE */

interface LikertState {
  data: 'NOT_INITIALIZED' | 'INITIALIZING' | 'INITIALIZED';
}

export function getInitialLikertState(): LikertState {
  return {
    data: 'NOT_INITIALIZED',
  };
}

export function getLikertState(): LikertState {
  return Context.likertState.state;
}

export function setLikertState(state: LikertState | ((state: LikertState) => LikertState)) {
  Context.likertState.setState(state);
}

function shouldShowDemographicPage(): boolean {
  if (!Variable.find(gameModel, 'collectDemographicData').getValue(self)) {
    // do not show demographic page ever
    return false;
  }

  if (Variable.find(gameModel, 'demographicsValidated').getValue(self)) {
    // demographic validated
    return false;
  }

  return true;
}

export function getLikertPage(): string {
  const status = getDrillStatus();
  if (status === 'not_started') {
    return '22';
  }
  const shouldShowDemographic = shouldShowDemographicPage();

  const state = getLikertState();
  if (state.data === 'NOT_INITIALIZED') {
    setLikertState({ data: 'INITIALIZING' });
    initAllPatients();
    // display demographic page while loading data
    return shouldShowDemographic ? '40' : '27';
  } else if (state.data === 'INITIALIZING') {
    // display demographic page while loading data
    return shouldShowDemographic ? '40' : '27';
  } else {
    if (shouldShowDemographic) {
      return '40';
    }

    switch (status) {
      case 'ongoing':
      case 'completed_summary':
      case 'completed_review':
        return '17';
      case 'validated':
        return '23';
    }
  }
  return '404';
}

export async function nextUndonePatient() {
  const allIds = getSortedPatientIds();

  let currentIndex = allIds.indexOf(getCurrentPatientId());

  let counter = 0;

  do {
    currentIndex = (currentIndex + 1) % allIds.length;
    counter++;
  } while (counter < allIds.length && isPatientDone(allIds[currentIndex]!));

  if (counter >= allIds.length) {
    // no undone patient
    return gotoValidatePage();
  } else {
    const newPatientId = allIds[currentIndex]!;
    return selectPatient(newPatientId);
  }
}

export function prettyPrintCurrentPatientMeta() {
  const id = getCurrentPatientId();
  const param = getCurrentPatientBodyParam();
  let title = '';

  if (param) {
    //const { meta } = computeMetas(param);
    title = `${id}`;
  } else {
    title = 'P?';
  }

  return `<h1>${title}</h1>`;
}

export function prettyPrintCurrentPatientInfos() {
  const param = getCurrentPatientBodyParam();
  let title = '';

  if (param) {
    const { meta } = computeMetas(param);

    const age = meta.age;
    const sex = getTranslation('human-general', meta.sex, false);
    const years = getTranslation('human-general', 'years', false);
    title = `${sex}, ${age} ${years}, ${meta.height_cm}cm, ${meta.effectiveWeight_kg.toFixed()}kg`;
  } else {
    title = '';
  }

  return `${title}`;
}

export function prettyPrintCurrentPatientScript(): string {
  const param = getCurrentPatientBodyParam();
  return param?.description || '';
}

type TimeId = string;
type KeyId = string;

export type LikertLevel = 1 | 2 | 3 | 4 | 5;

//const lickerCellDef_select: CellDef[] = [
//	{
//		type: 'enum',
//		label: 'licekrt',
//		values: [
//			{
//				label: '-',
//				value: undefined,
//			},
//			{
//				label: 'impossible',
//				value: 1,
//			},
//			{
//				label: 'unlikely',
//				value: 2,
//			},
//			{
//				label: 'acceptable',
//				value: 3,
//			},
//			{
//				label: 'quite realistic',
//				value: 4,
//			},
//			{
//				label: 'fully realistic',
//				value: 5,
//			},
//		],
//	},
//];

const lickerCellDef: CellDef[] = [
  /*{
		type: 'enum',
		label: '-',
		values: [
			{
				label: 'undef',
				value: undefined,
			}
		],
	},*/
  {
    type: 'enum',
    label: '1',
    tooltip: getTranslation('general-likert', 'impossible'),
    values: [
      {
        label: getTranslation('general-likert', 'impossible'),
        value: 1,
      },
    ],
  },
  {
    type: 'enum',
    label: '2',
    tooltip: getTranslation('general-likert', 'unlikely'),
    values: [
      {
        label: getTranslation('general-likert', 'unlikely'),
        value: 2,
      },
    ],
  },
  {
    type: 'enum',
    label: '3',
    tooltip: getTranslation('general-likert', 'acceptable'),
    values: [
      {
        label: getTranslation('general-likert', 'acceptable'),
        value: 3,
      },
    ],
  },
  {
    type: 'enum',
    label: '4',
    tooltip: getTranslation('general-likert', 'quite-realistic'),
    values: [
      {
        label: getTranslation('general-likert', 'quite-realistic'),
        value: 4,
      },
    ],
  },
  {
    type: 'enum',
    label: '5',
    tooltip: getTranslation('general-likert', 'fully-realistic'),
    values: [
      {
        label: getTranslation('general-likert', 'fully-realistic'),
        value: 5,
      },
    ],
  },
];

type LikertMatrixCell = undefined | LikertLevel;

const currentData: Record<string, { data: LikertData; cardiacArrest: number | undefined }> = {};

type Matrix = Record<TimeId, Record<KeyId, EnhancedCellData<LikertMatrixCell>>>;

const clinicalMatrix: Record<string, Matrix> = {};

const physiologicalMatrix: Record<string, Matrix> = {};

const comments: Record<string, string> = {};

type PMatrix = Record<TimeId, Record<KeyId, LikertMatrixCell>>;

interface PersistedMatrix {
  clinical: PMatrix;
  physio: PMatrix;
  comments: string;
}

type LikertOnChangeFn = (x: DataDef<TimeId>, y: DataDef<KeyId>, value: LikertMatrixCell) => void;

function prettyPrintValue(metric: string, value: unknown): string {
  return formatMetric(metric as BodyStateKeys, value)[1];
}

function prettyPrintKey(metric: string): string {
  return formatMetric(metric as BodyStateKeys, 0)[0];
}

function getPersistedData(patientId: string): PersistedMatrix {
  const oi = Variable.find(gameModel, 'likert').getInstance(self);
  const data = oi.getProperties()[patientId];
  if (data) {
    return JSON.parse(data);
  } else {
    return {
      clinical: {},
      physio: {},
      comments: '',
    };
  }
}

function convertData(data: Data): PersistedMatrix {
  const pm: PersistedMatrix = {
    clinical: {},
    physio: {},
    comments: data.comments,
  };

  Object.entries(data.clMatrix).forEach(([timeId, keys]) => {
    Object.entries(keys).forEach(([keyId, value]) => {
      pm.clinical[timeId] = pm.clinical[timeId] || {};
      if (typeof value === 'object') {
        pm.clinical[timeId]![keyId] = value.value;
      } else {
        pm.clinical[timeId]![keyId] = value;
      }
    });
  });

  Object.entries(data.phMatrix).forEach(([timeId, keys]) => {
    Object.entries(keys).forEach(([keyId, value]) => {
      pm.physio[timeId] = pm.physio[timeId] || {};
      if (typeof value === 'object') {
        pm.physio[timeId]![keyId] = value.value;
      } else {
        pm.physio[timeId]![keyId] = value;
      }
    });
  });

  return pm;
}

interface Data {
  data: LikertData;
  cardiacArrest: number | undefined;
  clMatrix: Matrix;
  phMatrix: Matrix;
  comments: string;
}

/*
function check(matrix: Matrix, data: Record<string, Serie>): boolean {
	for (const mKey in data) {
		for (const mTime in data[mKey]) {
			if (matrix[mTime]) {
				const cell = matrix[mTime]![mKey];
				const value = typeof cell === 'object' ? cell.value : cell;
				if (value == null) {
					return false;
				}
			} else {
				return false;
			}
		}
	}
	return true;
}

export function isPatientDone(patientId: string): boolean {
	const data = currentData[patientId];
	const clMmatrix = clinicalMatrix[patientId];
	const phMmatrix = physiologicalMatrix[patientId];

	if (data == null || clMmatrix == null || phMmatrix == null) {
		return false;
	}

	if (check(clMmatrix, data.clinical)
		&& check(phMmatrix, data.physiological)) {
		return true;
	}

	return false;
}*/

function countCell(matrix: PMatrix) {
  let counter = 0;
  Object.values(matrix).forEach(timeSerie => {
    counter += Object.values(timeSerie).filter(x => x).length;
  });
  return counter;
}

export function isPatientDone(patientId: string): boolean {
  //const data = currentData[patientId];

  const liveData = getPatientData(patientId);
  const persistedData = convertData(liveData);

  if (countCell(persistedData.clinical) < 30 || countCell(persistedData.physio) < 30) {
    return false;
  }

  return true;
}

export function areAllPatientsCompleted(): boolean {
  const ids = getSortedPatientIds();
  for (const id of ids) {
    if (!isPatientDone(id)) {
      return false;
    }
  }
  return true;
}

export function isCurrentPatientDone(): boolean {
  const patientId = getCurrentPatientId();
  return isPatientDone(patientId);
}

interface MenuItem {
  id: string;
  completed: boolean;
}

export function getPatientMenu(): MenuItem[] {
  return getSortedPatientIds().map(pId => ({
    id: pId,
    completed: isPatientDone(pId),
  }));
}

function getPatientData(patientId: string, force: boolean = false): Data {
  if (currentData[patientId] == null || force) {
    wlog('RUN MODEL FOR PATIENT ', patientId);
    currentData[patientId] = run_likert(patientId);
  }
  const patientData = currentData[patientId]!;
  const data = getPersistedData(patientId);

  if (clinicalMatrix[patientId] == null || force) {
    clinicalMatrix[patientId] = {};
    const clKeys = Object.keys(patientData.data.clinical) as ClKeys[];
    const times = Object.keys(patientData.data.clinical[clKeys[0]!]);
    times.forEach(time => {
      clinicalMatrix[patientId]![time] = {};
      clKeys.forEach(clKey => {
        clinicalMatrix[patientId]![time]![clKey] = {
          label: prettyPrintValue(clKey, patientData.data.clinical[clKey][+time]),
          value: (data.clinical[+time] || {})[clKey],
        };
      });
    });
  }

  if (physiologicalMatrix[patientId] == null || force) {
    physiologicalMatrix[patientId] = {};
    const keys = Object.keys(patientData.data.physiological) as PhKeys[];
    const times = Object.keys(patientData.data.physiological[keys[0]!]);
    times.forEach(time => {
      physiologicalMatrix[patientId]![time] = {};
      keys.forEach(key => {
        physiologicalMatrix[patientId]![time]![key] = {
          label: prettyPrintValue(key, patientData.data.physiological[key]![+time]),
          value: (data.physio[+time] || {})[key],
        };
      });
    });
  }

  if (comments[patientId] == null || force) {
    comments[patientId] = data.comments;
  }

  return {
    data: patientData.data,
    cardiacArrest: patientData.cardiacArrest,
    clMatrix: clinicalMatrix[patientId]!,
    phMatrix: physiologicalMatrix[patientId]!,
    comments: comments[patientId] || '',
  };
}

function getCurrentPatientData(force: boolean = false): Data {
  const patientId = getCurrentPatientId();
  return getPatientData(patientId, force);
}

export function getCurrentPatientFinalState(): string {
  const cardiacArrest = getCurrentPatientData().cardiacArrest;
  if (cardiacArrest /* > 0*/) {
    return `${getTranslation('general-likert', 'died-after')} ${formatSecond(
      cardiacArrest
    )}</strong>`;
  } else {
    return getTranslation('general-likert', 'still-alive');
  }
}

export function initAllPatients() {
  const state = Context.likertState;
  setTimeout(() => {
    const allIds = getSortedPatientIds();
    allIds.forEach(pId => getPatientData(pId));
    state.setState({ data: 'INITIALIZED' });
  }, 500);
}

function formatSecond(time: number) {
  if (time <= 0) {
    return 'état initial';
  }

  if (time < 60) {
    return `${time}s`;
  } else if (time < 3600) {
    const min = Math.floor(time / 60);
    const sec = time - min * 60;
    return `${min}m ${sec}s`;
  } else {
    const hour = Math.floor(time / 3600);
    const rest = time - hour * 3600;
    const min = Math.floor(rest / 60);
    const sec = rest - min * 60;
    return `${hour}h ${min}m ${sec}s`;
  }
}

/************************************* Clinical Matrix Config ********************************************/

const ClinicalLikertOnChangeRefName = 'clinicalOnChange';

const onClinicalChangeRef = Helpers.useRef<LikertOnChangeFn>(
  ClinicalLikertOnChangeRefName,
  () => {}
);

onClinicalChangeRef.current = (x, y, newData) => {
  const timeId = x.id;
  const keyId = y.id;

  const patientId = getCurrentPatientId();

  const current = clinicalMatrix[patientId]![timeId]![keyId];
  if (typeof current === 'object') {
    clinicalMatrix[patientId]![timeId]![keyId] = { label: current.label, value: newData };
  } else {
    clinicalMatrix[patientId]![timeId]![keyId] = newData;
  }

  syncUI();
};

export function getClinicalMatrix(): MatrixConfig<TimeId, KeyId, LikertMatrixCell> {
  const data = getCurrentPatientData();

  return {
    x: Object.keys(data.clMatrix).map(time => ({
      id: time,
      label: formatSecond(+time),
    })),
    y: Object.keys(data.clMatrix[0]!).map(key => ({
      id: key,
      label: prettyPrintKey(key),
    })),
    data: data.clMatrix,
    cellDef: lickerCellDef,
    hideFilter: true,
    onChangeRefName: ClinicalLikertOnChangeRefName,
  };
}

/************************************* Physiological Matrix Config ********************************************/

const PhysioLikertOnChangeRefName = 'physioOnChange';

const onPhysioChangeRef = Helpers.useRef<LikertOnChangeFn>(PhysioLikertOnChangeRefName, () => {});

onPhysioChangeRef.current = (x, y, newData) => {
  const timeId = x.id;
  const keyId = y.id;

  const patientId = getCurrentPatientId();

  const current = physiologicalMatrix[patientId]![timeId]![keyId];
  if (typeof current === 'object') {
    physiologicalMatrix[patientId]![timeId]![keyId] = { label: current.label, value: newData };
  } else {
    physiologicalMatrix[patientId]![timeId]![keyId] = newData;
  }

  syncUI();
};

export function getPhysioMatrix(): MatrixConfig<TimeId, KeyId, LikertMatrixCell> {
  const data = getCurrentPatientData();

  return {
    x: Object.keys(data.phMatrix).map(time => ({
      id: time,
      label: formatSecond(+time),
    })),
    y: Object.keys(data.phMatrix[0]!).map(key => ({
      id: key,
      label: prettyPrintKey(key),
    })),
    data: data.phMatrix,
    cellDef: lickerCellDef,
    hideFilter: true,
    onChangeRefName: PhysioLikertOnChangeRefName,
  };
}

/*************** Comments ****************/
export function getCurrentPatientComments(): string {
  const data = getCurrentPatientData();
  return data.comments;
}

export function saveCurrentPatientComments(newComments: string) {
  const id = getCurrentPatientId();
  comments[id] = newComments;
  syncUI();
}

/*************** Persistance **************/

export async function saveMatrix() {
  return saveData();
}

export async function saveData() {
  if (Context.likertSaveState?.state?.somethingToSave) {
    const data = getCurrentPatientData();
    const pData = convertData(data);
    const patientId = getCurrentPatientId();

    const script = `Variable.find(gameModel, 'likert').setProperty(self, '${patientId}', ${JSON.stringify(
      JSON.stringify(pData)
    )})`;
    const result = await APIMethods.runScript(script, {});
    Context.likertSaveState.setState({ somethingToSave: false });
    return result;
  }
}

type TeamId = string;
type TimeRef = string;
type MetricName = string;
type Value = number;

type RawData = Record<
  TeamId,
  Record<
    PatientId,
    {
      clinical: Record<TimeRef, Record<MetricName, Value>>;
      physio: Record<TimeRef, Record<MetricName, Value>>;
      comments: string;
    }
  >
>;

const demographicVariables = [
  'gender',
  'age',
  'fmh',
  'fmhInternalMedicine',
  'fmhAnesthesiology',
  'fmhIntensiveMedicine',
  'fmhOther',
  'fmhOtherDetails',
  'afc',
  'afcIntraHosp',
  'afcExtraHosp',
  'ySinceDiploma',
  'yPreHospXp',
] as const;

type DemoKey = typeof demographicVariables[number];

type RawDemographics = Record<DemoKey, string | number | boolean>;

interface RawFullData {
  data: RawData;
  demographics: Record<TeamId, RawDemographics>;
}

function formatCsvCell(data: unknown): string {
  // wlog("Format ", data);
  const str = String(data);
  if (str.indexOf(',') >= 0 || str.indexOf('\n') >= 0 || str.indexOf('\r') >= 0) {
    return `"${str.replace(/"/g, '""')}"`;
  } else {
    return str;
  }
}
function formatCsvLine(...cells: unknown[]) {
  //wlog("format data", cells);
  return cells.map(cell => formatCsvCell(cell)).join(', ');
}

const mTypes = ['clinical', 'physio'] as const;

function pushValue(
  allData: Record<string, Record<number, string>>,
  expertId: number,
  patientId: string,
  time: string | undefined,
  metricName: string,
  value: string
) {
  const colName = `p-${patientId}_${time != null ? `t${time}` : ''}-${metricName}`;
  allData[colName] = allData[colName] || {};
  allData[colName]![expertId] = value;
}

export async function getAllLikertData() {
  const result = await APIMethods.runScript('getLickerData();', {});
  const fullData = result.updatedEntities[0] as RawFullData;
  wlog('FullData: ', fullData);
  const data = fullData.data;
  const csv: string[] = [];

  let counter = 1;

  // Collect all data
  const experts: number[] = [];
  //                     metric name    expert  value
  const allData: Record<string, Record<number, string>> = {};

  const expertToTeamIdMap: Record<number, string> = {};

  Object.entries(data).forEach(([teamId, teamData]) => {
    const expertId = counter++;
    expertToTeamIdMap[expertId] = teamId;
    experts.push(expertId);

    Object.entries(teamData).forEach(([patientId, patientData]) => {
      pushValue(allData, expertId, patientId, undefined, 'comments', patientData.comments);
      mTypes.forEach(mType => {
        const mData = patientData[mType];
        Object.entries(mData).forEach(([time, timeData]) => {
          Object.entries(timeData).forEach(([metric, value]) => {
            pushValue(allData, expertId, patientId, time, prettyPrintKey(metric), String(value));
          });
        });
      });
    });
  });

  const keys = Object.keys(allData).sort();
  // print header
  csv.push(formatCsvLine('expert', ...demographicVariables, ...keys));
  for (const expertId of experts) {
    csv.push(
      formatCsvLine(
        expertId,
        ...demographicVariables.map(
          dKey => fullData.demographics[expertToTeamIdMap[expertId]!]![dKey]
        ),
        ...keys.map(key => allData[key]![expertId] || '')
      )
    );
  }

  const txt = csv.join('\n');
  Helpers.downloadDataAsFile('likert.csv', txt);
}

/**
 * Read-only data
 * Pathology Editor
 */
export function getClinicalMatrixRO(): MatrixConfig<TimeId, KeyId, LikertMatrixCell> {
  return {
    ...getClinicalMatrix(),
    cellDef: [],
  };
}

export function getPhysioMatrixRO(): MatrixConfig<TimeId, KeyId, LikertMatrixCell> {
  return {
    ...getPhysioMatrix(),
    cellDef: [],
  };
}

export async function runAgain() {
  getCurrentPatientData(true);
  Context.livePathologyEditorState.setState((s: any) => ({ toggle: !s.toggle }));
}
