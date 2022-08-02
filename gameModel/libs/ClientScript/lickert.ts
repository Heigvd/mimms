import { formatMetric } from './currentPatientZoom';
import { getDrillStatus } from './drill';
import { checkUnreachable } from './helper';
import { BodyStateKeys, computeMetas } from './HUMAn';
import {
	CellDef,
	DataDef,
	EhancedCellData,
	MatrixConfig,
} from './MatrixEditor';
import { prettyPrinterAfflictedPathology } from './pathology';
import { ClKeys, LickertData, PhKeys, run_lickert, Serie } from './RUN';
import {
	getCurrentPatientBodyParam,
	getCurrentPatientId,
	getSortedPatientIds,
} from './WegasHelper';

function save() {
	saveData();
}

export function selectPatient(patientId: string) {
	APIMethods.runScript(
		`
	Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'ongoing');
	Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');
	`,
		{},
	);
}

export function gotoValidatePage() {
	APIMethods.runScript(
		`Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'completed');
	 		 Variable.find(gameModel, 'currentPatient').setValue(self, '');`,
		{},
	);
}



/** PAGE STATE */


interface LickertState {
	data: 'NOT_INITIALIZED' | 'INITIALIZING' | 'INITIALIZED';
}

export function getInitialLickertState(): LickertState {
	return {
		data: 'NOT_INITIALIZED',
	};
}

export function getLickertState(): LickertState {
	return Context.lickertState.state;
}

export function setLickertState(state: LickertState | ((state: LickertState) => LickertState)) {
	Context.lickertState.setState(state);
}



export function getLickertPage(): string {
	const state = getLickertState();
	if (state.data === 'NOT_INITIALIZED') {
		setLickertState({ data: 'INITIALIZING' });
		initAllPatients();
		return "27";
	} else if (state.data === 'INITIALIZING') {
		return "27";
	} else {
		switch (getDrillStatus()) {
			case 'not_started':
				return '22';
			case 'ongoing':
			case 'completed':
				return '17';
			case 'validated':
				return '23';
		}
	}
	return "404";
}







export function nextUndonePatient() {
	const allIds = getSortedPatientIds();

	let currentIndex = allIds.indexOf(getCurrentPatientId());

	let counter = 0;

	do {
		currentIndex = (currentIndex + 1) % allIds.length;
		counter++;
	} while (counter < allIds.length && isPatientDone(allIds[currentIndex]!));

	if (counter >= allIds.length) {
		// no undone patient
		gotoValidatePage();
	} else {
		const newPatientId = allIds[currentIndex]!;
		selectPatient(newPatientId);
	}
}

export function nextPatient() {
	const allIds = getSortedPatientIds();
	const p = getCurrentPatientId();
	let np = '';
	if (p) {
		np = allIds[(allIds.indexOf(p) + 1) % allIds.length]!;
	} else {
		np = allIds[0]!;
	}
	selectPatient(np);
}

export function previousPatient() {
	const allIds = getSortedPatientIds();
	const p = getCurrentPatientId();
	let np = '';
	if (p) {
		np = allIds[(allIds.indexOf(p) - 1) % allIds.length]!;
	} else {
		np = allIds[0]!;
	}
	selectPatient(np);
}

export function prettyPrintCurrentPatientMeta() {
	const id = getCurrentPatientId();
	const param = getCurrentPatientBodyParam();
	let title = '';

	if (param) {
		const { meta } = computeMetas(param);
		title = `${id} - ${meta.sex}, ${meta.age}y, ${meta.height_cm
			}cm, ${meta.effectiveWeight_kg.toFixed()}kg`;
	} else {
		title = 'No patient';
	}

	return `<h1>${title}</h1>`;
}

export function prettyPrintCurrentPatientScript(): string {
	const param = getCurrentPatientBodyParam();

	if (param) {
		return (param.scriptedEvents || [])
			.map(sp => {
				if (sp.payload.type === 'HumanPathology') {
					return prettyPrinterAfflictedPathology(sp.payload);
				} else if (sp.payload.type === 'HumanTreatment') {
					const source = sp.payload.source;
					return `${source.type === 'act' ? source.actId : source.itemId}`;
				} else if (sp.payload.type === 'Teleport') {
					return '';
				} else {
					checkUnreachable(sp.payload)
				}
			})
			.join('<br />');
	} else {
		return '';
	}
}


type TimeId = string;
type KeyId = string;

export type LickertLevel = 1 | 2 | 3 | 4 | 5;

const lickerCellDef_select: CellDef[] = [
	{
		type: 'enum',
		label: 'licekrt',
		values: [
			{
				label: '-',
				value: undefined,
			},
			{
				label: 'impossible',
				value: 1,
			},
			{
				label: 'unlikely',
				value: 2,
			},
			{
				label: 'acceptable',
				value: 3,
			},
			{
				label: 'quite realistic',
				value: 4,
			},
			{
				label: 'fully realistic',
				value: 5,
			},
		],
	},
];

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
		tooltip: 'impossible',
		values: [
			{
				label: 'impossible',
				value: 1,
			},
		],
	},
	{
		type: 'enum',
		label: '2',
		tooltip: 'unlikely',
		values: [
			{
				label: 'unlikely',
				value: 2,
			},
		],
	},
	{
		type: 'enum',
		label: '3',
		tooltip: 'acceptable',
		values: [
			{
				label: 'acceptable',
				value: 3,
			},
		],
	},
	{
		type: 'enum',
		label: '4',
		tooltip: 'quite realistic',
		values: [
			{
				label: 'quite realistic',
				value: 4,
			},
		],
	},
	{
		type: 'enum',
		label: '5',
		tooltip: 'fully realistic',
		values: [
			{
				label: 'fully realistic',
				value: 5,
			},
		],
	},
];

type LickertMatrixCell = undefined | LickertLevel;

const currentData: Record<string, {data: LickertData, cardiacArrest: number | undefined}> = {};

type Matrix = Record<TimeId, Record<KeyId, EhancedCellData<LickertMatrixCell>>>;

const clinicalMatrix: Record<string, Matrix> = {};

const physiologicalMatrix: Record<string, Matrix> = {};

const timeMatrix: Record<string, Matrix> = {};

type PMatrix = Record<TimeId, Record<KeyId, LickertMatrixCell>>;

interface PersistedMatrix {
	clinical: PMatrix;
	physio: PMatrix;
	timing: PMatrix;
}

type LickertOnChangeFn = (x: DataDef<TimeId>, y: DataDef<KeyId>, value: LickertMatrixCell) => void;

function prettyPrintValue(metric: string, value: unknown): string {
	return formatMetric(metric as BodyStateKeys, value)[1];
}

function prettyPrintKey(metric: string): string {
	return formatMetric(metric as BodyStateKeys, 0)[0];
}

function getPersistedData(patientId: string): PersistedMatrix {
	const oi = Variable.find(gameModel, 'lickert').getInstance(self);
	const data = oi.getProperties()[patientId];
	if (data) {
		return JSON.parse(data);
	} else {
		return {
			clinical: {},
			physio: {},
			timing: {},
		};
	}
}

function convertData(data: Data): PersistedMatrix {
	const pm: PersistedMatrix = {
		clinical: {},
		physio: {},
		timing: {},
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

	Object.entries(data.timeMatrix).forEach(([timeId, keys]) => {
		Object.entries(keys).forEach(([keyId, value]) => {
			pm.timing[timeId] = pm.timing[timeId] || {};
			if (typeof value === 'object') {
				pm.timing[timeId]![keyId] = value.value;
			} else {
				pm.timing[timeId]![keyId] = value;
			}
		});
	});

	return pm;
}

interface Data {
	data: LickertData;
	cardiacArrest: number | undefined;
	clMatrix: Matrix;
	phMatrix: Matrix;
	timeMatrix: Matrix;
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
		counter += Object.values(timeSerie).length;
	});
	return counter;
}

export function isPatientDone(patientId: string): boolean {
	//const data = currentData[patientId];

	const persistedData = getPersistedData(patientId);

	if (countCell(persistedData.clinical) < 30
		|| countCell(persistedData.physio) < 30
		|| countCell(persistedData.timing) < 5
	) {
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
		wlog("RUN MODEL FOR PATIENT ", patientId);
		currentData[patientId] = run_lickert(patientId);
	}
	const patientData = currentData[patientId]!;

	if (clinicalMatrix[patientId] == null || force) {
		const data = getPersistedData(patientId);

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
		const data = getPersistedData(patientId);

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

	if (timeMatrix[patientId] == null || force) {
		const data = getPersistedData(patientId);

		timeMatrix[patientId] = {};

		const times = Object.keys(Object.values(patientData.data.clinical)[0]!);
		times.forEach(time => {
			timeMatrix[patientId]![time] = {
				timing: { label: time, value: (data.timing[+time] || {})['timing'] }
			};
		});
	}

	return {
		data: patientData.data,
		cardiacArrest: patientData.cardiacArrest,
		clMatrix: clinicalMatrix[patientId]!,
		phMatrix: physiologicalMatrix[patientId]!,
		timeMatrix: timeMatrix[patientId]!,
	};
}

function getCurrentPatientData(force: boolean = false): Data {
	const patientId = getCurrentPatientId();
	return getPatientData(patientId, force);
}

export function getCurrentPatientFinalState() : string {
	const cardiacArrest = getCurrentPatientData().cardiacArrest;
	if (cardiacArrest /* > 0*/){
		return `Patient <strong>died</strong> after <strong>${formatSecond(cardiacArrest)}</strong>`;
	} else {
		return "Patient <strong>still alive</strong> after 4h";
	}
}

export function initAllPatients() {
	const state = Context.lickertState;
	setTimeout(() => {
		const allIds = getSortedPatientIds();
		allIds.forEach(pId => getPatientData(pId));
		state.setState({data: 'INITIALIZED'});
	}, 500)
}



function formatSecond(time: number) {
	if (time <= 0){
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

const ClinicalLickertOnChangeRefName = 'clinicalOnChange';

const onClinicalChangeRef = Helpers.useRef<LickertOnChangeFn>(
	ClinicalLickertOnChangeRefName,
	() => { },
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

	save();
};

export function getClinicalMatrix(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
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
		onChangeRefName: ClinicalLickertOnChangeRefName,
	};
}

/************************************* Timing Matrix Config ********************************************/

const TimingLickertOnChangeRefName = 'timingOnChange';

const onTimingChangeRef = Helpers.useRef<LickertOnChangeFn>(
	TimingLickertOnChangeRefName,
	() => { },
);

onTimingChangeRef.current = (x, y, newData) => {
	const timeId = x.id;
	const keyId = y.id;

	const patientId = getCurrentPatientId();

	const current = timeMatrix[patientId]![timeId]![keyId];
	if (typeof current === 'object') {
		timeMatrix[patientId]![timeId]![keyId] = { label: current.label, value: newData };
	} else {
		timeMatrix[patientId]![timeId]![keyId] = newData;
	}

	save();
};

export function getTimeMatrix(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	const data = getCurrentPatientData();

	return {
		x: Object.keys(data.timeMatrix).map(time => ({
			id: time,
			label: formatSecond(+time),
		})),
		y: Object.keys(data.timeMatrix[0]!).map(key => ({
			id: key,
			label: prettyPrintKey(key),
		})),
		data: data.timeMatrix,
		cellDef: lickerCellDef,
		hideFilter: true,
		onChangeRefName: TimingLickertOnChangeRefName,
	};
}


/************************************* Physiological Matrix Config ********************************************/

const PhysioLickertOnChangeRefName = 'physioOnChange';

const onPhysioChangeRef = Helpers.useRef<LickertOnChangeFn>(PhysioLickertOnChangeRefName, () => { });

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

	save();
};

export function getPhysioMatrix(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
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
		onChangeRefName: PhysioLickertOnChangeRefName,
	};
}



/*************** Persistance **************/

export function saveData() {
	const data = getCurrentPatientData();
	const pData = convertData(data);
	const patientId = getCurrentPatientId();

	const script = `Variable.find(gameModel, 'lickert').setProperty(self, '${patientId}', ${JSON.stringify(
		JSON.stringify(pData),
	)})`;
	APIMethods.runScript(script, {});
}

//
type RawData = Record<
	string, // teamId
	//     patientId                                               time           metric  value
	Record<string, Record<'clinical' | 'physio' | 'timing', Record<string, Record<string, number>>>>
>;

function formatCsvLine(...cells: unknown[]) {
	return cells.map(cell => String(cell)).join(', ');
}

export function getAllLickertData() {
	APIMethods.runScript('getLickerData();', {}).then(result => {
		const data = result.updatedEntities[0] as RawData;
		const csv: string[] = [];

		let counter = 1;

		// print header
		csv.push(formatCsvLine('expertId', 'patientId', 'group', 'time [s]', 'metric', 'lickert'));

		// TOOD: long format

		Object.entries(data).forEach(([teamId, teamData]) => {
			const expertId = counter++;
			Object.entries(teamData).forEach(([patientId, patientData]) => {
				Object.entries(patientData).forEach(([mType, mData]) => {
					Object.entries(mData).forEach(([time, timeData]) => {
						Object.entries(timeData).forEach(([metric, value]) => {
							csv.push(formatCsvLine(expertId, patientId, mType, time, prettyPrintKey(metric), value));
						});
					});
				});
			});
		});
		const txt = csv.join('\n');
		wlog(txt);
		Helpers.downloadDataAsFile('lickert.csv', txt);
	});
}






/**
 * Read-only data
 * Pathology Editor
 */
export function getClinicalMatrixRO(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	return {
		...getClinicalMatrix(),
		cellDef: [],
	};
}

export function getPhysioMatrixRO(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	return {
		...getPhysioMatrix(),
		cellDef: [],
	};
}

export function runAgain() {
	getCurrentPatientData(true);
	Context.livePathologyEditorState.setState(s => ({ toggle: !s.toggle }));
}
