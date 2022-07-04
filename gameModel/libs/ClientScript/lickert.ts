import { formatMetric } from "./currentPatientZoom";
import { BodyStateKeys, computeMetas } from "./HUMAn";
import { CellDef, DataDef, EhancedCellData, MatrixConfig, setMatrixState } from "./MatrixEditor";
import { getPathology } from "./registries";
import { LickertData, run_lickert } from "./RUN";
import { getCurrentPatientBodyParam, getCurrentPatientId, getPatientIds } from "./WegasHelper";


export function nextPatient() {
	const allIds = getPatientIds();
	const p = getCurrentPatientId();
	let np = "";
	if (p) {
		np = allIds[((allIds.indexOf(p) + 1) % allIds.length)];
	} else {
		np = allIds[0];
	}
	APIMethods.runScript(`Variable.find(gameModel, 'currentPatient').setValue(self, '${np}');`, {});
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

const lickerCellDef: CellDef[] = [{
	type: 'enum',
	label: 'licekrt',
	values: [
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
			pm.physio[timeId] = pm.clinical[timeId] || {};
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
		return `${min}m:${sec}s`;
	}
}

const ClinicalLickertOnChangeRefName = 'clinicalOnChange';

const onClinicalChangeRef = Helpers.useRef<LickertOnChangeFn>(ClinicalLickertOnChangeRefName, () => { });

onClinicalChangeRef.current = (x, y, newData) => {
	const timeId = x.id;
	const keyId = y.id;

	wlog("OnChange", { x, y, newData });

	const patientId = getCurrentPatientId();

	const current = clinicalMatrix[patientId][timeId][keyId];
	if (typeof current === 'object') {
		clinicalMatrix[patientId][timeId][keyId] = { label: current.label, value: newData };
	} else {
		clinicalMatrix[patientId][timeId][keyId] = newData;
	}

	wlog("Data: ", clinicalMatrix[patientId][timeId][keyId]);

	setMatrixState(s => ({ ...s, toggle: !s.toggle }));
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

	setMatrixState(s => ({ ...s, toggle: !s.toggle }));
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






/**
 * Read-only data
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

//                    teamId       patientId                                     time           metric  value
type RawData = Record<string, Record<string, Record<'clinical' | 'physio', Record<string, Record<string, number>>>>>;

const data: RawData = {
	"24040561": {
		"patient-3": {
			"clinical": {
				"0": {
					"vitals.canWalk": 5
				},
				"3600": {},
				"7200": {},
				"10800": {},
				"14400": {
					"vitals.glasgow.total": 3
				}
			}, "physio": { "0": { "vitals.canWalk": 5 }, "3600": {}, "7200": {}, "10800": {}, "14400": { "vitals.glasgow.total": 3 } }
		}
	}
}


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







