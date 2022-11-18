/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */
import { add, interpolate, normalize } from '../tools/helper';
import { Point } from '../map/point2D';

import {
	BodyState,
	Environnment,
	Glasgow,
	findBlock,
	visit,
	HumanBody,
	Block,
	isLungsVasoconstrictionEnabled,
	getVitals,
	setVital,
	BodyStateKeys,
	readKey,
	Bound,
	getPain,
	HumanMeta,
	findConnection,
	isNervousSystemFine,
	isNervousSystemConnection,
	BodyPosition,
	RevivedConnection,
	Motricity,
} from './human';
import { logger, calcLogger, compLogger, respLogger, extraLogger } from '../tools/logger';
// import { computePaO2 } from "./quarticSolver";
import { getCompensationModel, getOverdriveModel, getSystemModel } from '../tools/WegasHelper';

//import { cloneDeep } from "lodash";
//const cloneDeep = Helpers.cloneDeep;

export const gambateMax = 15;

function computeGambateScore(bodyState: BodyState, durationInMin: number) {
	let score = 0;
	//return durationInMin;
	if (bodyState.vitals.cardio.DO2Sys < bodyState.vitals.cardio.vo2_mLperMin) {
		score += (bodyState.vitals.cardio.vo2_mLperMin - bodyState.vitals.cardio.DO2Sys) / 100;
		logger.info('critical DO2 => ', score);
	}

	if (bodyState.vitals.cardio.MAP < 40) {
		score += (40 - bodyState.vitals.cardio.MAP) / 100;
		logger.info('Critical MAP => ', score);
	}

	if (bodyState.vitals.respiration.SaO2 < 0.7) {
		score += (0.7 - bodyState.vitals.respiration.SaO2) * 20;
		logger.info('Critical MAP => ', score);
	}

	return score * durationInMin;
}
/**
 * Dead bodies don't bleed
 */
function deadBodiesDoNotBleed(bodyState: BodyState) {

	bodyState.vitals.cardio.extLossesFlow_mlPerMin = 0;
	bodyState.vitals.cardio.extVenousLossesFlow_mlPerMin = 0;
	bodyState.vitals.cardio.extArterialLossesFlow_mlPerMin = 0;

	bodyState.blocks.forEach(block => {
		
		block.params.arterialLosses_mlPerMin = 0;
		block.params.venousLosses_mlPerMin = 0;
		block.params.extLossesFlow_mlPerMin = 0;
	});
}

export function detectCardiacArrest(bodyState: BodyState, durationInMin: number) {
	logger.log('Detect cardiac arrest');
	if (
		bodyState.vitals.cardiacArrest! > 0 ||
		bodyState.vitals.cardio.hr < 30 ||
		bodyState.vitals.cardio.MAP < 40 ||
		//bodyState.vitals.respiration.rr < 4 ||
		bodyState.vitals.respiration.SaO2 < 0.7
		// todo: check DO2 brain
	) {
		if (bodyState.vitals.gambateBar > 0) {
			bodyState.vitals.gambateBar -= computeGambateScore(bodyState, durationInMin);
		} else {
			logger.log('Cardiac Arrest');
			bodyState.vitals.cardiacArrest = bodyState.vitals.cardiacArrest || bodyState.time;
			bodyState.vitals.cardio.hr = 0;
			bodyState.vitals.cardio.MAP = 0;
			bodyState.vitals.cardio.strokeVolume_mL = 0;
			bodyState.vitals.respiration.rr = 0;
			bodyState.vitals.respiration.SaO2 = 0;
			bodyState.vitals.respiration.SpO2 = 0;
			bodyState.vitals.respiration.CaO2 = 0;
			// bodyState.vitals.respiration.PaCO2 += bodyState.vitals.respiration.PaO2;
			// bodyState.vitals.respiration.PaO2 = 0;
			bodyState.vitals.respiration.tidalVolume_L = 0;
			bodyState.vitals.respiration.alveolarVolume_L = 0;
			bodyState.vitals.brain.DO2 = 0;
			bodyState.vitals.glasgow.total = 3;
			bodyState.vitals.glasgow.eye = 1;
			bodyState.vitals.glasgow.motor = 1;
			bodyState.vitals.glasgow.verbal = 1;
			bodyState.vitals.capillaryRefillTime_s = undefined;

			deadBodiesDoNotBleed(bodyState);
		}
	} else {
		if (bodyState.vitals.gambateBar < 15) {
			bodyState.vitals.gambateBar = add(bodyState.vitals.gambateBar, durationInMin, {
				max: gambateMax,
			});
		}
		logger.log('Not dead yet');
	}
}

/**
 * Get currentBloodVolume / initialBloodVolume
 */
export function getBloodRatio(human: HumanBody) {
	return human.state.vitals.cardio.totalVolume_mL / human.meta.initialBloodVolume_mL;
}

const spo2BlVolumneModel: Point[] = [
	{ x: 0, y: 0.5 },
	{ x: 0.6, y: 1 },
];

function getSpO2Ratio(human: HumanBody) {
	const bloodRatio = getBloodRatio(human);
	return interpolate(bloodRatio, spo2BlVolumneModel);
}

// Some constant based on something...
const K = 0.863;

interface UpperAirways {
	/** Fraction of oxygen in inhaled gas: Percent [0-1]; */
	FIO2: number;
	/** aiways resistance [0-1] */
	resistance: number;
	/** Atmospheric pressure mmHg */
	atmosphericPressureInmmHg: number;
}

interface LowerAirways {
	/** Pulmonary compliance [0-1] */
	compliance: number;
	/** Resistance [0-1]  */
	resistance: number;
	/** blood percentage */
	qPercent: number;
	/** the block itself */
	block: Block;
	/**
	 * the thorax block the unit stands in
	 */
	thoraxBlock: Block;
}

/**
 * Compute fresh-air data
 * TODO: POISON / CO
 */
function getUpperAirwaysInput(bodyState: BodyState, env: Environnment): UpperAirways {
	let fi02 = 0;
	const resistance: number[] = [0];
	let atmPressure = env.atmosphericPressure_mmHg;
	visit(
		bodyState,
		'LUNG',
		block => {
			respLogger.debug('Visit ', block, ' for fresh air');
			let currentResistance = resistance[0] || 0;
			const blockResistance = block.params.airResistance || 0;
			if (!block.params.intubated) {
				// intubation bypass resistance
				currentResistance = Math.max(currentResistance, blockResistance);
				respLogger.debug('Resistance: ', resistance);
			}
			resistance.unshift(currentResistance);

			if (block.params.fiO2 != null) {
				// Hit a block which provide fresh air !
				if (block.params.atmosphericPressure != null) {
					atmPressure = block.params.atmosphericPressure;
				}
				logger.log('FIO2: ', block.params.fiO2);

				if (typeof block.params.fiO2 === 'number') {
					fi02 = block.params.fiO2;
				} else {
					fi02 = env.FiO2;
				}
				return 'RETURN';
			}

			if (!block.params.intubated && blockResistance >= 1) {
				return 'BREAK';
			} else {
				return 'CONTINUE';
			}
		},
		{
			shouldWalk: c => !!c.params.o2,
			leaveBlock: () => resistance.shift(),
		},
	);

	return {
		FIO2: normalize(fi02, { min: 0, max: 1 }),
		resistance: normalize(resistance[0] || 0, { min: 0, max: 1 }),
		atmosphericPressureInmmHg: atmPressure,
	};
}

function getLowerAirways(bodyState: BodyState, upperResistance: number): LowerAirways[] {
	const units: LowerAirways[] = [];
	const resistance: number[] = [upperResistance];
	const qPercent: number[] = [1];

	// On utilise un repartiion du débit en %, jamais la vraie valeur

	// débit arteriel pulmonaire == Qa systemique ?

	const thorax_left = findBlock(bodyState, 'THORAX_LEFT');
	const thorax_right = findBlock(bodyState, 'THORAX_RIGHT');

	//const externalCompliance = thorax != null ? thorax.params.compliance ?? 1 : 1;

	//const externalCompliance = bodyState.variables.thoraxCompliance;

	visit(
		bodyState,
		'LUNG',
		block => {
			respLogger.info('Visit ', block, ' for units');

			const upperResistance = resistance[0] || 0;

			let selfResistance = upperResistance;

			if (block.params.airResistance) {
				selfResistance = Math.max(upperResistance, block.params.airResistance);
			}
			resistance.unshift(selfResistance);

			if (block.name.startsWith('UNIT_')) {
				respLogger.info('Found Unit: ', qPercent[0]);
				const thorax = block.name.startsWith('UNIT_BRONCHUS_1') ? thorax_left : thorax_right;

				// Bad compliance increases resistance
				const compliance = block.params.compliance ?? 1;
				const resistance = add(selfResistance, 0.98 * (1 - compliance), { min: 0, max: 1 });

				units.push({
					compliance: compliance,
					resistance: resistance, // selfResistance,
					qPercent: qPercent[0]!,
					block: block,
					thoraxBlock: thorax!,
				});
				return 'BREAK';
			}

			return 'CONTINUE';
		},
		{
			leaveBlock: b => {
				resistance.shift();
				qPercent.shift();
				respLogger.info(`Leave ${b.name}: `, qPercent);
			},
			shouldWalk: c => {
				if (c.params.o2) {
					const qP = qPercent[0] ?? 1;
					qPercent.unshift((c.params.blood ?? 0) * qP);
					respLogger.info(`Enter ${c.to}: `, qPercent);
					return c.params.o2;
				} else {
					return false;
				}
			},
		},
	);

	return units;
}

function computeSaO2(paO2_mmHg: number): number {
	// edge case
	if (paO2_mmHg === Infinity) {
		return 100;
	} else if (paO2_mmHg <= 0) {
		return 0;
	} else {
		// The Severingaus equation
		return 1 / (23400 / (paO2_mmHg * paO2_mmHg * paO2_mmHg + 150 * paO2_mmHg) + 1);
	}
}

/**
 * The Roger K. Ellis formula to compute PaO2 from SaO2
 *
 * @param SaO2_percent sao2 value, between 0 and 1.
 */
function computePaO2_mmHg(SaO2_percent: number): number {
	if (SaO2_percent <= 0) {
		return 0;
	} else {
		const a = 11700 / (1 / SaO2_percent - 1);
		const b = Math.sqrt(50 * 50 * 50 + a * a);

		return Math.cbrt(b + a) - Math.cbrt(b - a);
	}
}

const getGramOfHemoglobin = (erythrocytes_mL: number) => {
	// review please
	//based on 150 g/l of Hb and 45% hematocrit
	// ie 1gHb dans 3ml redCell
	return erythrocytes_mL / 3;
};

const getBloodVolume_mL = (state: BodyState) =>
	state.vitals.cardio.totalVolumeOfPlasmaProteins_mL +
	state.vitals.cardio.totalVolumeOfWater_mL +
	state.vitals.cardio.totalVolumeOfWhiteBloodCells_mL +
	state.vitals.cardio.totalVolumeOfErythrocytes_mL;

function computeEffectiveVolumesPerUnit(
	positivePressure: boolean,
	body: BodyState,
	meta: HumanBody['meta'],
	upperAirways: UpperAirways,
	units: LowerAirways[],
) {
	respLogger.log('Airways: ', { upper: upperAirways, lower: units });
	const nbUnits = units.length;

	const alvVolume_L = body.vitals.respiration.tidalVolume_L * body.vitals.respiration.rr;
	const effectiveAlvVolume_L = Math.min(alvVolume_L, meta.maximumVoluntaryVentilation_L);
	const effectiveTidalVolume_L =body.vitals.respiration.rr > 0 ? 
		effectiveAlvVolume_L / body.vitals.respiration.rr : 0;

	const idealTotalVolume_L = normalize(
		effectiveTidalVolume_L - meta.deadSpace_L,
		// body.vitals.respiration.tidalVolume_L - meta.deadSpace_L,
		{ min: 0 },
	);

	const perUnitThMaxCapacity_L = meta.inspiratoryCapacity_mL / (nbUnits * 1000);

	const externalCompliance = body.vitals.respiration.thoraxCompliance ?? 1;

	if (positivePressure === true) {
		// https://www.ch-carcassonne.fr/imgfr/files/Drainage%20Thoracique%20PowerPoint%20Mr%20Glapiack.pdf

		// full tidalVolume is injected
		let totalEffectiveMaximum_L = 0;
		const unitsEffectiveMaximum_L = units.map(unit => {
			const capacity = perUnitThMaxCapacity_L * (1 - unit.resistance);
			totalEffectiveMaximum_L += capacity;
			return capacity;
		});

		respLogger.info('Effective Volume #1', unitsEffectiveMaximum_L, {
			totalEffectiveMaximum_L,
		});

		let toDispatch = idealTotalVolume_L;

		const ru: number[] = [];
		let updated = true;
		let nbNotFullUnit = nbUnits;
		while (toDispatch > 0 && updated) {
			const idealVolumePerUnit_L = toDispatch / nbNotFullUnit;
			updated = false;
			for (let i = 0; i < nbUnits; i++) {
				const currentVa = (ru[i] = ru[i] ?? 0);
				const maxVa = unitsEffectiveMaximum_L[i]!;
				if (currentVa < maxVa) {
					// skip any already-full unit
					const newVa = Math.min(maxVa, currentVa + idealVolumePerUnit_L);
					const delta = newVa - currentVa;
					if (delta > 0) {
						if (newVa >= maxVa) {
							// unit reaches its maximum
							nbNotFullUnit--;
						}

						toDispatch -= delta;
						updated = true;
						ru[i] = newVa;
					}
				}
			}
		}

		if (toDispatch > 0) {
			respLogger.warn('PositivePressure: unable to dispatch all volume');
			// machine should stop
		}

		/*const ru_ = unitsEffectiveMaximum_L.map((unitMax) => {
				if (totalEffectiveMaximum_L <= 0) {
					return 0;
				} else {
					respLogger.debug("Dispatch volume ", { unitMax, idealVolumePerUnit_L })
					return Math.min(unitMax, idealVolumePerUnit_L);
					//return (unitMax * idealTotalVolume_L) / effectiveTotal_L;
				}
			});*/
		// compliance means air-leak
		// TODO: open vs simple pneumothorax
		const leaks: number[] = [];
		for (let i = 0; i < nbUnits; i++) {
			const unit = units[i]!;
			const leak = ru[i]! * (1 - unit.compliance);
			const eCompliance = Math.min(unit.compliance, externalCompliance);
			const delta = ru[i]! * (1 - eCompliance);
			ru[i] -= delta;
			if (unit.block.params.pneumothorax === 'SIMPLE') {
				const ip = unit.thoraxBlock.params.internalPressure;
				if (ip == null || typeof ip === 'number') {
					// since internal pressure is not "DRAIN", let's inflate the thorax
					unit.thoraxBlock.params.internalPressure = (ip ?? 0) + leak;
				}
			}
			leaks[i] = leak;
		}

		respLogger.info('PositivePressure RU: ', { idealTotalVolume_L, ru, leaks });

		return ru;
	} else {
		const idealVolumePerUnit_L = idealTotalVolume_L / nbUnits;
		const effectiveUnitMax = Math.min(idealVolumePerUnit_L, perUnitThMaxCapacity_L);
		const ru = units.map(unit => {
			const eCompliance = Math.min(unit.compliance, externalCompliance);
			return effectiveUnitMax * eCompliance * (1 - unit.resistance);
		});
		respLogger.info('Normal RU: ', ru);
		return ru;
	}
}

function getEffortLevel(bodyState: BodyState): number {
	switch (bodyState.variables.bodyPosition) {
		case 'STANDING':
			return 0.1;
		case 'SITTING':
			return 0.09;
		case 'PRONE_DECUBITUS':
		case 'SUPINE_DECUBITUS':
		case 'RECOVERY':
			return 0.075;
	}
}

const painModel: Point[] = [
	{x: 1, y: 0},
	{x: 3, y: 0},
	{x: 10, y: 0.35},
]

function getVO2_mLperMin(bodyState: BodyState, meta: HumanMeta): number {
	const positionEffort = getEffortLevel(bodyState);
	const painEffort = interpolate(bodyState.vitals.pain, painModel);

	const effort = normalize(positionEffort + painEffort, {min: 0, max: 1});
	//const effort = positionEffort;

	const vo2 = interpolate(effort, [
		{ x: 0, y: meta.VO2min_mLperKgMin },
		{ x: 1, y: meta.VO2max_mLperKgMin },
	]);

	logger.info('VO2: ', { vo2, effort });
	return vo2 * meta.effectiveWeight_kg;
}

export function compute(
	body: BodyState,
	meta: HumanBody['meta'],
	env: Environnment,
	duration_min: number,
): BodyState['vitals'] {
	//const newVitals = cloneDeep(body.vitals);
	//const newVitals = body.vitals;
	calcLogger.info('Compute Vitals based on ', body);

	const indexChoc = body.vitals.cardio.hr / body.vitals.cardio.systolicPressure;

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Cardiovascular system
	/////////////////////////////////////////////////////////////////////////////////////////////////

	const bloodVolume_mL = getBloodVolume_mL(body);
	const bloodVolume_L = bloodVolume_mL / 1000;
	//	calcLogger.info("Blood ", bloodVolume_L);

	// https://anesthesiologie.umontreal.ca/wp-content/uploads/sites/33/2013-Science-de-base_partie-1.pdf  s20  20ml /kg
	// TODO : unstressedModel = f(complianceVeineuse)
	//const unstressedModel = [{ x: 0.16, y: meta.unstressedCapacitance_L }, { x: 0, y: 0 }];
	//	const unstressedModel_lperKg = [
	//		{x: 0.05, y: 0.01},
	//		{ x: 0.16, y: 0.02 },
	//		{x: 0.2, y: 0.035}
	//	];

	/** Volume capacitance veineuse zero */
	//	const unstressedCapacitance_L = meta.weight_kg * interpolate(body.vitals.cardio.venousCompliance_LPerMmHg, unstressedModel_lperKg);
	//	logger.warn("Unstressed: ", {unstressedCapacitance_L});

	//	const stressedCapacitance_L = normalize((bloodVolume_L * 0.80) - unstressedCapacitance_L, { min: 0 });
	//  const stressedCapacitance_L =
	//	bloodVolume_L - body.vitals.cardio.unstressedCapacitance_L;

	// Stroke volume: volume of blood pump per beat
	// heart pumps blood from stressed volume
	//	const strokeVolume_mL = Math.min(
	//		body.vitals.cardio.endDiastolicVolume_mL -
	//		body.vitals.cardio.endSystolicVolume_mL, stressedCapacitance_L * 1000);

	const edv_th_max = 160;

	const esv = body.vitals.cardio.endSystolicVolume_mL;

	// x: %volemie
	const edvMax_model: Point[] = [
		{ x: 0, y: esv },
		{ x: 0.4, y: esv + 10 },
		{ x: 0.6, y: esv + 20 },
		{ x: 0.9, y: 120 },
		{ x: 1, y: 120 },
		{ x: 1.2, y: edv_th_max - 5 },
		{ x: 1.3, y: edv_th_max },
	];

	const rBlood = bloodVolume_mL / meta.initialBloodVolume_mL;

	const edv_preload = interpolate(rBlood, edvMax_model);

	const tamponade_model: Point[] = [
		{ x: 0, y: edv_th_max },
		{ x: 10, y: 110 },
		{ x: 150, y: esv },
	];

	// tamponade := pericardial_pressure [0;1]
	// https://www.sfmu.org/upload/70_formation/02_eformation/02_congres/Urgences/urgences2014/donnees/pdf/059.pdf
	const edv_tamponade = interpolate(body.variables.pericardial_ml, tamponade_model);

	const itp_l_raw = body.blocks.get('THORAX_LEFT')!.params.internalPressure;

	const itp_r_raw = body.blocks.get('THORAX_RIGHT')!.params.internalPressure;

	const itp_L = typeof itp_l_raw === 'number' ? itp_l_raw : 0;
	const itp_R = typeof itp_r_raw === 'number' ? itp_r_raw : 0;

	const itp = (itp_L + itp_R) / 2;

	const tensionPneumothoraxModel: Point[] = [
		{ x: 0, y: edv_th_max },
		{ x: 4, y: esv },
	];

	const edv_pno = interpolate(itp, tensionPneumothoraxModel);

	const edvEffective = Math.min(
		//body.vitals.cardio.endDiastolicVolume_mL,
		edv_preload,
		edv_tamponade,
		edv_pno,
	);

	calcLogger.info('Ratio Blood: ', rBlood, edvEffective, { edv_preload, edv_tamponade });

	// Quick fix to limit maximum MAP to 200
	//const MAX_MAP = 200;
	/*const strokeVolume_Max = 1000 * MAX_MAP / (body.vitals.cardio.Ra_mmHgMinPerL * body.vitals.cardio.hr);

	let strokeVolume_mL = add(edvEffective, - body.vitals.cardio.endSystolicVolume_mL, {
		min: 0, max: strokeVolume_Max
	});*/

	const strokeVolume_mL = edvEffective - esv;

	/*
	const fe = strokeVolume_mL / edvEffective;
	if (fe < 0.6) {
		let ratio =  (fe + 0.4);
		ratio *= ratio;
		//ratio *= ratio;
		wlog("Stroke Volume Limitation ", {fe, strokeVolume_mL, new: strokeVolume_mL * ratio});
		strokeVolume_mL *= ratio;
	}*/

	/*
	if (indexChoc > 1){
		wlog("Index", {indexChoc, strokeVolume_mL, newStrokeVolume: strokeVolume_mL / indexChoc})
		strokeVolume_mL /= indexChoc;
	}*/

	// Cardiac output (Qc) [L/min]
	let Qc_LPerMin = (strokeVolume_mL * body.vitals.cardio.hr) / 1000;

	// TODO: edge case stressedCapacitance < 0
	//	const PVSM_mmHg =
	//		stressedCapacitance_L / body.vitals.cardio.venousCompliance_LPerMmHg;

	//	const Qrv_LPerMin = normalize(
	//		(PVSM_mmHg - body.vitals.cardio.PVC_mmHg) /
	//		body.vitals.cardio.Rrv_mmHgMinPerL, { min: 0 });

	//q_delta_mLPermin;

	// const Qrv_LPerMin = Qc_LPerMin - body.vitals.cardio.q_delta_mLPermin / 1000;

	// const Qcm = (Qrv_LPerMin + Qc_LPerMin) / 2.0;

	// Mean arterial pressure
	//const MAP = Qcm * (body.vitals.cardio.Ra_mmHgMinPerL);
	let MAP = Qc_LPerMin * body.vitals.cardio.Ra_mmHgMinPerL;

	// Afterload
	/////////////////

	// strokeVolume to pressure
	/*const ventricularPressureModel: Point[] = [
		{ x: 0, y: 0 },
		{ x: 50, y: 60 },
		{ x: 70, y: 120 },
		{ x: 100, y: 200 },
		{ x: 140, y: 240 },
	];*/

	const ventricularPressureModel: Point[] = [
		{ x: 0, y: 0 },
		{ x: 50, y: 80 },
		{ x: 70, y: 120 },
		{ x: 100, y: 145 },
		{ x: 140, y: 160 },
	];
	const ventricularPressure = interpolate(strokeVolume_mL, ventricularPressureModel);

	// Computed map is bigger than ventricular pressure
	// Afterload
	if (MAP > ventricularPressure) {
		calcLogger.info('MAP greater than ventricular pressure', {
			time: body.time,
			MAP,
			ventricularPressure,
		});
		MAP = ventricularPressure;
		Qc_LPerMin = MAP / body.vitals.cardio.Ra_mmHgMinPerL;
	}

	calcLogger.log('Cardio: ', {
		time: body.time,
		MAP,
		strokeVolume_mL,
		hr: body.vitals.cardio.hr,
		//Qcm,
		Qc_LPerMin,
		//Qrv_LPerMin,
		ra: body.vitals.cardio.Ra_mmHgMinPerL,
		delta: body.vitals.cardio.q_delta_mLPermin,
	});

	body.vitals.cardio.strokeVolume_mL = strokeVolume_mL;
	body.vitals.cardio.MAP = MAP;
	body.vitals.cardio.systolicPressure = 1.5 * MAP; // 3 * MAP / 2;

	body.vitals.cardio.endDiastolicVolume_mL = edvEffective;
	body.vitals.cardio.radialPulse = body.vitals.cardio.systolicPressure > 80;
	//const diastolicPressure = x;

	body.vitals.cardio.cardiacOutput_LPerMin = Qc_LPerMin;
	//body.vitals.cardio.cardiacOutputRv_LPerMin = Qrv_LPerMin;

	calcLogger.info('Cardio: ', {
		input: { ...body.vitals.cardio },
		strokeVolume_mL,
		Qc_LPerMin,
		//stressedCapacitance_L,
		//PVSM_mmHg,
		//Qrv_LPerMin,
		//Qcm,
		MAP,
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Respiration
	/////////////////////////////////////////////////////////////////////////////////////////////////

	// todo: ideal of effective ?
	const vo2_mLperMin = getVO2_mLperMin(body, meta);

	/*
	const vo2_mLperMin = Math.min(
		vo2_mLperMin,
		body.vitals.cardio.DO2Sys,
	);
	*/

	const vco2_mLPerMin =
		// vo2_mLperMin * body.vitals.respiration.QR;
		vo2_mLperMin *
		/*Math.min(
			vo2_mLperMin,
			body.vitals.cardio.DO2Sys,
		)*/
		body.vitals.respiration.QR;

	const upperAirways = getUpperAirwaysInput(body, env);
	const units = getLowerAirways(body, upperAirways.resistance);

	const positivePressure = body.variables.positivePressure === true;

	if (!body.vitals.spontaneousBreathing) {
		respLogger.info('no spontaneous breathing');
		body.vitals.respiration.tidalVolume_L = 0;
		body.vitals.respiration.rr = 0;
	}
	if (positivePressure === true) {
		// TODO fetch from inputs
		body.vitals.respiration.tidalVolume_L = 0.5;
		body.vitals.respiration.rr = 15;
	}

	respLogger.log('Positive Pressure', {
		positivePressure,
		tidal: body.vitals.respiration.tidalVolume_L,
		rr: body.vitals.respiration.rr,
	});

	const effectiveVolumesPerUnit_L = computeEffectiveVolumesPerUnit(
		positivePressure,
		body,
		meta,
		upperAirways,
		units,
	);

	body.vitals.respiration.alveolarVolume_L = effectiveVolumesPerUnit_L.reduce<number>(
		(acc, curr) => {
			return acc + curr;
		},
		0,
	);

	//respLogger.info("Effective Volume dispatch", effectiveVolumesPerUnit_L);

	/** Hemoglobin concentration, gram per litre */
	const hb_gPerL =
		bloodVolume_L > 0
			? getGramOfHemoglobin(body.vitals.cardio.totalVolumeOfErythrocytes_mL) / bloodVolume_L
			: 0;

	respLogger.log('Respiration Step1: ', {
		vo2_mLkgperMin: vo2_mLperMin,
		weight: meta.effectiveWeight_kg,
		vo2_mLperMin,
		vco2_mLPerMin,
		effectiveVolumesPerUnit_L,
		hb_gPerL,
	});
	respLogger.info('RespiratoryUnits: ', units);

	/**
	 * Constant value for vapour pressure of water
	 */
	const pH2O_mmHg = 47; /// =~ f(37C°)
	// Compute Alveolar–arterial gradient [mmHg]
	const AaDO2 = 0.3 * meta.age + (upperAirways.FIO2 - 0.21) * 10 * 6;

	// Compute SaO2 and CaO2 for each respiratory unit
	const unitOutputs = units.map((unit, i) => {
		const Va_LperMin = effectiveVolumesPerUnit_L[i]! * body.vitals.respiration.rr;
		const vco2InUnit_mlPerMin = vco2_mLPerMin * unit.qPercent;

		if (unit.qPercent <= 0) {
			respLogger.log('NO PERFUSION');
			return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };
		}

		if (unit.compliance <= 0.01) {
			respLogger.log('Empty unit (compliance=0)');
			return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };
		}

		let PACO2 = unit.block.params.PACO2 ?? 0;

		if (Va_LperMin <= 0) {
			// No ventilation!
			const inLungs_mL = meta.inspiratoryCapacity_mL * 0.33;
			const CO2delta_mL = vco2InUnit_mlPerMin * duration_min;
			const co2Percent = CO2delta_mL / inLungs_mL;
			const PACO2_delta = PACO2 * co2Percent;
			PACO2 += PACO2_delta;

			//return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };

			respLogger.log('NO AIR: PACO2=', PACO2, ' + ', PACO2_delta, {
				vco2_mLPerMin,
				vco2InUnit_mlPerMin,
				inLungs_mL,
				CO2delta_mL,
				co2Percent,
			});
		} else {
			// Ventilation: formula is fine
			const Va_mlPerMin = Va_LperMin * 1000;

			// https://www.medmastery.com/guide/blood-gas-analysis-clinical-guide/how-are-paco2-and-minute-ventilation-related
			const ratio_vco2Va = vco2InUnit_mlPerMin / Va_mlPerMin;

			respLogger.log('VCO2 / VA = ', vco2InUnit_mlPerMin, Va_mlPerMin, unit.qPercent, ratio_vco2Va);

			// Compute partial alveolar CO2 saturation [mmHG]
			PACO2 = 1000 * K * ratio_vco2Va;
		}
		respLogger.log('PACO2 => ', PACO2);
		unit.block.params.PACO2 = PACO2;

		/**
		 * vapour pressure of water in mmHg
		 * f(body temperature)
		 * Based on the "Antoine Equation"
		 */
		//const pH2o_mmHg = (temp_celsius: number) => Math.pow(10, 8.07131 - (1730.63 / (233.426 + temp_celsius)));

		// Compute partial alveolar oxygen saturation [mmHG]
		const PAO2_raw =
			(upperAirways.atmosphericPressureInmmHg - pH2O_mmHg) * upperAirways.FIO2 -
			PACO2 / body.vitals.respiration.QR;

		respLogger.log(` PAO2=`, PAO2_raw, {
			pAtm: upperAirways.atmosphericPressureInmmHg,
			pH2O_mmHg,
			Fio2: upperAirways.FIO2,
			PACO2,
			qr: body.vitals.respiration.QR,
		});

		const PAO2 = normalize(PAO2_raw, { min: 0 });

		let PaO2_mmHg = normalize(PAO2 - AaDO2, { min: 0 });
		//const PaO2_kPa = convertTorrToKPa(PaO2_mmHg); // useless

		if (indexChoc > 1) {
			PaO2_mmHg /= indexChoc;
		}

		const SaO2 = computeSaO2(PaO2_mmHg);

		const CaO2 = 1.34 * SaO2 * hb_gPerL + PaO2_mmHg * 0.03;

		respLogger.log(` * Unit #${i}`, {
			indexChoc,
			Va_LperMin,
			vco2InUnit_mlPerMin,
			PACO2,
			pH2O_mmHg,
			PAO2,
			AaDO2,
			PaO2_mmHg,
			SaO2,
			CaO2,
		});

		return { SaO2, CaO2, PaO2_mmHg, qPercent: unit.qPercent };
	});

	respLogger.info('Respiration Step2: ', unitOutputs);
	// consolidate SaO2 and CaO2;
	// -> blood in the pulmonary vein
	const { SaO2, CaO2 } = unitOutputs.reduce(
		(output, unit) => {
			output.SaO2 += unit.SaO2 * unit.qPercent;
			output.CaO2 += unit.CaO2 * unit.qPercent;
			respLogger.debug(`Unit : ${unit.qPercent}\t ${unit.SaO2}\t${unit.CaO2}\t${unit.PaO2_mmHg}`);
			return output;
		},
		{ SaO2: 0, CaO2: 0 },
	);

	//const CaO2 = 1.34 * SaO2 * hb_gPerL + PaO2_mmHg * 0.03;
	const computedPaO2 = computePaO2_mmHg(SaO2);
	//const computedPaO2_v2 = computePaO2(hb_gPerL, CaO2);

	const PaO2_mmHg = computedPaO2;
	/*wlog("PaO2 to PaCO2", {
		PaO2_mmHg,
		indexChoc,
		result: (indexChoc > 1 ? PaO2_mmHg * indexChoc : PaO2_mmHg)
	});*/
	// see indexChoc hack

	const PAO2 = AaDO2 + (indexChoc > 1 ? PaO2_mmHg * indexChoc : PaO2_mmHg);

	const PaCO2_mmHg =
		body.vitals.respiration.QR *
		((upperAirways.atmosphericPressureInmmHg - pH2O_mmHg) * upperAirways.FIO2 - PAO2);

	/* const PaCO2_mmHg = add(
		body.vitals.respiration.QR * (
			(upperAirways.atmosphericPressureInmmHg - pH2O_mmHg) * upperAirways.FIO2
			// - PaO2_mmHg
		), -AaDO2, { min: 0 });
		*/

	//const recomputedSaO2 = computeSaO2(computedPaO2_v2);

	//respLogger.debug(`Glob : 1\t${SaO2}\t${recomputedSaO2}\t${CaO2}\t${computedPaO2}\t${computedPaO2_v2}`);
	respLogger.log('log : ', { SaO2, CaO2, PaO2_mmHg, PaCO2_mmHg });

	if (isLungsVasoconstrictionEnabled()) {
		// update qFactors
		// units which output low saturation are discarded by vasoconstriction
		const nbConnection = Math.pow(2, meta.lungDepth + 1) - 1;

		// new computed qFactor (tree stored as array)
		const qTree: number[] = [];
		// current SaO2 tree, to compute new qFactors
		const sao2Tree: number[] = [];

		let i = nbConnection - 1;
		unitOutputs.reverse().forEach(unitResult => {
			sao2Tree[i] = Math.pow(unitResult.PaO2_mmHg, 4);
			i--;
		});
		respLogger.log('Update QFactors: ', { sao2Tree, nbConnection, i });

		for (; i >= 0; i--) {
			const leftChildIndex = 2 * i + 1;
			const rightChildIndex = leftChildIndex + 1;

			const leftSaO2 = sao2Tree[leftChildIndex]!;
			const rightSaO2 = sao2Tree[rightChildIndex]!;

			const sum = leftSaO2 + rightSaO2;
			sao2Tree[i] = sum;
			if (sum > 0) {
				qTree[leftChildIndex] = leftSaO2 / sum;
				qTree[rightChildIndex] = rightSaO2 / sum;
			} else {
				qTree[leftChildIndex] = 0.5;
				qTree[rightChildIndex] = 0.5;
			}
			respLogger.log('Process Tree: ', {
				leftChildIndex,
				rightChildIndex,
				leftSaO2,
				rightSaO2,
				sum,
			});
		}
		if (qTree.length > 1) {
			qTree[0] = qTree[1]! + qTree[2]!;
		}
		respLogger.log('Updated QFactors: ', { qTree, sao2Tree });

		const blockNames: string[] = [];
		for (i = 0; i < nbConnection; i++) {
			const parent = i % 2 === 0 ? i / 2 - 1 : (i - 1) / 2;
			if (i === 0) {
				blockNames.push('LUNG');
			} else {
				if (i <= 2) {
					blockNames.push('BRONCHUS_' + i);
				} else {
					const childNumber = i % 2 === 0 ? '2' : '1';
					blockNames.push(blockNames[parent] + childNumber);
				}
				const parentBlock = findBlock(body, blockNames[parent]!);
				if (parentBlock) {
					const connection = parentBlock.connections.find(c => c.to === blockNames[i]);
					if (connection) {
						const params = body.connections[connection.paramsId];
						if (params) {
							params.blood = qTree[i];
						}
					}
				}
			}
		}
	}

	// if (false) {
	// 	// review
	// 	// delay SaO2 and CaO2 according to cardiac output
	// 	// delay is the time the heart needs to pump 40% of the blood
	// 	//const delay = (bloodVolume_L * 2) / Qc_LPerMin;
	// 	const delay = 3;

	// 	const computeDelayed = (current: number, next: number): number => {
	// 		const delta = next - current;
	// 		return duration_min < delay
	// 			? current + (delta * duration_min) / delay
	// 			: next;
	// 	};
	// 	const delayedSaO2 = computeDelayed(body.vitals.respiration.SaO2, SaO2);
	// 	const delayedCaO2 = computeDelayed(body.vitals.respiration.CaO2, CaO2);
	// 	const delayedPaO2 = computeDelayed(body.vitals.respiration.PaO2, PaO2_mmHg);

	// 	/*const deltaSaO2 = SaO2 - body.vitals.respiration.SaO2;
	// 		const delayedSaO2 =
	// 			duration_min < delay
	// 				? body.vitals.respiration.SaO2 + (deltaSaO2 * duration_min) / delay
	// 				: SaO2;

	// 		const deltaCaO2 = CaO2 - body.vitals.respiration.CaO2;
	// 		const delayedCaO2 =
	// 			duration_min < delay
	// 				? body.vitals.respiration.CaO2 + (deltaCaO2 * duration_min) / delay
	// 				: CaO2;
	// 		*/

	// 	respLogger.log("Delayed SaO2,CaO2:", {
	// 		delay,
	// 		duration_min,
	// 		SaO2,
	// 		delayedSaO2,
	// 		CaO2,
	// 		delayedCaO2,
	// 		PaO2_mmHg,
	// 		delayedPaO2,
	// 	});

	// 	SaO2 = delayedSaO2;
	// 	CaO2 = delayedCaO2;
	// 	PaO2_mmHg = delayedPaO2;
	// }

	body.vitals.respiration.stridor = upperAirways.resistance > 0.25;

	body.vitals.respiration.SaO2 = SaO2;

	body.vitals.respiration.SpO2 = SaO2 * getSpO2Ratio({ state: body, meta: meta });

	body.vitals.respiration.CaO2 = CaO2;

	const do2Sys = Qc_LPerMin * CaO2;
	body.vitals.cardio.DO2Sys = do2Sys;
	body.vitals.cardio.vo2_mLperMin = vo2_mLperMin;

	//const PaO2_mmHg_fromSaO2 = computePaO2_mmHg(SaO2);
	body.vitals.respiration.PaO2 = PaO2_mmHg;
	body.vitals.respiration.PaCO2 = PaCO2_mmHg;

	respLogger.log('Final SaO2,CaO2, PaO2:', { SaO2, CaO2, PaO2_mmHg });

	logger.info('VO2 VS DO2', vo2_mLperMin, do2Sys);
	if (do2Sys < vo2_mLperMin * 0.8) {
		logger.log('DO2 < VO2: Gambate !!!');
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Brain
	/////////////////////////////////////////////////////////////////////////////////////////////////
	/* Pression Perfusion Cerebrale */
	//const Pp = MAP - body.vitals.brain.ICP_mmHg;
	//const qbrTh = Pp / body.vitals.brain.Rbr;
	//const Qbr = Pp > 50 ? theoreticalQbr : qbrTh;

	const Qbr = (body.blocks.get('BRAIN')?.params.bloodFlow_mLper ?? 0) / 1000;

	// CaO2
	const DO2 = Qbr * CaO2;

	logger.log('Brain: ', {
		input: { ...body.vitals.brain },
		Qbr,
		DO2,
	});

	body.vitals.brain.DO2 = DO2;

	return body.vitals;
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Compensation
/////////////////////////////////////////////////////////////////////////////////////////////////

//const TRC_MODEL: Point[] = [
//	{ x: 0, y: 10 }, // MAP=0 => TRC=>10
//	{ x: 60, y: 2 },
//	{ x: 200, y: 0 },
//];

const computeRecap = (state: BodyState): number => {
	const indexChoc = state.vitals.cardio.hr / state.vitals.cardio.systolicPressure;
	if (Number.isNaN(indexChoc)) {
		return 10;
	}

	calcLogger.info(
		'TRC: 2sec * (',
		state.vitals.cardio.hr,
		state.vitals.cardio.MAP,
		'), => ',
		indexChoc * 2,
	);

	return 2 * indexChoc;
	// return interpolate(state.vitals.cardio.MAP, TRC_MODEL);
};

// Seuils ischémiques
// QBr ml/min/100g de cerveau | desc      | Qbr cerveau 1.4kg | Do2 avec CaO2 2000 | Do2/100g

//   <8 | seuil infarctus | 112 | 22.4 | 1.6
//  <12 | ischémie        | 168 | 33.6 | 2.4
//  <20 | seuil pénombre  | 280 | 56   | 4
//  <40 | oligémie        | 560 | 112  | 8
//  ... | normal          | 840 | 168  | 12

const GCS_DO2_MODEL: Point[] = [
	{ x: 1.6, y: 3 },
	{ x: 2.4, y: 8 },
	{ x: 4, y: 12 },
	{ x: 8, y: 15 },
];

// https://anesthesiologie.umontreal.ca/wp-content/uploads/sites/33/Isch_cer.pdf

const GCS_BlVol_MODEL: Point[] = [
	{ x: 0.4, y: 3 },
	{ x: 0.7, y: 12 },
	{ x: 0.85, y: 14 },
	{ x: 1, y: 15 },
];

const getGCSTotal = ({ state, meta }: HumanBody): Glasgow['total'] => {
	const DO2 = state.vitals.brain.DO2;
	if (Number.isNaN(DO2)) {
		return 3;
	}

	const DO2_100g = (100 * DO2) / meta.brainWeight_g;

	logger.info('DO2: ', { DO2_100g, DO2, weight: meta.brainWeight_g });

	const gDO2 = Math.round(interpolate(DO2_100g, GCS_DO2_MODEL)) as Glasgow['total'];

	const bloodRatio = getBloodRatio({ meta: meta, state: state });
	const gBloodVolume = Math.ceil(interpolate(bloodRatio, GCS_BlVol_MODEL)) as Glasgow['total'];

	return Math.min(gDO2, gBloodVolume) as Glasgow['total'];
};

const computeGlasgow = (body: HumanBody): Glasgow => {
	// total = f(ICP);
	const total = getGCSTotal(body);
	let gcs: Glasgow;
	logger.log('Total: ', total, ' based on ', body.state.vitals.brain.DO2);

	switch (total) {
		case 15:
			gcs = { total: total, eye: 4, verbal: 5, motor: 6 };
			break;
		case 14:
			gcs = { total: total, eye: 4, verbal: 4, motor: 6 };
			break;
		case 13:
			gcs = { total: total, eye: 3, verbal: 4, motor: 6 };
			break;
		case 12:
			gcs = { total: total, eye: 3, verbal: 4, motor: 5 };
			break;
		case 11:
			gcs = { total: total, eye: 3, verbal: 3, motor: 5 };
			break;
		case 10:
			gcs = { total: total, eye: 2, verbal: 3, motor: 5 };
			break;
		case 9:
			gcs = { total: total, eye: 2, verbal: 2, motor: 5 };
			break;
		case 8:
			gcs = { total: total, eye: 2, verbal: 2, motor: 4 };
			break;
		case 7:
			gcs = { total: total, eye: 1, verbal: 2, motor: 4 };
			break;
		case 6:
			gcs = { total: total, eye: 1, verbal: 1, motor: 4 };
			break;
		case 5:
			gcs = { total: total, eye: 1, verbal: 1, motor: 3 };
			break;
		case 4:
			gcs = { total: total, eye: 1, verbal: 1, motor: 2 };
			break;
		case 3:
			gcs = { total: total, eye: 1, verbal: 1, motor: 1 };
			break;
	}

	if (gcs.total !== gcs.eye + gcs.motor + gcs.verbal) {
		logger.error('GCS: total do not match', gcs);
	}

	return gcs;
};

/**
 *
 */
export type SympSystem = Partial<Record<BodyStateKeys, Point[]>>;

/**
 *
 */
interface CompensationRule {
	t4Nerve?: boolean | undefined;
	points: Point[];
}

export type CompesationKeys =
	| 'vitals.respiration.tidalVolume_L'
	| 'vitals.cardio.hr'
	| 'vitals.cardio.endSystolicVolume_mL'
	| 'vitals.cardio.Ra_mmHgMinPerL'
	| 'vitals.respiration.rr';

export type Compensation = Record<CompesationKeys, CompensationRule>;

//'respiration.rr'?: CompensationRule;
//'respiration.tidalVolume_L?': CompensationRule;
//'cardio.hr?': CompensationRule;

const icp_model: Point[] = [
	{ x: 10, y: 0 },
	{ x: 50, y: 1 },
];

const average = false;

export function computeOrthoLevel(state: BodyState, meta: HumanBody['meta'], duration_min: number) {
	if (state.vitals.cardiacArrest! > 0) {
		state.variables.paraOrthoLevel = 0;
		return;
	}

	/*
	 * compute (para)symptathic system level
	 */
	const sympSystem = getSystemModel();

	const sympEntries = Object.entries(sympSystem);

	let sympatheticDelta = normalize(
		sympEntries.reduce<number>((total, [key, value]) => {
			const currentValue = getVitals(state, key as BodyStateKeys);
			const y = interpolate(currentValue!, value);
			compLogger.log('SympLevel: ', key, currentValue, y);
			return total + y;
		}, 0),
		{ min: 0, max: 100 },
	);

	if (average) {
		sympatheticDelta /= sympEntries.length;
	}

	compLogger.log('Delta: ', sympatheticDelta);
	let level = state.variables.paraOrthoLevel;
	if (sympatheticDelta > 0) {
		// compensation required
		level += sympatheticDelta;
	} else {
		// no compensation required
		level *= 0.99;
	}

	level = normalize(level, {
		min: 0,
		max: 100,
	});
	compLogger.log('SympLevel: ', level);

	state.variables.paraOrthoLevel = level;
}

function computeVitals(
	level: number,
	model: Compensation,
	state: BodyState,
	meta: HumanBody['meta'],
	duration_min: number,
	t4Fine: boolean,
	noT4Level: number,
): Record<CompesationKeys, number> {
	compLogger.info('CompensationProfile: ', model);

	const result: Partial<Record<CompesationKeys, number>> = {};

	Object.entries(model).forEach(([k, value]) => {
		const key = k as CompesationKeys;
		const currentValue = getVitals(state, key);

		if (
			(key === 'vitals.respiration.rr' || key === 'vitals.respiration.tidalVolume_L') &&
			!state.vitals.spontaneousBreathing
		) {
			compLogger.info('No spontaneous breathing: skip', key);
			return;
		}

		compLogger.info(
			'Compensate: ',
			key,
			'=',
			currentValue,
			value.points,
			'(',
			duration_min,
			'[s])',
		);
		let newValue = interpolate(value.t4Nerve && !t4Fine ? noT4Level : level, value.points);

		const bounds = readKey<Bound>(meta.bounds, key);
		if (bounds != null) {
			compLogger.info('Within Bounds: ', { percent: newValue, bounds });
			newValue = bounds.min + newValue * (bounds.max - bounds.min);
			compLogger.info('CompensateNewvalue: ', key, ' => ', newValue, ' within bounds ', bounds);
		}

		//const normalized =
		// normalize(newValue, {
		//	min: value.min,
		//	max: value.max,
		//});
		compLogger.log('Compensated value: ', key, currentValue, ' => ', newValue);
		result[key] = newValue;
	});

	return result as Record<CompesationKeys, number>;
}

/**
 * Update some vitals according to current orthosympathetic kevel
 */
export function doCompensate(state: BodyState, meta: HumanBody['meta'], duration_min: number) {
	if (state.vitals.cardiacArrest! > 0) {
		return;
	}

	// is the connection to t4 fine?
	const t4Fine =
		findConnection(state, 'BRAIN', 'T5-L4', {
			validBlock: isNervousSystemFine,
			shouldWalk: isNervousSystemConnection,
		}).length > 0;

	const level = state.variables.paraOrthoLevel; // + state.vitals.pain;

	const compensation = getCompensationModel();
	if (compensation == null) {
		throw new Error('No compensation model');
	}

	const sympValues = computeVitals(level, compensation!, state, meta, duration_min, t4Fine, 20);

	const overdriveLevel = interpolate(state.variables.ICP_mmHg, icp_model);

	if (overdriveLevel > 0) {
		compLogger.info('Overdrive: ', { ICP: state.variables.ICP_mmHg, overdriveLevel });
		const overdriveModel = getOverdriveModel();

		const overdrivenValues = computeVitals(
			overdriveLevel,
			overdriveModel!,
			state,
			meta,
			duration_min,
			t4Fine,
			10,
		);
		compLogger.info('Values', sympValues, overdrivenValues);
		Object.entries(sympValues).forEach(([key, sympValue]) => {
			const overdriven = overdrivenValues[key as CompesationKeys];

			const value = overdriveLevel * overdriven + (1 - overdriveLevel) * sympValue;
			compLogger.info('OverdriveSet ', key, ' => ', value, {
				overdriveLevel,
				overdriven,
				sLevel: 1 - overdriveLevel,
				sympValue,
			});
			setVital(state, key as BodyStateKeys, value);
		});
	} else {
		Object.entries(sympValues).forEach(([key, value]) => {
			setVital(state, key as BodyStateKeys, value);
		});
	}

	compLogger.info('After (para)Sympatic: ', state.vitals);
}

export function compensate(state: BodyState, meta: HumanBody['meta'], duration_min: number) {
	computeOrthoLevel(state, meta, duration_min);
	doCompensate(state, meta, duration_min);
}

/**
 * Make sure human can hold its position
 */
export function fixPosition(human: HumanBody, fallback?: BodyPosition) {
	if (!human.state.vitals.canWalk) {
		if (human.state.variables.bodyPosition === 'STANDING') {
			if (fallback != null && fallback !== 'STANDING') {
				// human.state.variables.bodyPosition = fallback;
			} else {
				human.state.variables.bodyPosition = 'SITTING';
			}
		}
	}

	if (
		human.state.vitals.glasgow.eye < 4 ||
		human.state.vitals.glasgow.motor < 6 ||
		human.state.blocks.get('C1-C4')!.params.nervousSystemBroken ||
		human.state.blocks.get('C5-C7')!.params.nervousSystemBroken
	) {
		if (
			human.state.variables.bodyPosition === 'STANDING' ||
			human.state.variables.bodyPosition === 'SITTING'
		) {
			if (fallback != null && fallback !== 'STANDING' && fallback !== 'SITTING') {
				human.state.variables.bodyPosition = fallback;
			} else {
				human.state.variables.bodyPosition = 'SUPINE_DECUBITUS';
			}
		}
	}
}

function isNotBroken(block: Block): boolean {
	return !block.params.broken;
}

function isBone(c: RevivedConnection) {
	return !!c.params.bones;
}

export function massiveHemorrhage(human: HumanBody) {
	return (
		human.state.vitals.cardio.extArterialLossesFlow_mlPerMin > 0 ||
		human.state.vitals.cardio.extVenousLossesFlow_mlPerMin > 50
	);
}

function inferWalkBreathAndMotrocity(human: HumanBody) {
	const motricity: Motricity = {
		leftArm: 'do_not_move',
		leftLeg: 'do_not_move',
		rightArm: 'do_not_move',
		rightLeg: 'do_not_move',
	};

	// assume human can't breathe
	human.state.vitals.spontaneousBreathing = false;

	/** starting from the brain, follow the nervous system connections */
	visit(
		human.state,
		'BRAIN',
		block => {
			if (isNervousSystemFine(block)) {
				switch (block.name) {
					case 'LEFT_HAND':
						motricity.leftArm = 'move';
						break;
					case 'RIGHT_HAND':
						motricity.rightArm = 'move';
						break;
					case 'LEFT_FOOT':
						motricity.leftLeg = 'move';
						break;
					case 'RIGHT_FOOT':
						motricity.rightLeg = 'move';
						break;
					case 'LUNG':
						// Nervous connection to lungs => human can breathe
						human.state.vitals.spontaneousBreathing = true;
						break;
				}
				return 'CONTINUE';
			} else {
				// nervous system is broken, stop visiting this branch
				return 'BREAK';
			}
		},
		{
			shouldWalk: isNervousSystemConnection,
		},
	);

	let canWalk: 'obviously_not' | 'no' | 'maybe' = 'maybe';
	let obeyOrders: boolean = true;

	// first, human may move if legs motricity is fine
	if (motricity.leftLeg === 'move' && motricity.rightLeg === 'move'){
		canWalk = 'maybe'
	} else {
		canWalk = 'no';
	}

	if (human.state.variables.unableToWalk) {
		canWalk = 'obviously_not';
	}

	if (human.state.vitals.glasgow.verbal < 5 || human.state.vitals.glasgow.motor < 6) {
		extraLogger.log('Can not walk: GSV < 5');
		obeyOrders = false;
	}

	if (canWalk !== 'obviously_not') {
		extraLogger.log("Can Walk => check others");
		// nervous system indicates human can move
		// check other constraints
		// human.state.blocks.get("C1-C4");

		const maxHr = 0.9 * human.meta.bounds.vitals.cardio.hr.max;
		if (human.state.vitals.cardio.hr > maxHr) {
			extraLogger.log('Can not walk: Heart rate too high');
			canWalk = 'no';
		}

		if (human.state.vitals.cardio.hr < 10) {
			extraLogger.log('No HR => do not walk');
			canWalk = 'no';
		}

		if (human.state.vitals.glasgow.eye < 4) {
			extraLogger.log('Can not walk! Eyes are closed');
			canWalk = 'no';
		}

		if (massiveHemorrhage(human)) {
			extraLogger.log('Can not walk! Massive Hemorrhage');
			canWalk = 'obviously_not';
		}

		if (human.state.vitals.pain > 9) {
			extraLogger.log('Can not walk! horrible pain');
			canWalk = 'obviously_not';
		}



		// as visiting body cost time, avoid visiting bones if it's unnecessary
		if (canWalk !== 'obviously_not') {
			let leftLeg = false;
			let rightLeg = false;
			/** starting from head, follow the bone connections */
			visit(
				human.state,
				'HEAD',
				block => {
					if (isNotBroken(block)) {
						switch (block.name) {
							case 'LEFT_FOOT':
								leftLeg = true;
								break;
							case 'RIGHT_FOOT':
								rightLeg = true;
								break;
						}
						return 'CONTINUE';
					} else {
						// bone is broken, stop visiting this branch
						return 'BREAK';
					}
				},
				{
					shouldWalk: isBone,
				},
			);
			if (!leftLeg || !rightLeg){
				extraLogger.log("Can not walk! Fracture");
				canWalk = 'obviously_not';
			}
		}
	}

	extraLogger.log("Walk: ", {canWalk, obeyOrders});
	if (canWalk === 'obviously_not'){
		human.state.vitals.canWalk = false;
		human.state.vitals.canWalk_internal = false;
	} else if (obeyOrders){
		human.state.vitals.canWalk_internal = canWalk === 'maybe';
		human.state.vitals.canWalk = human.state.vitals.canWalk_internal;
	} else {
		human.state.vitals.canWalk_internal = canWalk === 'maybe';
		human.state.vitals.canWalk = 'no_response';
	}

	// finally check glasgow
	if (human.state.vitals.glasgow.motor < 6) {
		logger.log('bad glasgow motor => no motricity response');
		motricity.leftArm = 'no_response';
		motricity.rightArm = 'no_response';
		motricity.leftLeg = 'no_response';
		motricity.rightLeg = 'no_response';
	}

	// and other stuff
	if (human.state.vitals.cardio.hr < 10) {
		respLogger.log('No HR => no spontaneous breathing');
		human.state.vitals.spontaneousBreathing = false;
	}

	human.state.vitals.motricity = motricity;
}

export function inferExtraOutputs(human: HumanBody) {
	logger.log('Infer Extra Outputs');
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Compute/infer extra outputs
	/////////////////////////////////////////////////////////////////////////////////////////////////
	human.state.vitals.capillaryRefillTime_s = computeRecap(human.state);
	human.state.vitals.glasgow = computeGlasgow(human);
	human.state.vitals.pain = getPain(human);

	inferWalkBreathAndMotrocity(human);

	if (human.state.vitals.glasgow.verbal < 5) {
		human.state.vitals.visiblePain = undefined;
	} else {
		human.state.vitals.visiblePain = human.state.vitals.pain;
	}

	fixPosition(human);
}
