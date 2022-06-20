import {
	Block,
	BodyEffect,
	BodyState,
	BodyStateKeys,
	computeState,
	createHumanBody,
	defaultMeta,
	doActionOnHumanBody,
	enableCoagulation,
	enableLungsVasoconstriction,
	enableVasoconstriction,
	readKey,
} from './HUMAn';
import { logger, vitalsLogger, calcLogger, compLogger } from './logger';
import {
	RevivedPathology,
	revivePathology,
} from './pathology';

import {
	getAct,
	getChemical,
	getItem,
	setCompensationModel,
	setSystemModel,
} from './registries';
import {
	getCurrentPatientBodyParam,
	getCurrentScenario,
	//getCurrentScenario,
	getEnv,
	loadCompensationModel,
	loadSystem,
	saveToObjectInstance,
	TestScenario,
} from './WegasHelper';

function saveMetrics(output: object, vdName: keyof VariableClasses) {
	const oi = Variable.find(gameModel, vdName).getInstance(
		self,
	) as SObjectInstance;

	saveToObjectInstance(oi, output);
}

type Coord = [number, number];

interface Metrics {
	[key: string]: Coord[] | { [sub: string]: Coord[] };
}

function pushMetric(key: string, time: number, value: number, output: Metrics) {
	let data = output[key];
	if (data == null) {
		data = [];
		output[key] = data;
	}

	if (Array.isArray(data)) {
		data.push([time, value]);
	} else {
		throw 'incompatible metric type';
	}
}

function pushComposedMetric(
	key: string,
	time: number,
	values: { [key: string]: number },
	output: Metrics,
) {
	let data = output[key];
	if (data == null) {
		data = {};
		output[key] = data;
	}

	if (!Array.isArray(data)) {
		for (const k in values) {
			const value = values[k];
			if (value != null) {
				data[k] = data[k] || [];
				data[k]!.push([time, value]);
			}
		}
	} else {
		throw 'incompatible metric type';
	}
}

function pushBloodBlockMetrics(block: Block, time: number, output: Metrics) {
	pushComposedMetric(
		block.name,
		time,
		{
			extLosses: block.params.totalExtLosses_ml || 0,
			intLosses: block.params.totalInternalLosses_ml || 0,
			['Qc ' + block.name]: block.params.bloodFlow_mLper || 0,
		},
		output,
	);
}

function extractMetric(
	body: BodyState,
	time: number,
	outputResp: { [key: string]: [number, number][] },
	outputCardio: { [key: string]: [number, number][] },
	outputOther: { [key: string]: [number, number][] },
) {
	pushMetric('SaO2', time, body.vitals.respiration.SaO2 * 100, outputResp);
	pushMetric('CaO2 [mL/L]', time, body.vitals.respiration.CaO2, outputResp);

	pushMetric('PaO2 [mmHg]', time, body.vitals.respiration.PaO2, outputResp);

	pushMetric('DO2Sys [mL/min]', time, body.vitals.cardio.DO2Sys, outputResp);
	pushMetric('DO2Brain [mL/min]', time, body.vitals.brain.DO2, outputResp);

	pushMetric('RR', time, body.vitals.respiration.rr, outputResp);
	pushMetric(
		'Tidal Volume [L]',
		time,
		body.vitals.respiration.tidalVolume_L,
		outputResp,
	);

	const ip_left = body.blocks.get('THORAX_LEFT')!.params.internalPressure;
	const ip_right = body.blocks.get('THORAX_RIGHT')!.params.internalPressure;
	const nIp_left = typeof ip_left === 'number' ? ip_left : 0;
	const nIp_right = typeof ip_right === 'number' ? ip_right : 0;

	pushComposedMetric("Thorax", time, {
		itp_left: nIp_left,
		itp_right: nIp_right,
	},
		outputCardio);

	pushMetric('HR', time, body.vitals.cardio.hr, outputCardio);
	pushMetric('MAP', time, body.vitals.cardio.MAP, outputCardio);

	pushBloodBlockMetrics(body.blocks.get('MEDIASTINUM')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('NECK')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('ABDOMEN')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('PELVIS')!, time, outputCardio);

	pushBloodBlockMetrics(body.blocks.get('LEFT_SHOULDER')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_FOREARM')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_THIGH')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_LEG')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_FOOT')!, time, outputCardio);

	pushBloodBlockMetrics(body.blocks.get('RIGHT_SHOULDER')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('RIGHT_FOREARM')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('RIGHT_THIGH')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('RIGHT_LEG')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('RIGHT_FOOT')!, time, outputCardio);

	pushMetric('ICP [mmHg]', time, body.variables.ICP_mmHg, outputOther);

	//pushMetric("Blood", time, body.vitals.cardio.totalVolume_mL, output);
	//pushMetric("Water", time, body.vitals.cardio.totalVolumeOfWater_mL, output);

	pushComposedMetric(
		'Blood',
		time,
		{
			total: body.vitals.cardio.totalVolume_mL,
			red: body.vitals.cardio.totalVolumeOfErythrocytes_mL,
			water: body.vitals.cardio.totalVolumeOfWater_mL,
			white: body.vitals.cardio.totalVolumeOfWhiteBloodCells_mL,
			proteins: body.vitals.cardio.totalVolumeOfPlasmaProteins_mL,
		},
		outputCardio,
	);

	pushComposedMetric(
		'Heart',
		time,
		{
			'EDV [mL]': body.vitals.cardio.endDiastolicVolume_mL,
			'ESV [mL]': body.vitals.cardio.endSystolicVolume_mL,
		},
		outputCardio,
	);

	pushMetric('Ra', time, body.vitals.cardio.Ra_mmHgMinPerL, outputCardio);
	//pushMetric("Rv", time, body.vitals.cardio.Rrv_mmHgMinPerL, output);

	pushMetric('CRT [s]', time, body.vitals.capillaryRefillTime_s, outputCardio);

	pushMetric(
		'Qc [L/min]',
		time,
		body.vitals.cardio.cardiacOutput_LPerMin,
		outputCardio,
	);
	//pushMetric("Qrv [mL/min]", time, body.vitals.cardio.cardiacOutputRv_LPerMin, output);

	pushMetric(
		'QBr [mL/min]',
		time,
		body.vitals.cardio.cerebralBloodOutput_mLperMin,
		outputCardio,
	);

	pushMetric('para|ortho', time, body.variables.paraOrthoLevel, outputOther);

	vitalsLogger.info('Extract Chemicals', body.vitals.cardio.chemicals);
	/*const at = body.vitals.cardio.chemicals['TranexamicAcid'];
	vitalsLogger.info("at: ", at);
	if (at != null) {
		pushMetric("Acide Tranéxamique [HL]", time, at, output);
	} else {
		pushMetric("Acide Tranéxamique [HL]", time, 0, output);
	}

	const at2 = body.vitals.cardio.chemicals['TranexamicAcid_Clearance'];
	vitalsLogger.info("at2: ", at2);
	if (at != null) {
		pushMetric("Acide Tranéxamique CL", time, at2, output);
	} else {
		pushMetric("Acide Tranéxamique CL", time, 0, output);
	}*/

	const chemicals = Object.entries(body.vitals.cardio.chemicals).reduce<
		Record<string, number>
	>((acc, [chemId, value]) => {
		const chem = getChemical(chemId);
		if (chem) {
			acc[chem.name] = value;
		} else {
			acc[chemId] = value;
		}
		return acc;
	}, {});

	pushComposedMetric('Chemicals', time, chemicals, outputCardio);

	pushComposedMetric(
		'GCS',
		time,
		{
			total: body.vitals.glasgow.total,
			eye: body.vitals.glasgow.eye,
			motor: body.vitals.glasgow.motor,
			verbal: body.vitals.glasgow.verbal,
		},
		outputOther,
	);
}

function internal_run(duration: number, cb: (bodyState: BodyState, time: number) => void, scenario: TestScenario = getCurrentScenario()) {
	// Load env
	const env = getEnv();

	// Load model configuration
	enableVasoconstriction(
		Variable.find(gameModel, 'vasoconstriction').getValue(self),
	);
	enableCoagulation(Variable.find(gameModel, 'coagulation').getValue(self));
	enableLungsVasoconstriction(
		Variable.find(gameModel, 'vasoconstrictionLungs').getValue(self),
	);

	const system = loadSystem();
	compLogger.info('(para)Sympathetic System: ', system);
	setSystemModel(system);

	const compensation = loadCompensationModel();
	compLogger.info('Compensation Profile: ', compensation);
	setCompensationModel(compensation);

	// Body Setup
	const meta = getCurrentPatientBodyParam() || defaultMeta;
	const initialBody = createHumanBody(meta, env);
	calcLogger.info('Start with ', initialBody.state);


	calcLogger.info('ENV', env);
	let i: number;
	let body = initialBody;
	cb(body.state, 0);


	//const scenario = getCurrentScenario();

	logger.warn('Events: ', scenario.events);

	const effects: BodyEffect[] = [];
	const pathologies: RevivedPathology[] = [];

	// load scenario
	scenario.events.forEach((event) => {
		if (event.type === 'HumanPathology') {
			try {
				const pathology = revivePathology(event, event.time);
				pathologies.push(pathology);
				logger.info('Afflict Pathology: ', { pathology, time: event.time });
			} catch {
				logger.warn(
					`Afflict Pathology Failed: Pathology "${event.pathologyId}" does not exist`,
				);
			}
		} else if (event.type === 'HumanTreatment') {
			if (event.source.type === 'act') {
				const act = getAct(event.source.actId);
				if (act) {
					if (act.action.type === 'ActionBodyEffect') {
						logger.info('Do Act: ', { time: event.time, act });
						effects.push(doActionOnHumanBody(act, act.action, event.blocks, event.time)!);
					} else {
						logger.info('Ignore measure');
					}
				}
			} else if (event.source.type === 'itemAction') {
				const item = getItem(event.source.itemId);
				const action = item?.actions[event.source.actionId];
				if (action != null) {
					if (action.type === 'ActionBodyEffect') {
						logger.info('Apply Item: ', { time: event.time, item, action });
						effects.push(doActionOnHumanBody(item!, action, event.blocks, event.time)!);
					} else {
						logger.info('Ignore measure');
					}
				} else {
					logger.warn(
						`Item Action Failed: Event/Action "${event.source.itemId}/${event.source.actionId}`,
					);
				}

			}
		}
	});

	wlog("Scenario: ", { pathologies, effects });

	//doItemActionOnHumanBody(tracheostomyTube.actions[0]!, body, 'NECK', 25);

	calcLogger.warn('Start');
	// @ts-ignore
	console.time('Human.run');
	//Helpers.cloneDeep(body.state);

	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
	for (i = 1; i <= duration; i += stepDuration) {
		logger.info(`Run ${i}`);

		const newState = computeState(
			body.state,
			body.meta,
			env,
			stepDuration,
			pathologies,
			effects,
		);
		calcLogger.info(' -> ', newState);

		body.state = newState;
		// extract vitals
		// extractMetric(newState, i, outputResp);
		cb(body.state, body.state.time);
	}

	calcLogger.info('End with ', initialBody.state);
	calcLogger.warn('Done');
	// @ts-ignore
	console.timeEnd('Human.run');
}


export function run() {
	const duration = Variable.find(gameModel, 'duration_s').getValue(self);

	const outputResp = {};
	const outputCardio = {};
	const outputOther = {};


	internal_run(duration, (state, time) => {
		extractMetric(state, time, outputResp, outputCardio, outputOther)
	});

	saveMetrics(outputResp, 'output');
	saveMetrics(outputCardio, 'outputCardio');
	saveMetrics(outputOther, 'outputOther');
}



const kes: BodyStateKeys[] = [
	'vitals.respiration.PaO2',
	'vitals.respiration.PaCO2',
	'vitals.respiration.tidalVolume_L',
	'vitals.cardio.totalVolume_mL',
	'vitals.cardio.endSystolicVolume_mL',
	'variables.ICP_mmHg'
];

type Time = number;

type Serie = Record<Time, unknown>;


const clKeys = ['vitals.canWalk',
	'vitals.cardio.hr',
	'vitals.cardio.MAP',
	'vitals.respiration.SaO2',
	'vitals.respiration.rr',
	'vitals.glasgow.total'] as const;

type ClKeys = typeof clKeys[number];

const phKeys = [
	'vitals.respiration.PaO2',
	//'vitals.respiration.PaCO2',
	'vitals.respiration.tidalVolume_L',
	'vitals.cardio.totalVolume_mL',
	'vitals.cardio.endSystolicVolume_mL',
	'variables.ICP_mmHg',
];

type PhKeys = typeof phKeys[number];

export interface LickertData {
	clinical: Record<ClKeys, Serie>;
	physiological: Record<PhKeys, Serie>;
}

const fourHours = 60 * 60 * 4;

export function run_lickert() {
	const data: LickertData = {
		clinical: {
			'vitals.canWalk': {},
			'vitals.cardio.hr': {},
			'vitals.cardio.MAP': {},
			'vitals.respiration.SaO2': {},
			'vitals.respiration.rr': {},
			'vitals.glasgow.total': {},
		},
		physiological: {
			'vitals.respiration.PaO2': {},
			'vitals.respiration.PaCO2': {},
			'vitals.respiration.tidalVolume_L': {},
			'vitals.cardio.totalVolume_mL': {},
			'vitals.cardio.endSystolicVolume_mL': {},
			'variables.ICP_mmHg': {},
		}
	};

	let cardiacArrest: number | undefined = undefined;

	const param = getCurrentPatientBodyParam();

	const scenario: TestScenario = {
		description: '',
		events: []
	};
	(param?.scriptedPathologies || []).forEach(sP => {
		scenario.events.push({
			...sP.payload,
			time: 1,
		});
	});

	internal_run(fourHours, (state, time) => {
		cardiacArrest = state.vitals.cardiacArrest;
		clKeys.forEach(k => {
			const value = readKey(state, k as BodyStateKeys);
			data.clinical[k][time] = value;
		});

		phKeys.forEach(k => {
			const value = readKey(state, k as BodyStateKeys);
			data.physiological[k][time] = value;
		});
	}, scenario);

	const t4 = cardiacArrest || fourHours;
	const t0 = 0;
	const t1 = Math.round(Math.floor(t4 / 20) * 5);
	const t2 = t1 * 2;
	const t3 = t1 + t2;

	const times = [t0, t1, t2, t3, t4];

	const clean: LickertData = {
		clinical: {
			'vitals.canWalk': {},
			'vitals.cardio.hr': {},
			'vitals.cardio.MAP': {},
			'vitals.respiration.SaO2': {},
			'vitals.respiration.rr': {},
			'vitals.glasgow.total': {},
		},
		physiological: {
			'vitals.respiration.PaO2': {},
			'vitals.respiration.PaCO2': {},
			'vitals.respiration.tidalVolume_L': {},
			'vitals.cardio.totalVolume_mL': {},
			'vitals.cardio.endSystolicVolume_mL': {},
			'variables.ICP_mmHg': {},
		}
	};

	times.forEach(time => {
		clKeys.forEach(k => {
			clean.clinical[k][time] = data.clinical[k][time];
		});

		phKeys.forEach(k => {
			clean.physiological[k][time] = data.physiological[k][time];
		});
	});


	return clean;
}


