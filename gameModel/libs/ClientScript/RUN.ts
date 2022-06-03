import {
	afflictPathology,
	Block,
	BodyEffect,
	BodyState,
	computeState,
	createHumanBody,
	doItemActionOnHumanBody,
	enableCoagulation,
	enableLungsVasoconstriction,
	enableVasoconstriction
} from "./HUMAn";
import { logger, vitalsLogger, calcLogger, compLogger } from "./logger";
import { AfflictedPathology } from "./pathology";

import { getChemical, getItem, getPathology, setCompensationModel, setSystemModel } from "./registries";
import { getCurrentHumanId, getCurrentScenario, getEnv, loadCompensationModel, loadSystem, saveToObjectInstance } from "./WegasHelper";

function saveMetrics(output: object, vdName: keyof VariableClasses) {
	const oi = Variable.find(gameModel, vdName).getInstance(self) as SObjectInstance;

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
		throw "incompatible metric type";
	}
}

function pushComposedMetric(key: string, time: number, values: { [key: string]: number }, output: Metrics) {
	let data = output[key];
	if (data == null) {
		data = {};
		output[key] = data;
	}

	if (!Array.isArray(data)) {
		for (const k in values) {
			data[k] = data[k] || [];
			data[k].push([time, values[k]]);
		}
	} else {
		throw "incompatible metric type";
	}
}

function pushBloodBlockMetrics(block: Block, time: number, output: Metrics){
	pushComposedMetric(block.name, time, {
		extLosses: block.params.totalExtLosses_ml || 0,
		["Qc " + block.name]: block.params.bloodFlow_mLper || 0,
	}, output);
}


function extractMetric(body: BodyState, time: number,
	outputResp: { [key: string]: [number, number][] },
	outputCardio: { [key: string]: [number, number][] },
	outputOther: { [key: string]: [number, number][]}
	) {
	pushMetric("SaO2", time, body.vitals.respiration.SaO2 * 100, outputResp);
	pushMetric("CaO2 [mL/L]", time, body.vitals.respiration.CaO2, outputResp);

	pushMetric("PaO2 [mmHg]", time, body.vitals.respiration.PaO2, outputResp);

	pushMetric("DO2Sys [mL/min]", time, body.vitals.cardio.DO2Sys, outputResp);
	pushMetric("DO2Brain [mL/min]", time, body.vitals.brain.DO2, outputResp);

	pushMetric("RR", time, body.vitals.respiration.rr, outputResp);
	pushMetric("Tidal Volume [L]", time, body.vitals.respiration.tidalVolume_L, outputResp);

	pushMetric("HR", time, body.vitals.cardio.hr, outputCardio);
	pushMetric("MAP", time, body.vitals.cardio.MAP, outputCardio);


	pushBloodBlockMetrics(body.blocks.get('PELVIS')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_FOREARM')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_THIGH')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_LEG')!, time, outputCardio);
	pushBloodBlockMetrics(body.blocks.get('LEFT_FOOT')!, time, outputCardio);



	pushMetric("ICP [mmHg]", time, body.variables.ICP_mmHg, outputOther);


	//pushMetric("Blood", time, body.vitals.cardio.totalVolume_mL, output);
	//pushMetric("Water", time, body.vitals.cardio.totalVolumeOfWater_mL, output);

	pushComposedMetric("Blood", time, {
		total: body.vitals.cardio.totalVolume_mL,
		red: body.vitals.cardio.totalVolumeOfErythrocytes_mL,
		water: body.vitals.cardio.totalVolumeOfWater_mL,
		white: body.vitals.cardio.totalVolumeOfWhiteBloodCells_mL,
		proteins: body.vitals.cardio.totalVolumeOfPlasmaProteins_mL,
	}, outputCardio);


	pushComposedMetric("Heart", time, {
		"EDV [mL]": body.vitals.cardio.endDiastolicVolume_mL,
		"ESV [mL]": body.vitals.cardio.endSystolicVolume_mL,
	}, outputCardio);
	
	pushMetric("Ra", time, body.vitals.cardio.Ra_mmHgMinPerL, outputCardio);
	//pushMetric("Rv", time, body.vitals.cardio.Rrv_mmHgMinPerL, output);

	pushMetric("CRT [s]", time, body.vitals.capillaryRefillTime_s, outputCardio);

	pushMetric("Qc [L/min]", time, body.vitals.cardio.cardiacOutput_LPerMin, outputCardio);
	//pushMetric("Qrv [mL/min]", time, body.vitals.cardio.cardiacOutputRv_LPerMin, output);

	pushMetric("QBr [mL/min]", time, body.vitals.cardio.cerebralBloodOutput_mLperMin, outputCardio);

	pushMetric("para|ortho", time, body.variables.paraOrthoLevel, outputOther);

	vitalsLogger.info("Extract Chemicals", body.vitals.cardio.chemicals);
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

	const chemicals = Object.entries(body.vitals.cardio.chemicals).reduce<Record<string, number>>((acc, [chemId, value]) => {
		const chem = getChemical(chemId);
		if (chem) {
			acc[chem.name] = value;
		} else {
			acc[chemId] = value;
		}
		return acc;
	}, {});

	pushComposedMetric("Chemicals", time, chemicals, outputCardio);

	pushComposedMetric("GCS", time, {
		total: body.vitals.glasgow.total,
		eye: body.vitals.glasgow.eye,
		motor: body.vitals.glasgow.motor,
		verbal: body.vitals.glasgow.verbal,
	}, outputOther);

}

export function run() {

	const duration = Variable.find(gameModel, "duration_s").getValue(self);

	// Load env
	const env = getEnv();

	// Load model configuration
	enableVasoconstriction(Variable.find(gameModel, 'vasoconstriction').getValue(self));
	enableCoagulation(Variable.find(gameModel, 'coagulation').getValue(self));
	enableLungsVasoconstriction(Variable.find(gameModel, 'vasoconstrictionLungs').getValue(self));

	const system = loadSystem();
	compLogger.info("(para)Sympathetic System: ", system);
	setSystemModel(system);

	const compensation = loadCompensationModel();
	compLogger.info("Compensation Profile: ", compensation);
	setCompensationModel(compensation);

	// Body Setup
	const meta = getCurrentHumanId();
	const initialBody = createHumanBody(meta, env);
	calcLogger.info("Start with ", initialBody.state);
	const outputResp = {};
	const outputCardio = {};
	const outputOther = {};


	calcLogger.info("ENV", env);
	let i: number;
	let body = initialBody;

	extractMetric(body.state, 0, outputResp, outputCardio, outputOther);

	const scenario = getCurrentScenario();

	logger.warn("Events: ", scenario.events);

	const effects: BodyEffect[] = [];
	const pathologies: AfflictedPathology[] = [];

	// load scenario
	scenario.events.forEach(({ event, blocks, time }) => {
		if (event.type === 'ItemActionOnHuman') {
			const item = getItem(event.itemId);
			if (item != null) {
				const action = item.actions[event.actionId];
				if (action != null) {
					logger.info("Apply Item: ", { time, item, action });
					effects.push(doItemActionOnHumanBody(item, action, blocks, time)!);
				} else {
					logger.warn(`Item Action Failed: Action "${event.actionId}" does not exist in`, item);
				}
			} else {
				logger.info(`Item Action Failed: Item "${event.itemId}" does not exist`);
			}
		} else if (event.type === 'HumanPathology') {
			const pathology = getPathology(event.pathologyId);
			if (pathology != null) {
				logger.info("Afflict Pathology: ", { pathology, time });
				pathologies.push(afflictPathology(pathology, time, blocks));
			} else {
				logger.warn(`Afflict Pathology Failed: Pathology "${event.pathologyId}" does not exist`);
			}
		}
	});

	//doItemActionOnHumanBody(tracheostomyTube.actions[0]!, body, 'NECK', 25);


	calcLogger.warn("Start");
	console.time("Human.run");
	//Helpers.cloneDeep(body.state);

	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
	for (i = 1; i <= duration; i += stepDuration) {
		logger.info(`Run ${i}`);
		
		const newState = computeState(body.state, body.meta, env, stepDuration, pathologies, effects);
		calcLogger.info(" -> ", newState);

		body.state = newState;
		// extract vitals
		// extractMetric(newState, i, outputResp);
		extractMetric(body.state, body.state.time, outputResp, outputCardio, outputOther);
	}

	calcLogger.info("End with ", initialBody.state);
	calcLogger.warn("Done");
	console.timeEnd("Human.run");

	saveMetrics(outputResp, 'output');
	saveMetrics(outputCardio,'outputCardio');
	saveMetrics(outputOther, 'outputOther');
}

