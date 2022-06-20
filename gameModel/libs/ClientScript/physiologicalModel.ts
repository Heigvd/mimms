/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */
import { interpolate, normalize } from "./helper";
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
	canWalk,
	canBreathe,
	HumanMeta,
} from "./HUMAn";
import { logger, calcLogger, compLogger, respLogger } from "./logger";
// import { computePaO2 } from "./quarticSolver";
import { getCompensationModel, getSystemModel } from "./registries";

//import { cloneDeep } from "lodash";
//const cloneDeep = Helpers.cloneDeep;


export function detectCardiacArrest(bodyState: BodyState) {
	logger.log("Detect cardiac arrest");
	if (
		bodyState.vitals.cardiacArrest! > 0 ||
		bodyState.vitals.cardio.hr < 30 ||
		bodyState.vitals.cardio.MAP < 40 ||
		//bodyState.vitals.respiration.rr < 4 ||
		bodyState.vitals.respiration.SaO2 < 0.4
	) {
		logger.log("Cardiac Arrest");
		bodyState.vitals.cardiacArrest =
			bodyState.vitals.cardiacArrest || bodyState.time;
		bodyState.vitals.cardio.hr = 0;
		bodyState.vitals.cardio.MAP = 0;
		bodyState.vitals.respiration.rr = 0;
		bodyState.vitals.respiration.SaO2 = 0;
		bodyState.vitals.respiration.CaO2 = 0;
		bodyState.vitals.respiration.PaO2 = 0;
		bodyState.vitals.respiration.tidalVolume_L = 0;
		bodyState.vitals.brain.DO2 = 0;
	} else {
		logger.log("Not dead yet");
	}
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
function getUpperAirwaysInput(
	bodyState: BodyState,
	env: Environnment
): UpperAirways {
	let fi02 = 0;
	const resistance: number[] = [0];
	let atmPressure = env.atmosphericPressure_mmHg;
	visit(
		bodyState,
		"LUNG",
		(block) => {
			respLogger.debug("Visit ", block, " for fresh air");
			let currentResistance = resistance[0] || 0;
			const blockResistance = block.params.airResistance || 0;
			if (!block.params.intubated) {
				// intubation bypass resistance
				currentResistance = Math.max(currentResistance, blockResistance);
				respLogger.debug("Resistance: ", resistance);
			}
			resistance.unshift(currentResistance);

			if (block.params.fiO2 != null) {
				// Hit a block which provide fresh air !
				if (block.params.atmosphericPressure != null) {
					atmPressure = block.params.atmosphericPressure;
				}
				logger.log("FIO2: ", block.params.fiO2);

				if (typeof block.params.fiO2 === "number") {
					fi02 = block.params.fiO2;
				} else {
					fi02 = env.FiO2;
				}
				return "RETURN";
			}

			if (!block.params.intubated && blockResistance >= 1) {
				return "BREAK";
			} else {
				return "CONTINUE";
			}
		},
		{
			shouldWalk: (c) => !!c.params.o2,
			leaveBlock: () => resistance.shift(),
		}
	);

	return {
		FIO2: normalize(fi02, { min: 0, max: 1 }),
		resistance: normalize(resistance[0] || 0, { min: 0, max: 1 }),
		atmosphericPressureInmmHg: atmPressure,
	};
}

function getLowerAirways(
	bodyState: BodyState,
	upperResistance: number
): LowerAirways[] {
	const units: LowerAirways[] = [];
	const resistance: number[] = [upperResistance];
	const qPercent: number[] = [1];

	// On utilise un repartiion du débit en %, jamais la vraie valeur

	// débit arteriel pulmonaire == Qa systemique ?

	const thorax_left = findBlock(bodyState, "THORAX_LEFT");
	const thorax_right = findBlock(bodyState, "THORAX_RIGHT");

	//const externalCompliance = thorax != null ? thorax.params.compliance ?? 1 : 1;

	//const externalCompliance = bodyState.variables.thoraxCompliance;

	visit(
		bodyState,
		"LUNG",
		(block) => {
			respLogger.info("Visit ", block, " for units");

			const upperResistance = resistance[0] || 0;

			let selfResistance = upperResistance;

			if (block.params.airResistance) {
				selfResistance = Math.max(upperResistance, block.params.airResistance);
			}
			resistance.unshift(selfResistance);

			if (block.name.startsWith("UNIT_")) {
				respLogger.info("Found Unit: ", qPercent[0]);
				const thorax = block.name.startsWith("UNIT_BRONCHUS_1") ? thorax_left : thorax_right;
				units.push({
					compliance: block.params.compliance ?? 1,
					resistance: selfResistance,
					qPercent: qPercent[0]!,
					block: block,
					thoraxBlock: thorax!,
				});
				return "BREAK";
			}

			return "CONTINUE";
		},
		{
			leaveBlock: (b) => {
				resistance.shift();
				qPercent.shift();
				respLogger.info(`Leave ${b.name}: `, qPercent);
			},
			shouldWalk: (c) => {
				if (c.params.o2) {
					const qP = qPercent[0] ?? 1;
					qPercent.unshift((c.params.blood ?? 0) * qP);
					respLogger.info(`Enter ${c.to}: `, qPercent);
					return c.params.o2;
				} else {
					return false;
				}
			},
		}
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
		return (
			1 / (23400 / (paO2_mmHg * paO2_mmHg * paO2_mmHg + 150 * paO2_mmHg) + 1)
		);
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
	meta: HumanBody["meta"],
	upperAirways: UpperAirways,
	units: LowerAirways[]
) {
	respLogger.log("Airways: ", { upper: upperAirways, lower: units });
	const nbUnits = units.length;

	const idealTotalVolume_L = normalize(
		body.vitals.respiration.tidalVolume_L - meta.deadSpace_L,
		{ min: 0 }
	);

	const perUnitThMaxCapacity_L = meta.inspiratoryCapacity_mL / (nbUnits * 1000);

	const externalCompliance = body.vitals.respiration.thoraxCompliance ?? 1;

	if (positivePressure) {
		// full tidalVolume is injected
		const unitsEffectiveMaximum_L = units.map((unit) => {
			return perUnitThMaxCapacity_L * (1 - unit.resistance);
		});

		const totalEffectiveMaximum_L = unitsEffectiveMaximum_L.reduce(
			(total, cur) => total + cur,
			0
		);
		respLogger.info("Effective Volume #1", unitsEffectiveMaximum_L, {
			totalEffectiveMaximum_L,
		});

		let toDispatch = idealTotalVolume_L;

		const ru: number[] = [];
		let updated = true;
		while (toDispatch > 0 && updated) {
			let idealVolumePerUnit_L = idealTotalVolume_L / nbUnits;
			updated = false;
			for (let i = 0; i < nbUnits; i++) {
				const currentVa = (ru[i] = ru[i] ?? 0);
				const maxVa = unitsEffectiveMaximum_L[i]!;
				const newVa = Math.min(maxVa, currentVa + idealVolumePerUnit_L);
				const delta = newVa - currentVa;

				if (delta > 0) {
					toDispatch -= delta;
					updated = true;
					ru[i] = newVa;
				}
			}
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

		respLogger.info("PositivePressure RU: ", { idealTotalVolume_L, ru, leaks });

		return ru;
	} else {
		const idealVolumePerUnit_L = idealTotalVolume_L / nbUnits;
		const effectiveUnitMax = Math.min(
			idealVolumePerUnit_L,
			perUnitThMaxCapacity_L
		);
		const ru = units.map((unit) => {
			const eCompliance = Math.min(unit.compliance, externalCompliance);
			return effectiveUnitMax * eCompliance * (1 - unit.resistance);
		});
		respLogger.info("Normal RU: ", ru);
		return ru;
	}
}

function getEffortLevel(bodyState: BodyState): number {
	switch (bodyState.variables.bodyPosition) {
		case 'STANDING':
			return 0.1;
		case 'SITTING':
			return 0.05;
		case 'PRONE_DECUBITUS':
		case 'SUPINE_DECUBITUS':
		case 'RECOVERY':
			return 0;
	}
}

function getVO2_mLperMin(bodyState: BodyState, meta: HumanMeta): number {
	const effort = getEffortLevel(bodyState);
	const vo2 = interpolate(effort, [{ x: 0, y: meta.VO2min_mLperKgMin }, { x: 1, y: meta.VO2max_mLperKgMin }]);
	logger.info("VO2: ", { vo2, effort });
	return vo2 * meta.effectiveWeight_kg;
}

export function compute(
	body: BodyState,
	meta: HumanBody["meta"],
	env: Environnment,
	duration_min: number,
): BodyState["vitals"] {
	//const newVitals = cloneDeep(body.vitals);
	//const newVitals = body.vitals;
	calcLogger.info("Compute Vitals based on ", body);

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

	const esv = body.vitals.cardio.endSystolicVolume_mL;
	// x: %volemie
	const edvMax_model: Point[] = [
		{ x: 0, y: esv },
		{ x: 0.4, y: esv + 10 },
		{ x: 0.9, y: 120 },
	];


	const rBlood = bloodVolume_mL / meta.initialBloodVolume_mL;

	const edvMax_volume = interpolate(rBlood, edvMax_model);

	const tamponade_model: Point[] = [
		{ x: 0, y: 120 },
		{ x: 100, y: 110 },
		{ x: 1500, y: esv },
	];

	// tamponade := pericardial_pressure [0;1]
	// https://www.sfmu.org/upload/70_formation/02_eformation/02_congres/Urgences/urgences2014/donnees/pdf/059.pdf
	const edvMax_tamponade = interpolate(body.variables.pericardial_ml, tamponade_model);

	// TODO: tension pno:= pleural_pressure [0;1]
	const itp_l_raw = body.blocks.get("THORAX_LEFT")!.params.internalPressure;

	const itp_r_raw = body.blocks.get("THORAX_RIGHT")!.params.internalPressure;


	const itp_L = typeof itp_l_raw === 'number' ? itp_l_raw : 0;
	const itp_R = typeof itp_r_raw === 'number' ? itp_r_raw : 0;

	const itp = (itp_L + itp_R) / 2

	const tensionPneumothoraxModel: Point[] = [
		{ x: 0, y: 120 },
		{ x: 50, y: esv },
	];
	const edvMax_pno = interpolate(itp, tensionPneumothoraxModel);

	const edvEffective = Math.min(
		body.vitals.cardio.endDiastolicVolume_mL,
		edvMax_volume,
		edvMax_tamponade,
		edvMax_pno
	);
	let strokeVolume_mL = edvEffective - body.vitals.cardio.endSystolicVolume_mL;

	if (strokeVolume_mL < 0) {
		strokeVolume_mL = 0;
	}

	// Cardiac output (Qc) [L/min]
	const Qc_LPerMin = (strokeVolume_mL * body.vitals.cardio.hr) / 1000;

	// TODO: edge case stressedCapacitance < 0
	//	const PVSM_mmHg =
	//		stressedCapacitance_L / body.vitals.cardio.venousCompliance_LPerMmHg;

	// TODO: Pression intra-thoracique (tension pneumothorax)
	//	const Qrv_LPerMin = normalize(
	//		(PVSM_mmHg - body.vitals.cardio.PVC_mmHg) /
	//		body.vitals.cardio.Rrv_mmHgMinPerL, { min: 0 });

	//q_delta_mLPermin;

	// const Qrv_LPerMin = Qc_LPerMin - body.vitals.cardio.q_delta_mLPermin / 1000;

	// const Qcm = (Qrv_LPerMin + Qc_LPerMin) / 2.0;

	// Mean arterial pressure
	//const MAP = Qcm * (body.vitals.cardio.Ra_mmHgMinPerL);
	const MAP = Qc_LPerMin * body.vitals.cardio.Ra_mmHgMinPerL;

	calcLogger.log("Cardio: ", {
		MAP,
		//Qcm,
		Qc_LPerMin,
		//Qrv_LPerMin,
		delta: body.vitals.cardio.q_delta_mLPermin,
	});

	body.vitals.cardio.MAP = MAP;


	body.vitals.cardio.endDiastolicVolume_mL = edvEffective;
	const systolicPressure = 3 * MAP / 2;
	body.vitals.cardio.radialPulse = systolicPressure > 80;
	//const diastolicPressure = x;

	body.vitals.cardio.cardiacOutput_LPerMin = Qc_LPerMin;
	//body.vitals.cardio.cardiacOutputRv_LPerMin = Qrv_LPerMin;

	calcLogger.info("Cardio: ", {
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
	const vco2_mLPerMin = vo2_mLperMin * body.vitals.respiration.QR;



	const upperAirways = getUpperAirwaysInput(body, env);
	const units = getLowerAirways(body, upperAirways.resistance);

	const positivePressure = !!body.variables.positivePressure;

	if (!body.vitals.spontaneousBreathing) {
		respLogger.info("no spontaneous breathing");
		body.vitals.respiration.tidalVolume_L = 0;
		body.vitals.respiration.rr = 0;
	}
	if (positivePressure) {
		// TODO fetch from inputs
		body.vitals.respiration.tidalVolume_L = 0.5;
		body.vitals.respiration.rr = 15;
	}

	respLogger.log("Positive Pressure", {
		positivePressure,
		tidal: body.vitals.respiration.tidalVolume_L,
		rr: body.vitals.respiration.rr
	});


	const effectiveVolumesPerUnit_L = computeEffectiveVolumesPerUnit(
		positivePressure,
		body,
		meta,
		upperAirways,
		units
	);

	//respLogger.info("Effective Volume dispatch", effectiveVolumesPerUnit_L);

	/** Hemoglobin concentration, gram per litre */
	const hb_gPerL =
		bloodVolume_L > 0
			? getGramOfHemoglobin(body.vitals.cardio.totalVolumeOfErythrocytes_mL) /
			bloodVolume_L
			: 0;

	respLogger.log("Respiration Step1: ", {
		vo2_mLkgperMin: vo2_mLperMin,
		weight: meta.effectiveWeight_kg,
		vo2_mLperMin,
		vco2_mLPerMin,
		effectiveVolumesPerUnit_L,
		hb_gPerL,
	});
	respLogger.info("RespiratoryUnits: ", units);

	/**
	 * Constant value for vapour pressure of water
	 */
	const pH2O_mmHg = 47; /// =~ f(37C°)

	// Compute SaO2 and CaO2 for each respiratory unit
	const unitOutputs = units.map((unit, i) => {
		const Va_LperMin =
			effectiveVolumesPerUnit_L[i]! * body.vitals.respiration.rr;
		const vco2InUnit_mlPerMin = vco2_mLPerMin * unit.qPercent;

		if (unit.qPercent <= 0) {
			respLogger.log("NO PERFUSION");
			return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };
		}

		if (unit.compliance <= 0.01) {
			respLogger.log("Empty unit (compliance=0)");
			return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };
		}


		let PACO2 = unit.block.params.PACO2 ?? 0;

		if (Va_LperMin <= 0) {
			// No ventilation!
			const inLungs_mL = meta.inspiratoryCapacity_mL * 0.66;
			const CO2delta_mL = vco2InUnit_mlPerMin * duration_min;
			const co2Percent = CO2delta_mL / inLungs_mL;
			const PACO2_delta = PACO2 * co2Percent;
			PACO2 += PACO2_delta;

			//return { SaO2: 0, CaO2: 0, PaO2_mmHg: 0, qPercent: unit.qPercent };

			respLogger.log("NO AIR: PACO2=", PACO2, " + ", PACO2_delta, {
				vco2_mLPerMin,
				vco2InUnit_mlPerMin,
				inLungs_mL,
				CO2delta_mL,
				co2Percent,
			});
		} else {
			// Ventilation: formula is fine
			const Va_mlPerMin = Va_LperMin * 1000;
			respLogger.log("VCO2 / VA = ", vco2InUnit_mlPerMin, Va_mlPerMin, unit.qPercent);

			const ratio_vco2Va = vco2InUnit_mlPerMin / Va_mlPerMin;
			// Compute partial alveolar CO2 saturation [mmHG]
			PACO2 = 1000 * K * ratio_vco2Va;
		}
		respLogger.log("PACO2 => ", PACO2);
		unit.block.params.PACO2 = PACO2;

		/**
		 * vapour pressure of water in mmHg
		 * f(body temperature)
		 * Based on the "Antoine Equation"
		 */
		//const pH2o_mmHg = (temp_celsius: number) => Math.pow(10, 8.07131 - (1730.63 / (233.426 + temp_celsius)));

		// Compute partial alveolar oxygen saturation [mmHG]
		const PAO2_raw = (upperAirways.atmosphericPressureInmmHg - pH2O_mmHg) * upperAirways.FIO2 -
			PACO2 / body.vitals.respiration.QR;

		respLogger.log(` PAO2=`, PAO2_raw, {
			pAtm: upperAirways.atmosphericPressureInmmHg,
			pH2O_mmHg,
			Fio2: upperAirways.FIO2,
			PACO2,
			qr: body.vitals.respiration.QR,

		});

		const PAO2 = normalize(PAO2_raw,
			{ min: 0 }
		);

		// Compute Alveolar–arterial gradient [mmHg]
		const AaDO2 = 0.3 * meta.age + (upperAirways.FIO2 - 0.21) * 10 * 6;

		const PaO2_mmHg = normalize(PAO2 - AaDO2, { min: 0 });
		//const PaO2_kPa = convertTorrToKPa(PaO2_mmHg); // useless

		const SaO2 = computeSaO2(PaO2_mmHg);

		const CaO2 = 1.34 * SaO2 * hb_gPerL + PaO2_mmHg * 0.03;

		respLogger.log(` * Unit #${i}`, {
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

	respLogger.info("Respiration Step2: ", unitOutputs);
	// consolidate SaO2 and CaO2;
	// -> blood in the pulmonary vein
	let { SaO2, CaO2 } = unitOutputs.reduce(
		(output, unit) => {
			output.SaO2 += unit.SaO2 * unit.qPercent;
			output.CaO2 += unit.CaO2 * unit.qPercent;
			respLogger.debug(
				`Unit : ${unit.qPercent}\t ${unit.SaO2}\t${unit.CaO2}\t${unit.PaO2_mmHg}`
			);
			return output;
		},
		{ SaO2: 0, CaO2: 0 }
	);

	//const CaO2 = 1.34 * SaO2 * hb_gPerL + PaO2_mmHg * 0.03;
	const computedPaO2 = computePaO2_mmHg(SaO2);
	//const computedPaO2_v2 = computePaO2(hb_gPerL, CaO2);

	let PaO2_mmHg = computedPaO2;

	//const recomputedSaO2 = computeSaO2(computedPaO2_v2);

	//respLogger.debug(`Glob : 1\t${SaO2}\t${recomputedSaO2}\t${CaO2}\t${computedPaO2}\t${computedPaO2_v2}`);
	respLogger.log("log : ", { SaO2, CaO2, PaO2_mmHg });

	if (isLungsVasoconstrictionEnabled()) {
		// update qFactors
		// units which output low saturation are discarded by vasoconstriction
		const nbConnection = Math.pow(2, meta.lungDepth + 1) - 1;

		// new computed qFactor (tree stored as array)
		const qTree: number[] = [];
		// current SaO2 tree, to compute new qFactors
		const sao2Tree: number[] = [];

		let i = nbConnection - 1;
		unitOutputs.reverse().forEach((unitResult) => {
			sao2Tree[i] = Math.pow(unitResult.PaO2_mmHg, 4);
			i--;
		});
		respLogger.log("Update QFactors: ", { sao2Tree, nbConnection, i });

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
			respLogger.log("Process Tree: ", {
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
		respLogger.log("Updated QFactors: ", { qTree, sao2Tree });

		const blockNames: string[] = [];
		for (i = 0; i < nbConnection; i++) {
			const parent = i % 2 === 0 ? i / 2 - 1 : (i - 1) / 2;
			if (i === 0) {
				blockNames.push("LUNG");
			} else {
				if (i <= 2) {
					blockNames.push("BRONCHUS_" + i);
				} else {
					const childNumber = i % 2 === 0 ? "2" : "1";
					blockNames.push(blockNames[parent] + childNumber);
				}
				const parentBlock = findBlock(body, blockNames[parent]!);
				if (parentBlock) {
					const connection = parentBlock.connections.find(
						(c) => c.to === blockNames[i]
					);
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

	if (false) {
		// review
		// delay SaO2 and CaO2 according to cardiac output
		// delay is the time the heart needs to pump 40% of the blood
		//const delay = (bloodVolume_L * 2) / Qc_LPerMin;
		const delay = 3;

		const computeDelayed = (current: number, next: number): number => {
			const delta = next - current;
			return duration_min < delay
				? current + (delta * duration_min) / delay
				: next;
		};
		const delayedSaO2 = computeDelayed(body.vitals.respiration.SaO2, SaO2);
		const delayedCaO2 = computeDelayed(body.vitals.respiration.CaO2, CaO2);
		const delayedPaO2 = computeDelayed(body.vitals.respiration.PaO2, PaO2_mmHg);

		/*const deltaSaO2 = SaO2 - body.vitals.respiration.SaO2;
			const delayedSaO2 =
				duration_min < delay
					? body.vitals.respiration.SaO2 + (deltaSaO2 * duration_min) / delay
					: SaO2;

			const deltaCaO2 = CaO2 - body.vitals.respiration.CaO2;
			const delayedCaO2 =
				duration_min < delay
					? body.vitals.respiration.CaO2 + (deltaCaO2 * duration_min) / delay
					: CaO2;
			*/

		respLogger.log("Delayed SaO2,CaO2:", {
			delay,
			duration_min,
			SaO2,
			delayedSaO2,
			CaO2,
			delayedCaO2,
			PaO2_mmHg,
			delayedPaO2,
		});

		SaO2 = delayedSaO2;
		CaO2 = delayedCaO2;
		PaO2_mmHg = delayedPaO2;
	}

	body.vitals.respiration.stridor = upperAirways.resistance > 0.25;

	body.vitals.respiration.SaO2 = SaO2;
	body.vitals.respiration.CaO2 = CaO2;

	const do2Sys = Qc_LPerMin * CaO2;
	body.vitals.cardio.DO2Sys = do2Sys;

	//const PaO2_mmHg_fromSaO2 = computePaO2_mmHg(SaO2);
	body.vitals.respiration.PaO2 = PaO2_mmHg;
	respLogger.log("Final SaO2,CaO2, PaO2:", { SaO2, CaO2, PaO2_mmHg });

	logger.info("VO2 VS DO2", vo2_mLperMin, do2Sys);
	if (do2Sys < vo2_mLperMin * 0.8) {
		logger.log("CHOC");
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Brain
	/////////////////////////////////////////////////////////////////////////////////////////////////
	/* Pression Perfusion Cerebrale */
	//const Pp = MAP - body.vitals.brain.ICP_mmHg;
	//const qbrTh = Pp / body.vitals.brain.Rbr;
	//const Qbr = Pp > 50 ? theoreticalQbr : qbrTh;

	const Qbr = body.vitals.cardio.cerebralBloodOutput_mLperMin / 1000;

	// CaO2
	const DO2 = Qbr * CaO2;

	logger.log("Brain: ", {
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
interface Point {
	x: number;
	y: number;
}

const TRC_MODEL: Point[] = [
	{ x: 0, y: 10 }, // MAP=0 => TRC=>10
	{ x: 60, y: 2 },
	{ x: 200, y: 0 },
];

const computeRecap = (MAP: number): number => {
	return interpolate(MAP, TRC_MODEL);
};

const GCS_MODEL: Point[] = [
	{ x: 80, y: 3 }, // DO2=80 => GCS = 3
	{ x: 110, y: 15 },
];

const getGCSTotal = (DO2: number): Glasgow["total"] => {
	if (Number.isNaN(DO2)) {
		return 3;
	}
	return Math.round(interpolate(DO2, GCS_MODEL)) as Glasgow["total"];
};

const computeGlasgow = (DO2: number): Glasgow => {
	// total = f(ICP);
	const total = getGCSTotal(DO2);
	let gcs: Glasgow;
	logger.log("Total: ", total, " based on ", DO2);

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
		logger.error("GCS: total do not match", gcs);
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
	min: number;
	max: number;
	points: Point[];
}

export type Compensation = Partial<Record<BodyStateKeys, CompensationRule>>;

//'respiration.rr'?: CompensationRule;
//'respiration.tidalVolume_L?': CompensationRule;
//'cardio.hr?': CompensationRule;

let average = false;


export function computeOrthoLevel(
	state: BodyState,
	meta: HumanBody["meta"],
	duration_min: number) {
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
			compLogger.log("SympLevel: ", key, currentValue, y);
			return total + y;
		}, 0),
		{ min: 0, max: 100 }
	);

	if (average) {
		sympatheticDelta /= sympEntries.length;
	}

	compLogger.log("Delta: ", sympatheticDelta);
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
	compLogger.log("SympLevel: ", level);
	state.variables.paraOrthoLevel = level;
}

/**
 * Update some vitals according to current orthosympathetic kevel
 */
export function doCompensate(
	state: BodyState,
	meta: HumanBody["meta"],
	duration_min: number) {

	if (state.vitals.cardiacArrest! > 0) {
		return;
	}

	const level = state.variables.paraOrthoLevel;

	/*
	 * (para)symptathic system
	 * then infer extra output (glasgow, etc)
	 */
	const compensation = getCompensationModel();
	compLogger.info("CompensationProfile: ", compensation);
	Object.entries(compensation).forEach(([k, value]) => {
		const key = k as BodyStateKeys;
		const currentValue = getVitals(state, key);

		if ((key === 'vitals.respiration.rr' || key === 'vitals.respiration.tidalVolume_L') &&
			!state.vitals.spontaneousBreathing
		) {
			compLogger.info("No spontaneous breathing: skip", key);
			return;
		}

		compLogger.info(
			"Compensate: ",
			key,
			"=",
			currentValue,
			value.points,
			"(",
			duration_min,
			"[s])"
		);
		if (currentValue != null) {
			let newValue = interpolate(level, value.points);

			const bounds = readKey<Bound>(meta.bounds, key);
			if (bounds != null) {
				compLogger.info("Within Bounds: ", { percent: newValue, bounds });
				newValue = bounds.min + newValue * (bounds.max - bounds.min);
			}

			compLogger.info(
				"CompensateNewvalue: ",
				key,
				"=>",
				currentValue,
				" => ",
				newValue,
				" within bounds ",
				bounds
			);

			if (currentValue !== newValue) {
				//const normalized =
				// normalize(newValue, {
				//	min: value.min,
				//	max: value.max,
				//});
				compLogger.log("Sympatic system: ", key, currentValue, " => ", newValue);
				setVital(state, key, newValue);
			}
		} else {
			logger.warn("Key does not exists:", key);
		}
	});

	compLogger.info("After (para)Sympatic: ", state.vitals);
}


export function compensate(
	state: BodyState,
	meta: HumanBody["meta"],
	duration_min: number) {
	computeOrthoLevel(state, meta, duration_min);
	doCompensate(state, meta, duration_min);
}

export function inferExtraOutputs(human: HumanBody) {
	logger.log("Infer Extra Outputs");
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Compute/infer extra outputs
	/////////////////////////////////////////////////////////////////////////////////////////////////
	human.state.vitals.capillaryRefillTime_s = computeRecap(human.state.vitals.cardio.MAP);
	human.state.vitals.glasgow = computeGlasgow(human.state.vitals.brain.DO2);
	human.state.vitals.canWalk = canWalk(human);
	human.state.vitals.spontaneousBreathing = canBreathe(human.state);
	human.state.vitals.pain = getPain(human);

	if (!human.state.vitals.canWalk) {
		if (human.state.variables.bodyPosition === 'STANDING') {
			human.state.variables.bodyPosition = 'SITTING';
		}
	}

	if (human.state.vitals.glasgow.eye < 4 || human.state.vitals.glasgow.motor < 6) {
		if (human.state.variables.bodyPosition === 'STANDING' || human.state.variables.bodyPosition === 'SITTING') {
			human.state.variables.bodyPosition = 'SUPINE_DECUBITUS';
		}
	}
}