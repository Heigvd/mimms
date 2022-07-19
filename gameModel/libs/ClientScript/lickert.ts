import { formatMetric } from "./currentPatientZoom";
import { BodyStateKeys, computeMetas } from "./HUMAn";
import { CellDef, DataDef, EhancedCellData, MatrixConfig, MatrixState, setMatrixState } from "./MatrixEditor";
import { getPathology } from "./registries";
import { LickertData, run_lickert, Serie } from "./RUN";
import { getCurrentPatientBodyParam, getCurrentPatientId, getSortedPatientIds } from "./WegasHelper";

function save() {
	saveData();
}

export function selectPatient(patientId: string){
	APIMethods.runScript(`
	Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'ongoing');
	Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');
	`, {});
}

export function gotoValidatePage(){
	APIMethods.runScript(
			`Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', 'completed');
	 		 Variable.find(gameModel, 'currentPatient').setValue(self, '');`, {});
}

export function nextUndonePatient() {
	const allIds = getSortedPatientIds();

	let currentIndex = allIds.indexOf(getCurrentPatientId());

	let counter = 0;

	do {
		currentIndex = ((currentIndex + 1) % allIds.length);
		counter++;
	} while (counter < allIds.length && isPatientDone(allIds[currentIndex]));

	if (counter >= allIds.length) {
		// no undone patient
		gotoValidatePage();
	} else {
		const newPatientId = allIds[currentIndex];
		selectPatient(newPatientId);
	}
}

export function nextPatient() {
	const allIds = getSortedPatientIds();
	const p = getCurrentPatientId();
	let np = "";
	if (p) {
		np = allIds[((allIds.indexOf(p) + 1) % allIds.length)];
	} else {
		np = allIds[0];
	}
	selectPatient(np);
}

export function previousPatient() {
	const allIds = getSortedPatientIds();
	const p = getCurrentPatientId();
	let np = "";
	if (p) {
		np = allIds[((allIds.indexOf(p) - 1) % allIds.length)];
	} else {
		np = allIds[0];
	}
	selectPatient(np);
}


export function prettyPrintCurrentPatientMeta() {
	const id = getCurrentPatientId();
	const param = getCurrentPatientBodyParam();
	let title = '';
	let p = '';
	if (param) {
		const { meta } = computeMetas(param);
		title = `${id} - ${meta.sex}, ${meta.age}y, ${meta.height_cm}cm, ${meta.effectiveWeight_kg.toFixed()}kg`;
		p = (param.scriptedPathologies || []).map(sp => {
			const pId = sp.payload.pathologyId;
			return getPathology(pId)?.name || '';
		}).join("<br />");
	} else {
		title = "No patient";
	}

	return `<h1>${title}</h1><p>${p}</p>`;
}

type TimeId = string;
type KeyId = string;

export type LickertLevel = 1 | 2 | 3 | 4 | 5;

const lickerCellDef_select: CellDef[] = [{
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
		}, {
			label: 'unlikely',
			value: 2,
		}, {
			label: 'acceptable',
			value: 3,
		}, {
			label: 'quite realistic',
			value: 4,
		}, {
			label: 'fully realistic',
			value: 5,
		}
	],
}];


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
			}
		],
	}, {
		type: 'enum',
		label: '2',
		tooltip: 'unlikely',
		values: [
			{
				label: 'unlikely',
				value: 2,
			}
		],
	}, {
		type: 'enum',
		label: '3',
		tooltip: 'acceptable',
		values: [
			{
				label: 'acceptable',
				value: 3,
			}
		],
	}, {
		type: 'enum',
		label: '4',
		tooltip: 'quite realistic',
		values: [
			{
				label: 'quite realistic',
				value: 4,
			}
		],
	}, {
		type: 'enum',
		label: '5',
		tooltip: 'fully realistic',
		values: [
			{
				label: 'fully realistic',
				value: 5,
			}
		],
	}
];

type LickertMatrixCell = undefined | LickertLevel;

const currentData: Record<string, LickertData> = {};

type Matrix = Record<TimeId, Record<KeyId, EhancedCellData<LickertMatrixCell>>>;


const clinicalMatrix: Record<string, Matrix> = {};

const physiologicalMatrix: Record<string, Matrix> = {};


type PMatrix = Record<TimeId, Record<KeyId, LickertMatrixCell>>;

interface PersistedMatrix {
	clinical: PMatrix;
	physio: PMatrix;
}

type LickertOnChangeFn = (x: DataDef<TimeId>, y: DataDef<KeyId>, value: LickertMatrixCell) => void;


function prettyPrintValue(metric: string, value: unknown): string {
	return formatMetric(metric as BodyStateKeys, value)[1]
}

function prettyPrintKey(metric: string): string {
	return formatMetric(metric as BodyStateKeys, 0)[0]
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
		};
	}
}

function convertData(data: Data): PersistedMatrix {
	const pm: PersistedMatrix = {
		clinical: {},
		physio: {},
	};

	Object.entries(data.clMatrix).forEach(([timeId, keys]) => {
		Object.entries(keys).forEach(([keyId, value]) => {
			pm.clinical[timeId] = pm.clinical[timeId] || {};
			if (typeof value === 'object') {
				pm.clinical[timeId][keyId] = value.value
			} else {
				pm.clinical[timeId][keyId] = value
			}
		});
	});


	Object.entries(data.phMatrix).forEach(([timeId, keys]) => {
		Object.entries(keys).forEach(([keyId, value]) => {
			pm.physio[timeId] = pm.physio[timeId] || {};
			if (typeof value === 'object') {
				pm.physio[timeId][keyId] = value.value
			} else {
				pm.physio[timeId][keyId] = value
			}
		});
	});

	return pm;
}

interface Data {
	data: LickertData;
	clMatrix: Matrix;
	phMatrix: Matrix;
};

function check(matrix: Matrix, data: Record<string, Serie>): boolean {
	for (const mKey in data) {
		for (const mTime in data[mKey]) {
			if (matrix[mTime]) {
				const cell = matrix[mTime][mKey];
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


/*export function isPatientDone(patientId: string): boolean {
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

	if (countCell(persistedData.clinical) < 30 ||  countCell(persistedData.physio) < 30) {
		return false;
	}

	return true;
}



export function areAllPatientsCompleted() : boolean {
	const ids = getSortedPatientIds();
	for (const id of ids){
		if (!isPatientDone(id)){
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

export function getPatientMenu() : MenuItem[] {
	return getSortedPatientIds().map(pId => ({
		id: pId,
		completed: isPatientDone(pId),
	}))
}


export function getCurrentPatientData(force: boolean = false): Data {
	const patientId = getCurrentPatientId();

	if (currentData[patientId] == null || force) {
		currentData[patientId] = run_lickert();
	}

	if (clinicalMatrix[patientId] == null || force) {
		const data = getPersistedData(patientId);

		clinicalMatrix[patientId] = {};
		const clKeys = Object.keys(currentData[patientId].clinical);
		// @ts-ignore
		const times = Object.keys(currentData[patientId].clinical[clKeys[0]]);
		times.forEach(time => {
			clinicalMatrix[patientId][time] = {};
			clKeys.forEach(clKey => {
				clinicalMatrix[patientId][time][clKey] = {
					label: prettyPrintValue(clKey, currentData[patientId].clinical[clKey][+time]),
					value: (data.clinical[+time] || {})[clKey],
				};
			});
		});
	}


	if (physiologicalMatrix[patientId] == null || force) {
		const data = getPersistedData(patientId);

		physiologicalMatrix[patientId] = {};
		const phKey = Object.keys(currentData[patientId].physiological);
		// @ts-ignore
		const times = Object.keys(currentData[patientId].physiological[phKey[0]]);
		times.forEach(time => {
			physiologicalMatrix[patientId][time] = {};
			phKey.forEach(clKey => {
				physiologicalMatrix[patientId][time][clKey] = {
					label: prettyPrintValue(clKey, currentData[patientId].physiological[clKey][+time]),
					value: (data.physio[+time] || {})[clKey],
				};
			});
		});
	}

	return {
		data: currentData[patientId],
		clMatrix: clinicalMatrix[patientId],
		phMatrix: physiologicalMatrix[patientId],
	};
}

function formatSecond(time: number) {
	if (time < 60) {
		return `${time}s`;
	} else {
		const min = Math.floor(time / 60);
		const sec = time - (min * 60);
		return `${min}min ${sec}s`;
	}
}

const ClinicalLickertOnChangeRefName = 'clinicalOnChange';

const onClinicalChangeRef = Helpers.useRef<LickertOnChangeFn>(ClinicalLickertOnChangeRefName, () => { });

onClinicalChangeRef.current = (x, y, newData) => {
	const timeId = x.id;
	const keyId = y.id;

	const patientId = getCurrentPatientId();

	const current = clinicalMatrix[patientId][timeId][keyId];
	if (typeof current === 'object') {
		clinicalMatrix[patientId][timeId][keyId] = { label: current.label, value: newData };
	} else {
		clinicalMatrix[patientId][timeId][keyId] = newData;
	}

	save();
};


export function getClinicalMatrix(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	const data = getCurrentPatientData();

	return {
		x: Object.keys(data.clMatrix).map(time => ({
			id: time,
			label: formatSecond(+time)
		})),
		y: Object.keys(data.clMatrix[0]).map(key => ({
			id: key,
			label: prettyPrintKey(key),
		})),
		data: data.clMatrix,
		cellDef: lickerCellDef,
		hideFilter: true,
		onChangeRefName: ClinicalLickertOnChangeRefName,
	};
}


const PhysioLickertOnChangeRefName = 'physioOnChange';

const onPhysioChangeRef = Helpers.useRef<LickertOnChangeFn>(PhysioLickertOnChangeRefName, () => { });

onPhysioChangeRef.current = (x, y, newData) => {
	const timeId = x.id;
	const keyId = y.id;

	const patientId = getCurrentPatientId();

	const current = physiologicalMatrix[patientId][timeId][keyId];
	if (typeof current === 'object') {
		physiologicalMatrix[patientId][timeId][keyId] = { label: current.label, value: newData };
	} else {
		physiologicalMatrix[patientId][timeId][keyId] = newData;
	}

	save();
};

export function getPhysioMatrix(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	const data = getCurrentPatientData();

	return {
		x: Object.keys(data.phMatrix).map(time => ({
			id: time,
			label: formatSecond(+time)
		})),
		y: Object.keys(data.phMatrix[0]).map(key => ({
			id: key,
			label: prettyPrintKey(key),
		})),
		data: data.phMatrix,
		cellDef: lickerCellDef,
		hideFilter: true,
		onChangeRefName: PhysioLickertOnChangeRefName,
	};
}



export function saveData() {
	const data = getCurrentPatientData();
	const pData = convertData(data);
	const patientId = getCurrentPatientId();

	const script = `Variable.find(gameModel, 'lickert').setProperty(self, '${patientId}', ${JSON.stringify(JSON.stringify(pData))})`;
	APIMethods.runScript(script, {});
}







//                    teamId       patientId                                     time           metric  value
type RawData = Record<string, Record<string, Record<'clinical' | 'physio', Record<string, Record<string, number>>>>>


function formatCsvLine(...cells: unknown[]) {
	return cells.map(cell => String(cell)).join(", ");
}

export function getAllLickertData() {
	APIMethods.runScript("getLickerData();", {}).then((result) => {
		const data = result.updatedEntities[0] as RawData;
		const csv: string[] = [];

		let counter = 1;

		// print header
		csv.push(formatCsvLine("expertId", "patientId", "group", "time [s]", "metric", "lickert"));

		Object.entries(data).forEach(([teamId, teamData]) => {
			const expertId = counter++;
			Object.entries(teamData).forEach(([patientId, patientData]) => {
				Object.entries(patientData).forEach(([mType, mData]) => {
					Object.entries(mData).forEach(([time, timeData]) => {
						Object.entries(timeData).forEach(([metric, value]) => {
							csv.push(formatCsvLine(expertId, patientId, mType, time, metric, value));
						});
					});
				});
			});
		});
		const txt = csv.join("\n");
		wlog(txt);
		Helpers.downloadDataAsFile("lickert.csv", txt);
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
	}
}

export function getPhysioMatrixRO(): MatrixConfig<TimeId, KeyId, LickertMatrixCell> {
	return {
		...getPhysioMatrix(),
		cellDef: [],
	}
}

export function runAgain() {
	getCurrentPatientData(true);
	Context.livePathologyEditorState.setState(s => ({ toggle: !s.toggle }));
}
