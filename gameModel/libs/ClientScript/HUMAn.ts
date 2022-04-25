/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */
import { add, checkUnreachable, interpolate, normalize, Point } from "./helper";
import { logger, patchLogger, bloodLogger, vitalsLogger, compLogger, visitorLogger } from "./logger";
import {
	ActionBodyEffect,
	AfflictedPathology,
	ItemDefinition,
	PathologyDefinition,
	Rule,
} from "./pathology";
import {
	compensate,
	compute,
	detectCardiacArrest,
	doCompensate,
	inferExtraOutputs,
} from "./physiologicalModel";
import { getChemical, getPathology } from "./registries";

export type BodyPosition =
	| "RECOVERY"
	| "PRONE_DECUBITUS"
	| "SUPINE_DECUBITUS"
	| "SITTING"
	| "STANDING";

//import { uniq } from "lodash";

// const cloneDeep = Helpers.cloneDeep;

const uniq = Helpers.uniq;

const LN_2 = 0.693;

let coagulationEnabled: boolean = true;

let vasoconstrictionEnabled: boolean = true;

let lungsVasoconstrictionEnabled: boolean = true;

export function enableLungsVasoconstriction(enabled: boolean) {
	lungsVasoconstrictionEnabled = enabled;
}

export function isLungsVasoconstrictionEnabled(): boolean {
	return lungsVasoconstrictionEnabled;
}

export function enableVasoconstriction(enabled: boolean) {
	vasoconstrictionEnabled = enabled;
}

export function enableCoagulation(enabled: boolean) {
	coagulationEnabled = enabled;
}

export interface BodyAction {
	id: string;
}

export interface Environnment {
	/** atmospheric pressusre in mmHg */
	atmosphericPressure_mmHg: number;
	/** o2 % available */
	FiO2: number;
}

export type Sex = "male" | "female";

export interface BodyFactoryParam {
	/** Age, in years */
	age: number;
	/** assigned sex */
	sex: Sex;
	/** bmi in kg / m² */
	bmi: number;
	/** Height in cm */
	height_cm: number;
	/** Effective number of respiratory units is 2^depth */
	lungDepth: number;
}

export interface Bound {
	min: number;
	max: number;
}

export type HumanMeta = BodyFactoryParam & {
	/** Effective Mass in kg */
	effectiveWeight_kg: number;
	/** Ideal Mass in kg */
	idealWeight_kg: number;
	/** Total inspiratory capacity in mL */
	inspiratoryCapacity_mL: number;
	/** L/kg/min */
	VO2_LperKgMin: number; // TODO META mettre -> vo2max + steady ; mais on la fait varier comment ?
	/** Anatomic dead space in L */
	deadSpace_L: number;
	/**
	 * Red cell percentage [0-1]
	 */
	hematocrit: number; // Valeur d'équilibre
	initialBloodVolume_mL: number;
	/**
	 * Theoretical Cerebral Cardiac Output
	 */
	cerebralCardiacOutput_LPerMin: number;
	/**
	 * qbr autoregulation from
	 */
	qbrAutoregulationStart_pp: number;
	/**
	 * qbr autoregulation to
	 */
	qbrAutoregulationStop_pp: number;
	bounds: {
		vitals: {
			respiration: {
				tidalVolume_L: Bound;
			};
			cardio: {
				hr: Bound;
				endSystolicVolume_mL: Bound;
			}
		}
	}
};

export interface HumanBody {
	meta: HumanMeta;
	state: BodyState;
	//pathologies: AfflictedPathology[];
	//effects: BodyEffect[];
	//availableActions: BodyAction[];
}

export interface BodyEffect {
	id: string;
	time: number;
	rules: Rule[];
	afflictedBlocks: string[];
	item: ItemDefinition,
	action: ActionBodyEffect;
}

export interface Glasgow {
	total: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
	/**
	 * 1: Do not open eyes
	 * 2: Open eyes in response to pain
	 * 3: Open eyes in response to voice
	 * 4: Open eyes spontaneously
	 */
	eye: 1 | 2 | 3 | 4;
	/**
	 * 1: Makes no sounds
	 * 2: Makes sounds
	 * 3: Words
	 * 4: Confused, disoriented
	 * 5: Oriented, converses normally
	 */
	verbal: 1 | 2 | 3 | 4 | 5;
	/**
	 * 1: Makes no movements
	 * 2: Extension to painful stimuli
	 * 3: Abnormal flexion to painful stimuli
	 * 4: Flexion / Withdrawal to painful stimuli
	 * 5: Localizes to painful stimuli
	 * 6: Obeys commands
	 */
	motor: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Human being at a given point in time
 */
export interface BodyState {
	time: number;
	blocks: Map<string, Block>;
	connections: ConnectionParam[];
	/**
	 * computed vitals
	 */
	vitals: {
		/**
		 * Time cariac arrest occured; undefined means alive
		 */
		cardiacArrest: number | undefined;
		/** Glasgow coma scale */
		glasgow: Glasgow;
		/** Capillary refill time (crt) in sec */
		capillaryRefillTime_s: number;
		pain: number;
		canWalk: boolean;
		respiration: {
			/** Quotient R */
			QR: number;
			/** Tidal volume in L*/
			tidalVolume_L: number;
			/** Arterial oxygen saturation (=~ SaO2) [%] */
			SaO2: number;
			/** TODO */
			CaO2: number;
			PaO2: number;
			/** Respiratory rate  */
			rr: number;
		};
		cardio: {
			// Total Blood volume [mL] is made of:
			totalVolumeOfPlasmaProteins_mL: number;
			totalVolumeOfWater_mL: number;
			totalVolumeOfWhiteBloodCells_mL: number;
			totalVolumeOfErythrocytes_mL: number; // ml/3 => g of hemoglobin

			totalExtLosses_ml: number;

			// keep track of current blodd volume
			totalVolume_mL: number;

			/**
			 * Chemicals concentrations
			 * key: in-registry id
			 * value: µG
			 */
			chemicals: {
				[id: string]: number;
			};

			/** end diastolic volume [mL] (Vtd)*/
			endDiastolicVolume_mL: number; // input dans excel, valeur initiale basée sur XX/XY ? ça varie en f(...) ?
			// on peut baser sur la taille et utiliser des constante
			/** end systolic volume [mL] (Vts)*/
			endSystolicVolume_mL: number; // idem // idem

			/** Arterial Resistance */
			Ra_mmHgMinPerL: number; //idem
			/**  Resistance Retour Veineux */
			// UNUSED Rrv_mmHgMinPerL: number; // IDEM

			/** Volume capacitance veineuse */
			// totalCapacitance_L: number; // f(volume total)

			/** Venous Compliance */
			// venousCompliance_LPerMmHg: number; // varie selon quoi ? // très constant

			/** Pression oreillette droite */
			// UNUSED PVC_mmHg: number; // idem  constant à 4mmHg, evt impacté par maladie cardiovasculaire

			/** Mean arterial pressure */
			MAP: number;

			/** cardiac output [L/min]*/
			cardiacOutput_LPerMin: number;

			/** cardiac output rv [L/min]*/
			// cardiacOutputRv_LPerMin: number;

			/** input or losses ml/min */
			q_delta_mLPermin: number;

			/** aka Qbr  */
			cerebralBloodOutput_mLperMin: number;

			/** Heart rate */
			hr: number;

			/** systemic So2 */
			DO2Sys: number;
		};
		brain: {
			/** Res cerebral */
			Rbr: number; // resistance cerebrale; evt pathologie
			/** */
			GSC: number; // ?
			/** Debit O2 */
			DO2: number;
		};
	};
	/**
	 * Internal variables pathologies and items may affect
	 */
	variables: {
		/** intercranial pressure */
		ICP_mmHg: number; //embarrure, hemoragie cerebrale
		ICP_deltaPerMin?: number;
		/**
		 * Affect inOut value
		 */
		bleedFactor: number; // a remplacer par concentration d'acide tx
		//thoraxCompliance: number;
		//thoraxComplianceDelta: number;
		paraOrthoLevel: number;
		bodyPosition: BodyPosition;
	};
}

type TopVitalsKeys = keyof BodyState['vitals'];
type SubVitalsKeys<T extends TopVitalsKeys> = keyof BodyState['vitals'][T];

type Primitive = number | string | boolean | undefined | null;

type MappedVitalsKeys = {
	[V in TopVitalsKeys]: BodyState['vitals'][V] extends Primitive ? `vitals.${V}`
	: SubVitalsKeys<V> extends Primitive ?
	`vitals.${V}.${SubVitalsKeys<V>}` : never;
};

type VitalsKeys = MappedVitalsKeys[TopVitalsKeys];
type VariableKeys = `variables.${keyof BodyState['variables']}`

export type BodyStateKeys = VitalsKeys | VariableKeys;


export interface Block {
	/**
	 * unique name within a body
	 */
	name: string;
	params: {
		/**
		 * Does the blood flow ?
		 */
		bloodFlow?: boolean;
		/**
		 * blood flow in the block
		 */
		bloodFlow_mLper?: number;
		/**
		 * absolute one shot loss
		 */
		instantaneousBloodLoss?: number;
		/**
		 * bleed factor [0-1], according to block arterial blood flow
		 * 0: no blood losses
		 * 1: all blood go away
		 */
		arterialBleedingFactor?: number;
		/**
		 * Mitigate arterial bleeding.
		 * 0: no redution
		 * 1: 100% reduction
		 */
		arterialBleedingReductionFactor?: number;
		/**
		 * bleed factor [0-1], according to block venous return flow
		 * 0: no blood losses
		 * 1: all blood go away
		 */
		venousBleedingFactor?: number;
		/**
		 * Mitigate venous bleeding.
		 * 0: no redution
		 * 1: 100% reduction
		 */
		venousBleedingReductionFactor?: number;
		/**
		 * bleed factor [0-1], according to block arterial return flow
		 * 0: no blood losses
		 * 1: all blood go away
		 */
		internalBleedingFactor?: number;
		/**
		 * Mitigate internal bleeding.
		 * 0: no redution
		 * 1: 100% reduction
		 */
		internalBleedingReductionFactor?: number;
		/**
		 * Total external losses
		 */
		totalExtLosses_ml?: number;
		/**
		 * Current external losses flow 
		 */
		extLossesFlow_mlPerMin?: number;
		/**
		 * Saline solution input [ml/min]
		 */
		salineSolutionInput_mLperMin?: number;
		/**
		 * Saline solution input one shot [mL}]
		 */
		salineSolutionInput_oneShot?: number;
		/**
		 * Blood input [ml/min]
		 */
		bloodInput_mLperMin?: number;
		/**
		 * Blood input one shot
		 */
		bloodInput_oneShot?: number;
		/**
		 *
		 */
		bloodResistance?: number;
		/**
		 * Chemicals input
		 */
		chemicals?: {
			[id: string]: {
				/**
				 * One shot
				 */
				once?: number;
				/**
				 * Poche
				 */
				perMin?: number;
			};
		};

		/**
		 * o2 % available
		 * number case : [0-1] (injected air)
		 * "freshAir": fetch from env
		 * undefined: no air
		 */
		fiO2?: number | "freshAir";
		/** Injected air pressure in mmHg */
		atmosphericPressure?: number;
		/**
		 * override airResistance
		 */
		intubated?: boolean;
		/** current air resistance: 0 to 100 [%] */
		airResistance?: number;
		/** air resistance delta [0-100] / min */
		airResistanceDelta?: number;

		/** 0-1 */
		compliance?: number;
		/**
		 * compliance drop ratio % / min;
		 */
		complianceDelta?: number;
		/**
		 * Nervous system broken ?
		 */
		nervousSystemBroken?: boolean;
		/**
		 * Broken bone
		 */
		broken?: boolean;

		/**
		 * pain level
		 */
		pain?: number;
	};
	connections: Connection[];
}

type BlockParamsKeys = keyof Block["params"];

type NumericBlockParams = {
	[P in BlockParamsKeys]: Block["params"][P] extends number | undefined
	? P
	: never;
}[BlockParamsKeys];

interface ConnectionParam {
	/**
	 * can o2 flow through?
	 */
	o2?: boolean;
	/**
	 * Does the blood flow
	 */
	blood?: number; // vasocontrition -> repartition du flux
	/**
	 * Nervous system
	 */
	nervousSystem?: boolean;
	/**
	 * Skeleton
	 */
	bones?: boolean;
}

interface Connection {
	/**
	 * Connection parameters index
	 */
	paramsId: number;
	/**
	 * to block name
	 */
	to: string;
}


interface RevivedConnection {
	/**
	 * Connection parameters
	 */
	params: ConnectionParam;
	/**
	 * to block name
	 */
	to: string;
}



export type BlockName =
	| "HEAD"
	| "BRAIN"
	| "NECK"
	| "THORAX"
	| "LUNG"
	| "HEART"
	| "LEFT_SHOULDER"
	| "LEFT_ARM"
	| "LEFT_ELBOW"
	| "LEFT_FOREARM"
	| "LEFT_WRIST"
	| "LEFT_HAND"
	| "RIGHT_SHOULDER"
	| "RIGHT_ARM"
	| "RIGHT_ELBOW"
	| "RIGHT_FOREARM"
	| "RIGHT_WRIST"
	| "RIGHT_HAND"
	| "ABDOMEN"
	| "PELVIS"
	| "LEFT_THIGH"
	| "LEFT_KNEE"
	| "LEFT_LEG"
	| "LEFT_ANKLE"
	| "LEFT_FOOT"
	| "RIGHT_THIGH"
	| "RIGHT_KNEE"
	| "RIGHT_LEG"
	| "RIGHT_ANKLE"
	| "RIGHT_FOOT"
	| "BRONCHUS_1"
	| "UNIT_BRONCHUS_1"
	| "BRONCHUS_2"
	| "UNIT_BRONCHUS_2";

function createBlock(
	bodyState: BodyState,
	blockName: string,
	params: Partial<Block["params"]> = {}
) {
	bodyState.blocks.set(blockName, {
		name: blockName,
		connections: [],
		params: {
			bloodFlow: true,
			bloodResistance: 0,
			...params,
		},
	});
}

export function findBlock(
	bodyState: BodyState,
	blockName: string
): Block | undefined {
	return bodyState.blocks.get(blockName);
	//return bodyState.blocks.find((b) => b.name === blockName);
}

function connect(
	bodyState: BodyState,
	from: string,
	to: string,
	params: Partial<ConnectionParam>
) {
	const fromBlock = findBlock(bodyState, from);
	const toBlock = findBlock(bodyState, to);

	const cId = bodyState.connections.length;
	const c = { ...params };
	bodyState.connections.push(c);
	if (fromBlock != null && toBlock != null) {
		fromBlock.connections.push({ to, paramsId: cId });
		toBlock.connections.push({ to: from, paramsId: cId });
	}
}

function inpiratoryCapacityBasedOnAgeAndSex(age: number, sex: Sex): number {
	// TODO add height param then Randomize

	// please review !

	let p = 1;
	if (age < 20) {
		p = 0.2 + (age * 0.8) / 20;
	} else if (age > 40) {
		p = 1 - age * 0.004;
	}

	return sex === "male" ? p * 3700 : p * 2400;
}

const getBloodPart = (weight_kg: number, sex: Sex) => {
	const total = 70 * weight_kg; // 70 mL /kg

	const hematocrit = sex === "male" ? 0.47 : 0.42;

	const plasmaPercent = 1 - hematocrit - 0.01;

	const plasma = total * plasmaPercent;
	bloodLogger.info("Blood %: ", hematocrit, plasmaPercent);

	const blood = {
		total: total,
		proteins: plasma * 0.1,
		water: plasma * 0.9,
		leuco: 0.01 * total,
		red: hematocrit * total,
		hematocrit: hematocrit,
	};
	bloodLogger.info(
		"Initial BloodVolume: ",
		total,
		blood,
		blood.proteins + blood.water + blood.leuco + blood.red
	);

	return blood;
};

function createRespiratoryUnits(
	currentLevel: string,
	depth: number,
	state: BodyState,
	parentBlock: string
) {
	if (depth > 0) {
		let i: number;

		for (i = 1; i <= 2; i++) {
			const name = `BRONCHUS_${currentLevel}${i}`;
			createBlock(state, name, { airResistance: 0, compliance: 1 });
			connect(state, parentBlock, name, { blood: 0.5, o2: true });

			createRespiratoryUnits(currentLevel + i, depth - 1, state, name);
		}
	} else {
		const name = `UNIT_${parentBlock}`;
		createBlock(state, name, { airResistance: 0, compliance: 1 });
		connect(state, parentBlock, name, { blood: 1, o2: true });
	}
}


/**
 * The Levin Formula.
 * Compute ideal weight based on height (cm) and sex.
 */
function computeIdealWeight(sex: Sex, height_cm: number): number {
	return sex === "female" ? 45.5 : 50 + 0.9 * (height_cm - 152.4);
}

/**
 * Compute effective weight based on BMI and height_cm
 */
function computeEffectiveWeight(bmi: number, height_cm: number) {
	// bmi = weight_kg / height_m²
	// weight = bmi / height_m^2
	const height_m = height_cm / 100;
	return bmi * (height_m * height_m);
}

// age ->
const brainWeightModel = [
	{ x: 0, y: 500 },
	{ x: 1, y: 1 },
	{ x: 5, y: 1300 },
	{ x: 10, y: 1400 },
];
const ageToQbr = (age: number) => interpolate(age, brainWeightModel) * 0.0005;

const orthoModel: Point[] = [{ x: 0, y: 23 }, { x: 100, y: 40 }];
const orthoLevelFromAge = (age: number) => interpolate(age, orthoModel);

export function createHumanBody(
	param: BodyFactoryParam,
	env: Environnment
): HumanBody {
	const idealWeight_kg = computeIdealWeight(param.sex, param.height_cm);
	const effectiveWeight_kg = computeEffectiveWeight(param.bmi, param.height_cm);
	const blood_mL = getBloodPart(idealWeight_kg, param.sex);

	const inspiratoryCapacity_mL = inpiratoryCapacityBasedOnAgeAndSex(
		param.age,
		param.sex
	);

	const body: HumanBody = {
		meta: {
			...param,
			idealWeight_kg: idealWeight_kg,
			effectiveWeight_kg: effectiveWeight_kg,
			inspiratoryCapacity_mL: inspiratoryCapacity_mL,
			VO2_LperKgMin: 0.0045, // ici vo2max et valeur "au repos"
			// ajouter valeur RF HR cible ?
			hematocrit: blood_mL.hematocrit, // valeur cible pour équilibre eau ?
			deadSpace_L: 0.0022 * idealWeight_kg, // Marieb p954
			initialBloodVolume_mL: blood_mL.total,
			cerebralCardiacOutput_LPerMin: ageToQbr(param.age),
			qbrAutoregulationStart_pp: 50,
			qbrAutoregulationStop_pp: 150,
			bounds: {
				vitals: {
					respiration: {
						tidalVolume_L: {
							min: 0,
							max: inspiratoryCapacity_mL / 1000,
						},
					},
					cardio: {
						hr: {
							min: 30,
							max: 220 - param.age
						},
						endSystolicVolume_mL: {
							min: 20,
							max: 50,
						}
					}
				}
			}
		},
		state: {
			time: 0,
			blocks: new Map(),
			connections: [],
			vitals: {
				cardiacArrest: undefined,
				capillaryRefillTime_s: 3,
				pain: 0,
				canWalk: true,
				glasgow: {
					total: 15,
					eye: 4,
					verbal: 5,
					motor: 6,
				},
				respiration: {
					QR: 0.84,
					tidalVolume_L: 0.5,
					rr: 15,
					SaO2: 0.97,
					CaO2: 200,
					PaO2: 50,
				},
				cardio: {
					totalVolume_mL: blood_mL.total,
					totalVolumeOfPlasmaProteins_mL: blood_mL.proteins,
					totalVolumeOfWater_mL: blood_mL.water,
					totalVolumeOfWhiteBloodCells_mL: blood_mL.leuco,
					totalVolumeOfErythrocytes_mL: blood_mL.red,
					totalExtLosses_ml: 0,
					chemicals: {},
					endDiastolicVolume_mL: 120, // so what ?
					endSystolicVolume_mL: 50, // so what ?
					Ra_mmHgMinPerL: 13, // idem
					// Rrv_mmHgMinPerL: 2.5, // idem
					// const totalCapacitance = bloodVolume * .65; // Marieb p808; 65%
					//totalCapacitance_L: (blood_mL.total / 1000) * 0.65, // idem TODO: f(xyz) ~80% total ?

					//venousCompliance_LPerMmHg: 0.16, // idem
					// PVC_mmHg: 4,
					cardiacOutput_LPerMin: 4.9,
					//cardiacOutputRv_LPerMin: 4.9,
					q_delta_mLPermin: 0,
					cerebralBloodOutput_mLperMin: 0.7,
					MAP: 70,
					hr: 70,
					DO2Sys: 1000,
				},
				brain: {
					Rbr: 60,
					GSC: 15,
					DO2: 138.25,
				},
			},
			variables: {
				ICP_mmHg: 5,
				paraOrthoLevel: orthoLevelFromAge(param.age),
				bleedFactor: 1,
				bodyPosition: "STANDING",
				//thoraxCompliance: 1,
				//thoraxComplianceDelta: 0,
			},
		},
		//effects: [],
		//pathologies: [],
		//availableActions: [],
	};

	// top to bottom
	createBlock(body.state, "HEAD", { fiO2: "freshAir" });
	createBlock(body.state, "BRAIN");

	createBlock(body.state, "NECK", { airResistance: 0 });
	
	createBlock(body.state, "C1-C4");
	createBlock(body.state, "C5-C7");
	createBlock(body.state, "T1-L4");

	createBlock(body.state, "THORAX", { compliance: 1, airResistance: 0 });

	createBlock(body.state, "LUNG", { airResistance: 0 });
	createBlock(body.state, "HEART");

	createBlock(body.state, "LEFT_SHOULDER");
	createBlock(body.state, "LEFT_ARM");
	createBlock(body.state, "LEFT_ELBOW");
	createBlock(body.state, "LEFT_FOREARM");
	createBlock(body.state, "LEFT_WRIST");
	createBlock(body.state, "LEFT_HAND");

	createBlock(body.state, "RIGHT_SHOULDER");
	createBlock(body.state, "RIGHT_ARM");
	createBlock(body.state, "RIGHT_ELBOW");
	createBlock(body.state, "RIGHT_FOREARM");
	createBlock(body.state, "RIGHT_WRIST");
	createBlock(body.state, "RIGHT_HAND");

	createBlock(body.state, "ABDOMEN");
	createBlock(body.state, "PELVIS");

	createBlock(body.state, "LEFT_THIGH");
	createBlock(body.state, "LEFT_KNEE");
	createBlock(body.state, "LEFT_LEG");
	createBlock(body.state, "LEFT_ANKLE");
	createBlock(body.state, "LEFT_FOOT");

	createBlock(body.state, "RIGHT_THIGH");
	createBlock(body.state, "RIGHT_KNEE");
	createBlock(body.state, "RIGHT_LEG");
	createBlock(body.state, "RIGHT_ANKLE");
	createBlock(body.state, "RIGHT_FOOT");

	connect(body.state, "HEAD", "NECK", { blood: 1, o2: true});

	connect(body.state, "HEAD", "BRAIN", { blood: 1, nervousSystem: true, });

	connect(body.state, "HEAD", "C1-C4", { nervousSystem: true, bones: true});
	connect(body.state, "C1-C4", "C5-C7",  { nervousSystem: true, bones: true});
	connect(body.state, "C1-C4", "LUNG",  { nervousSystem: true});

	connect(body.state, "C5-C7", "T1-L4", { nervousSystem: true, bones: true});
	connect(body.state, "C5-C7", "LEFT_SHOULDER", { nervousSystem: true, bones: true});
	connect(body.state, "C5-C7", "RIGHT_SHOULDER", { nervousSystem: true, bones: true});

	connect(body.state, "T1-L4", "PELVIS", { nervousSystem: true, bones: true});


	connect(body.state, "NECK", "THORAX", { blood: 0.15, o2: true});

	connect(body.state, "THORAX", "LUNG", { o2: true });

	connect(body.state, "THORAX", "HEART", { blood: 1 });

	connect(body.state, "THORAX", "LEFT_SHOULDER", { blood: 0.05, bones: true});
	connect(body.state, "LEFT_SHOULDER", "LEFT_ARM", { blood: 1, nervousSystem: true, bones: true});
	connect(body.state, "LEFT_ARM", "LEFT_ELBOW", { blood: 0.5, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_ELBOW", "LEFT_FOREARM", { blood: 1, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_FOREARM", "LEFT_WRIST", { blood: 0.01, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_WRIST", "LEFT_HAND", { blood: 1, nervousSystem: true,  bones: true});

	connect(body.state, "THORAX", "RIGHT_SHOULDER", { blood: 0.05, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_SHOULDER", "RIGHT_ARM", { blood: 1, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_ARM", "RIGHT_ELBOW", { blood: 0.5, nervousSystem: true, bones: true });
	connect(body.state, "RIGHT_ELBOW", "RIGHT_FOREARM", { blood: 1, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_FOREARM", "RIGHT_WRIST", { blood: 0.01, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_WRIST", "RIGHT_HAND", { blood: 1, nervousSystem: true,  bones: true});

	connect(body.state, "THORAX", "ABDOMEN", { blood: 0.75});
	connect(body.state, "ABDOMEN", "PELVIS", { blood: 1 / 3});

	connect(body.state, "PELVIS", "LEFT_THIGH", { blood: 0.5, nervousSystem: true,  bones: true });
	connect(body.state, "LEFT_THIGH", "LEFT_KNEE", { blood: 0.5, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_KNEE", "LEFT_LEG", { blood: 1, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_LEG", "LEFT_ANKLE", { blood: 0.01, nervousSystem: true,  bones: true});
	connect(body.state, "LEFT_ANKLE", "LEFT_FOOT", { blood: 1, nervousSystem: true,  bones: true});

	connect(body.state, "PELVIS", "RIGHT_THIGH", { blood: 0.5, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_THIGH", "RIGHT_KNEE", { blood: 0.5, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_KNEE", "RIGHT_LEG", { blood: 1, nervousSystem: true, bones: true });
	connect(body.state, "RIGHT_LEG", "RIGHT_ANKLE", { blood: 0.01, nervousSystem: true,  bones: true});
	connect(body.state, "RIGHT_ANKLE", "RIGHT_FOOT", { blood: 1, nervousSystem: true,  bones: true});

	createRespiratoryUnits("", param.lungDepth, body.state, "LUNG");

	doCompensate(body.state, body.meta, 0);

	// update the body to have up-to-date vitals
	body.state = updateVitals(body.state, body.meta, env, 0, true);
	return body;
}

export interface ConnectionWithPayload<Payload> {
	connection: RevivedConnection;
	payload?: Payload;
}

export type VisitorOptions<Payload> =
	| {
		leaveBlock?: (block: Block) => void;
		shouldWalk?: (connection: RevivedConnection, payload?: Payload) => boolean;
		prepareConnections?: (
			block: Block,
			connections: RevivedConnection[]
		) => ConnectionWithPayload<Payload>[];
	}
	| undefined;

export function visit<Payload>(
	bodyState: BodyState,
	blockName: string,
	enterBlock: (block: Block) => "CONTINUE" | "BREAK" | "RETURN",
	{ leaveBlock, shouldWalk, prepareConnections }: VisitorOptions<Payload> = {}
): void {
	const walked: Record<string, true> = {};
	_visit(bodyState, blockName, enterBlock, walked, {
		leaveBlock,
		shouldWalk,
		prepareConnections,
	});
}

function _visit<Payload>(
	bodyState: BodyState,
	blockName: string,
	enterBlock: (block: Block) => "CONTINUE" | "BREAK" | "RETURN",
	walked: Record<string, true>,
	{ leaveBlock, shouldWalk, prepareConnections }: VisitorOptions<Payload> = {}
) {
	// make sure not to go through the same block twice
	if (!walked[blockName]) {
		walked[blockName] = true;
		const block = findBlock(bodyState, blockName);
		if (block) {
			visitorLogger.debug("Enter block ", blockName);
			const status = enterBlock(block);
			let abort = false;
			if (status === "CONTINUE") {
				const filterd = block.connections
					.filter((c) => !walked[c.to])
					.map(c => ({
						to: c.to,
						params: bodyState.connections[c.paramsId]!
					}));


				// prepareConnections
				const preparedConnections: ConnectionWithPayload<Payload>[] =
					prepareConnections != null
						? prepareConnections(block, filterd)
						: filterd.map((c) => ({ connection: c }));
				visitorLogger.debug("P Connections: ", preparedConnections);
				preparedConnections
					.filter((pc) => !!pc)
					.forEach(({ connection, payload }) => {
						if (!abort) {
							visitorLogger.debug("Process connection to ", connection.to);
							const nextBlock = connection.to;
							if (shouldWalk === undefined || shouldWalk(connection, payload)) {
								const result = _visit(
									bodyState,
									nextBlock,
									enterBlock,
									walked,
									{ leaveBlock, shouldWalk, prepareConnections }
								);
								if (result === "RETURN") {
									abort = true;
								}
							}
						}
					});
			} else if (status === "RETURN") {
				return "RETURN";
			}
			if (abort) {
				return "RETURN";
			}
			if (leaveBlock != null) {
				leaveBlock(block);
			}
		}
	}
	return "CONTINUE";
}

export function prettyPrint(body: HumanBody): void {
	visit(body.state, "HEAD", (bloc) => {
		logger.debug(`Visit ${bloc.name}`);
		return "CONTINUE";
	});
}

export function findConnection(
	bodyState: BodyState,
	from: string,
	to: string,
	{
		validBlock,
		shouldWalk,
	}: {
		validBlock?: (block: Block) => boolean;
		shouldWalk?: (connection: RevivedConnection) => boolean;
	}
): string[] {
	const path: string[] = [];
	visit(
		bodyState,
		from,
		(block) => {
			visitorLogger.debug("Visit: " + block.name);
			if (validBlock != null && !validBlock(block)) {
				visitorLogger.warn("Invalid block");
				return "BREAK";
			}
			path.push(block.name);
			if (block.name === to) {
				visitorLogger.debug("Destination reached");
				return "RETURN";
			}
			visitorLogger.debug("Continue");
			return "CONTINUE";
		},
		{
			leaveBlock: () => {
				path.pop();
			},
			shouldWalk,
		}
	);
	return path;
}


export function readKey<T>(
	bodyState: any,
	key: BodyStateKeys
): T | undefined {
	const currentValue = key.split(".").reduce((acc, cur) => {
		if (acc != null) {
			if (cur in acc) {
				return (acc as unknown as any)[cur];
			}
		}
	}, bodyState);

	return currentValue as unknown as T | undefined;
}


export function getVitals(
	bodyState: BodyState,
	key: BodyStateKeys
): number | undefined {
	const currentValue = key.split(".").reduce((acc, cur) => {
		if (acc != null) {
			if (cur in acc) {
				return (acc as unknown as any)[cur];
			}
		}
	}, bodyState);

	return currentValue as unknown as number | undefined;
}

export function setVital(bodyState: BodyState, key: BodyStateKeys, value: unknown) {
	let current: unknown = bodyState;

	const chain = key.split(".");
	const prop = chain.pop()!;

	chain.forEach((property) => {
		compLogger.debug("Set Vital Current", current);
		let next = undefined;
		if (current != null) {
			if (typeof current === "object") {
				next = (current as unknown as any)[property];
			}
		}
		current = next;
	});

	(current as any)[prop] = value;
}


function updateAirResistance(bodyState: BodyState, durationInMinute: number) {
	visit(
		bodyState,
		"LUNG",
		(block) => {
			if (block.params.airResistanceDelta) {
				block.params.airResistance = add(
					block.params.airResistance ?? 0,
					block.params.airResistanceDelta * durationInMinute,
					{
						min: 0,
						max: 1,
					}
				);
			}
			return "CONTINUE";
		},
		{ shouldWalk: (c) => !!c.params.o2 }
	);
}

function updateCompliances(bodyState: BodyState, durationInMinute: number) {
	bodyState.blocks.forEach(block => {
		if (block.params.complianceDelta) {
			block.params.compliance = add(
				block.params.compliance ?? 1,
				block.params.complianceDelta * durationInMinute,
				{ min: 0, max: 1 }
			);
			logger.debug(
				`Update ${block.name} compliance`,
				block.params.compliance,
				block.params.complianceDelta,
				durationInMinute
			);
		}
	});
}

function updateICP(bodyState: BodyState, durationInMinute: number) {
	if (bodyState.variables.ICP_deltaPerMin) {
		bodyState.variables.ICP_mmHg +=
			bodyState.variables.ICP_deltaPerMin * durationInMinute;
	}
}

interface BloodInputOutput {
	bloodLosses_mL: number;
	extLosses_mL: number;
	salineInput_mL: number;
	bloodInput_mL: number;
	//instantaneous_mL: number;
	renalBloodOutput_mLperMin: number;
	cerebralBloodOutput_mLperMin: number;
	chemicalsInput: {
		[chemId: string]: number;
	};
}

// x: absolute thrombocytes
// y: coagulation amount [0;1] per minutes
const coagulationModel: Point[] = [
	{ x: 0, y: 0 }, // no thrombocyte, no hemostasis
	{ x: 100, y: 1 }, // to review !
];

/**
 * Coagulation heals bleedingFactor
 */
function hemostasis_thrombocytes(
	bleedingFactor: number,
	wbc_ratio: number,
	loss: number
): number {
	if (coagulationEnabled) {
		// total number of platelets
		const absWbc = loss * wbc_ratio;
		bloodLogger.debug("Platelets", { wbc_ratio, loss, absWbc });
		return add(bleedingFactor, -interpolate(absWbc, coagulationModel), {
			min: 0,
		});
	} else {
		return bleedingFactor;
	}
}

// x: loss / cardiaOutput
// y: resistance delta [-1;1] perMin
const vasoconstrictionModel: Point[] = [
	{ x: -1, y: 0.05 },
	{ x: 0.1, y: 0 }, //
	{ x: 0.1, y: -0.01 }, //
	{ x: 1, y: -0.01 },// no losses leads to vasodilatation
];

/**
 * losses increase block resistance
 */
function hemostasis_vasoconstriction(
	currentResistance: number,
	delta_mlPerMin: number,
	cardiacOutput_mLPerMin: number,
	duration_min: number
): number {
	if (vasoconstrictionEnabled) {
		const ratio = delta_mlPerMin / cardiacOutput_mLPerMin;
		const constriction_perMin = interpolate(ratio, vasoconstrictionModel);
		const constriction_lap = constriction_perMin * duration_min;
		bloodLogger.log("vasoconstriction", {
			delta_mlPerMin,
			cardiacOutput_mLPerMin,
			ratio,
			constriction_perMin,
			constriction_lap,
		});

		return add(currentResistance, constriction_lap, { min: 0, max: 1 });
	} else {
		return currentResistance;
	}
}

function dispatch(bodyState: BodyState, connections: RevivedConnection[], co: number) {
	// extract qPercent and nextBlock resistance
	let effectiveSum = 0;
	let initialSum = 0;

	const data = connections.map((c) => {
		const nextBlock = findBlock(bodyState, c.to);
		if (nextBlock != null) {
			initialSum += c.params.blood || 0;

			const eQ = (c.params.blood || 0) *
				(1 - (nextBlock.params.bloodFlow
					? nextBlock.params.bloodResistance || 0
					: 1));
			effectiveSum += eQ;

			return {
				c: c,
				initialQFactor: c.params.blood,
				effectiveQFactor: eQ,
			};
		} else {
			return {
				c: c,
				initialQFactor: c.params.blood,
				effectiveQFactor: 0,
			};
		}
	});

	if (initialSum > 1) {
		logger.error("Please review qFactors", connections);
	}

	const enabled = initialSum !== effectiveSum;

	// percentage "consumed by the current block"
	const initialBlockQFactor = 1 - initialSum;
	effectiveSum += initialBlockQFactor;
	const redirected = 1 - effectiveSum;

	const prepared = data.map((d) => {
		return {
			connection: d.c,
			payload:
				(d.effectiveQFactor + (d.effectiveQFactor * redirected) / effectiveSum) * co,
		};
	});

	if (enabled) {
		bloodLogger.log("DATA: ", data);
		bloodLogger.log("Vasoconstricted BloodFlow ", prepared, {
			co,
			effectiveSum,
			initialBlockQFactor,
			initialSum,
		});
	}
	return prepared;
}

interface ConstrictedConnection {
	c: RevivedConnection,
	initialCo: number,
	effectiveCo: number,
}

interface UnconstrictedConnection {
	c: RevivedConnection,
	co: number,
}


interface Data {
	constricted: {
		initialSum: number;
		effectiveSum: number;
		connections: ConstrictedConnection[];
	},
	unconstricted: {
		sum: number;
		connections: UnconstrictedConnection[];
	}
}

function dispatchV2(bodyState: BodyState, connections: RevivedConnection[], co: number) {

	const data = connections.reduce<Data>((acc, current) => {
		const nextBlock = findBlock(bodyState, current.to);
		const oCo = (current.params.blood || 0) * co;
		if (nextBlock != null) {


			const constricted = nextBlock.params.bloodFlow === false || nextBlock.params.bloodResistance! > 0;
			if (constricted) {
				const cCo = co * (current.params.blood || 0) *
					(1 - (nextBlock.params.bloodFlow
						? nextBlock.params.bloodResistance || 0
						: 1));
				acc.constricted.initialSum += oCo;
				acc.constricted.effectiveSum += cCo;
				acc.constricted.connections.push({
					c: current,
					effectiveCo: cCo,
					initialCo: oCo,
				})
			} else {
				acc.unconstricted.sum += oCo;
				acc.unconstricted.connections.push({
					c: current,
					co: oCo,
				})
			}
		} else {
			acc.constricted.connections.push({
				c: current,
				effectiveCo: 0,
				initialCo: oCo,
			})
		}
		return acc;
	}, {
		constricted: {
			initialSum: 0,
			effectiveSum: 0,
			connections: [],
		},
		unconstricted: {
			sum: 0,
			connections: [],
		}
	});

	const toRedirect = data.constricted.initialSum - data.constricted.effectiveSum;
	if (toRedirect > 0) {
		data.unconstricted.connections.forEach(c => {
			c.co = c.co * toRedirect / data.unconstricted.sum;
		})
	}

	const prepared: ConnectionWithPayload<number>[] = [...data.constricted.connections.map(c => ({
		connection: c.c,
		payload: c.effectiveCo,
	})),
	...data.unconstricted.connections.map(c => ({
		connection: c.c,
		payload: c.co,
	}))
	];

	if (data.constricted.connections.length > 0) {
		bloodLogger.log("DATA: ", data);
		bloodLogger.log("Vasoconstricted BloodFlow ", prepared, {
			co,
		});
	}
	return prepared;
}

function sumBloodInOut(
	bodyState: BodyState,
	bodyMeta: HumanMeta,
	durationInMin: number
): BloodInputOutput {
	let sum: BloodInputOutput = {
		//instantaneous_mL: 0,
		bloodLosses_mL: 0,
		extLosses_mL: 0,
		salineInput_mL: 0,
		bloodInput_mL: 0,
		renalBloodOutput_mLperMin: 0,
		cerebralBloodOutput_mLperMin: 0,
		chemicalsInput: {},
	};

	const cardiacOutput_mLPerMin: number[] = [
		bodyState.vitals.cardio.cardiacOutput_LPerMin * 1000,
	];
	const wbc_ratio =
		bodyState.vitals.cardio.totalVolumeOfWhiteBloodCells_mL /
		bodyState.vitals.cardio.totalVolume_mL;

	const bleedFactor = bodyState.variables.bleedFactor;

	visit<number>(
		bodyState,
		"HEART",
		(block) => {
			bloodLogger.debug("Debits: ", block.name, cardiacOutput_mLPerMin);
			bloodLogger.debug("Block", block.params);

			const flow_mLPerMin = cardiacOutput_mLPerMin[0] || 0;
			block.params.bloodFlow_mLper = flow_mLPerMin;
			let blockExtLosses_ml = 0;

			// extract block-specific blood flow
			// TODO: extract all and store them within blocks
			// TODO: compute "reference" flow (without losses nor constriction)
			if (block.name === "ABDOMEN") {
				// TODO: 40% de ce qui ne part pas dans les autres blocs
				// act. 1/3 part dans le bassin => 0.26666
				//
				sum.renalBloodOutput_mLperMin = flow_mLPerMin * 0.266666;
				bloodLogger.debug(
					"Renal output",
					sum.renalBloodOutput_mLperMin,
					" / ",
					bodyState.vitals.cardio.cardiacOutput_LPerMin * 1000
				);
			}
			let delta_mL = 0;

			if (block.name === "BRAIN") {
				sum.cerebralBloodOutput_mLperMin = flow_mLPerMin;
				bloodLogger.info(
					"QBr ",
					flow_mLPerMin,
					" / ",
					bodyState.vitals.cardio.cardiacOutput_LPerMin * 1000
				);
			}

			if (block.params.arterialBleedingFactor) {
				const reduction = block.params.arterialBleedingReductionFactor ?? 0;
				const loss =
					block.params.arterialBleedingFactor *
					flow_mLPerMin *
					durationInMin *
					bleedFactor *
					(1 - reduction);
				// should ??
				const newBlFactor = hemostasis_thrombocytes(
					block.params.arterialBleedingFactor,
					wbc_ratio,
					loss
				);
				bloodLogger.debug("Arterial loss: ", { loss, newBlFactor });
				block.params.arterialBleedingFactor = newBlFactor;
				sum.bloodLosses_mL += loss;
				sum.extLosses_mL += loss;
				blockExtLosses_ml += loss;
				delta_mL -= loss;
			}

			if (block.params.venousBleedingFactor) {
				const reduction = block.params.venousBleedingReductionFactor ?? 0;
				const loss =
					block.params.venousBleedingFactor *
					flow_mLPerMin *
					durationInMin *
					bleedFactor *
					(1 - reduction);
				const newBlFactor = hemostasis_thrombocytes(
					block.params.venousBleedingFactor,
					wbc_ratio,
					loss
				);
				bloodLogger.debug("Venous loss: ", { loss, newBlFactor });
				block.params.venousBleedingFactor = newBlFactor;
				sum.bloodLosses_mL += loss;
				sum.extLosses_mL += loss;
				blockExtLosses_ml += loss;
				delta_mL -= loss;
			}

			if (blockExtLosses_ml! > 0) {
				block.params.extLossesFlow_mlPerMin = blockExtLosses_ml / durationInMin;
				block.params.totalExtLosses_ml = (block.params.totalExtLosses_ml || 0) + blockExtLosses_ml;
			} else {
				block.params.extLossesFlow_mlPerMin = 0;
			}

			if (block.params.internalBleedingFactor) {
				const reduction = block.params.internalBleedingReductionFactor ?? 0;
				const loss =
					block.params.internalBleedingFactor *
					flow_mLPerMin *
					durationInMin *
					bleedFactor *
					(1 - reduction);
				const newBlFactor = hemostasis_thrombocytes(
					block.params.internalBleedingFactor,
					wbc_ratio,
					loss
				);
				bloodLogger.debug("Internal loss: ", { loss, newBlFactor });
				block.params.internalBleedingFactor = newBlFactor;
				sum.bloodLosses_mL += loss;
				delta_mL -= loss;
			}

			if (block.params.instantaneousBloodLoss) {
				bloodLogger.debug(
					"Instantaneous Loss",
					block.params.instantaneousBloodLoss
				);
				const loss = block.params.instantaneousBloodLoss * bleedFactor;
				sum.bloodLosses_mL += loss;
				delta_mL -= loss;
				// make sure not to count instaneous losses twice !
				block.params.instantaneousBloodLoss = 0;
			}

			if (block.params.salineSolutionInput_oneShot) {
				sum.salineInput_mL += block.params.salineSolutionInput_oneShot;
				delta_mL += block.params.salineSolutionInput_oneShot;
				bloodLogger.debug(
					"One Shot Saline Input: ",
					block.params.salineSolutionInput_oneShot
				);
				// make sure not to count instaneous input twice !
				block.params.salineSolutionInput_oneShot = 0;
			}

			if (block.params.salineSolutionInput_mLperMin) {
				const input = block.params.salineSolutionInput_mLperMin * durationInMin;
				sum.salineInput_mL += input;
				bloodLogger.debug("Saline input: ", input);
				delta_mL += input;
			}

			if (block.params.bloodInput_mLperMin) {
				const input = block.params.bloodInput_mLperMin;
				sum.bloodInput_mL += input;
				bloodLogger.debug("Blood input: ", input);
				delta_mL += input;
			}

			if (block.params.bloodInput_oneShot) {
				sum.bloodInput_mL += block.params.bloodInput_oneShot;
				delta_mL += block.params.bloodInput_oneShot;
				bloodLogger.debug(
					"One Shot Blood Input: ",
					block.params.bloodInput_oneShot
				);
				// make sure not to count instaneous input twice !
				block.params.bloodInput_oneShot = 0;
			}

			// Alter block output according to inputs and outputs
			if (delta_mL) {
				const delta_mlPerMin = delta_mL / durationInMin;
				// update cardiac output
				bloodLogger.debug("Cardiac Output input/output", {
					block: block,
					bleedFactor,
					delta_mL,
					durationInMin,
					delta_mlPerMin,
					flow_mLPerMin,
				});
				cardiacOutput_mLPerMin[0] = add(flow_mLPerMin, delta_mlPerMin, {
					min: 0,
				});

				// update vasoconstriction
				const currentResistance = block.params.bloodResistance || 0;
				const newResistance = hemostasis_vasoconstriction(
					currentResistance,
					delta_mlPerMin,
					flow_mLPerMin,
					durationInMin
				);
				bloodLogger.log("Vasoconstriction: ", {
					block: block.name,
					currentResistance,
					newResistance,
					delta_mlPerMin,
					flow_mLPerMin,
					durationInMin,
				});
				block.params.bloodResistance = newResistance;
			}

			if (block.params.chemicals != null) {
				Object.entries(block.params.chemicals).forEach(([chemId, input]) => {
					bloodLogger.debug("Process Chemical", chemId, input);
					sum.chemicalsInput[chemId] = sum.chemicalsInput[chemId] || 0;
					if (input.once) {
						sum.chemicalsInput[chemId] += input.once;
						input.once = 0;
					}
					if (input.perMin) {
						sum.chemicalsInput[chemId] += input.perMin * durationInMin;
					}
				});
				bloodLogger.info("Sum Chemicals: ", sum.chemicalsInput);
			}

			if (!block.params.bloodFlow) {
				bloodLogger.debug("Blood Flow interrupted!");
				cardiacOutput_mLPerMin[0] = 0;
			}
			return "CONTINUE";
		},
		{
			prepareConnections: (block, connections) => {
				// un modeste alambique
				const co = cardiacOutput_mLPerMin[0] || 0;
				bloodLogger.debug("Prepare Q: ", co);
				if (block.name === "THORAX") {
					// The brain got some autoregulation magic

					// resistance values guessed fron p18 of:
					// http://umvf.cerimes.fr/media/ressWikinu/Neurophysiologie/Neurophysiologie_UPMC/2007-neurophysio-DSC-jfv.pdf

					// https://pubs.asahq.org/anesthesiology/article/123/5/1198/12559/Cardiac-Output-and-Cerebral-Blood-FlowThe
					// https://www.anaesthesiauk.com/article.aspx?articleid=100754

					// Vasoconstriction ? Vasodilatation ?
					const mapped = connections.reduce<{
						brain?: RevivedConnection;
						others: RevivedConnection[];
					}>(
						(acc, cur) => {
							if (cur.to === "NECK") {
								acc.brain = cur;
							} else {
								acc.others.push(cur);
							}
							return acc;
						},
						{
							others: [],
						}
					);

					const qbr_target = bodyMeta.cerebralCardiacOutput_LPerMin * 1000;

					// Based on the Fick principal (ie q = (map - icp) / res), extract the extra resistance induced by ICP
					// ie (map - icp) / res = map / (res + delta)
					const map = bodyState.vitals.cardio.MAP;
					const icp = bodyState.variables.ICP_mmHg;
					logger.log("The Brain: ", { map, icp });

					const pp = map - icp;
					const qBrModel = [
						{ x: 0, y: 0 },
						{ x: bodyMeta.qbrAutoregulationStart_pp, y: qbr_target },
						{ x: bodyMeta.qbrAutoregulationStop_pp, y: qbr_target },
						{ x: 300, y: 4 * qbr_target },
					];

					logger.debug("QbrModel: ", qBrModel);

					//f(pp);
					const qBrain = interpolate(pp, qBrModel);

					bloodLogger.info("Blood: ", { qBrain, co });

					if (qBrain < co) {
						const qOthers = co - qBrain;
						/*const total = mapped.others.reduce((a, c) => a + (c.params.blood || 0), 0);
									bloodLogger.log("Total OtherFactor: ", { total });
			
									const rs = [{
										connection: mapped.brain,
										payload: qBrain,
									},
									...mapped.others.map(c => ({
										connection: c,
										payload: c.params.blood * qOthers / total,
									}))];*/
						const rs = [
							{
								connection: mapped.brain!,
								payload: qBrain,
							},
							...dispatchV2(bodyState, mapped.others, qOthers),
						];
						bloodLogger.debug("AutoRegulated BloodFlow ", rs);
						return rs;
					} else {
						bloodLogger.log("Well, you're dead, dude");
						return [];
					}
					// const rBrain = bodyState.vitals.brain.Rbr;
					// const deltaR = map*map - map*icp - rBrain*rBrain;

					// const effectiveBrainR = rBrain + deltaR;
				} else {
					// dispatch blood flow according to connection percentage and next blocks resistance

					return dispatchV2(bodyState, connections, co);
				}
			},
			leaveBlock: (b) => {
				bloodLogger.debug("Leave ", b);
				cardiacOutput_mLPerMin.shift();
			},
			shouldWalk: (c, payload) => {
				bloodLogger.debug("ShouldWalkPayload: ", payload);
				if (c.params.blood && payload != null) {
					bloodLogger.debug("Should Walk: ", c, payload);
					cardiacOutput_mLPerMin.unshift(payload);
					return true;
				} else {
					bloodLogger.debug("Skip: ", c);
					return false;
				}
			},
		}
	);

	bloodLogger.info("SumBlood", sum);
	return sum;
}

function updateVitals(
	previousState: BodyState,
	meta: HumanMeta,
	env: Environnment,
	newTime: number,
	stabilize: boolean
): BodyState {
	//const newState = cloneDeep(previousState);
	const newState = previousState;
	const durationInMin = (newTime - previousState.time) / 60;

	const initialTotalVolume_mL = newState.vitals.cardio.totalVolume_mL;

	vitalsLogger.info("UPDATE VITALS", newTime, newState.time);

	updateAirResistance(newState, durationInMin);
	updateCompliances(newState, durationInMin);
	updateICP(newState, durationInMin);

	const sumBlood = sumBloodInOut(newState, meta, durationInMin);
	const {
		bloodLosses_mL,
		salineInput_mL,
		bloodInput_mL,
		chemicalsInput,
		renalBloodOutput_mLperMin,
		cerebralBloodOutput_mLperMin,
		extLosses_mL,
	} = sumBlood;

	newState.vitals.cardio.cerebralBloodOutput_mLperMin =
		cerebralBloodOutput_mLperMin;
	newState.vitals.cardio.totalExtLosses_ml += extLosses_mL;
	const effectiveLosses = bloodLosses_mL;

	vitalsLogger.info("Blood +/-", sumBlood);

	let proteins_mL = newState.vitals.cardio.totalVolumeOfPlasmaProteins_mL;
	let water_mL = newState.vitals.cardio.totalVolumeOfWater_mL;
	let wbc_mL = newState.vitals.cardio.totalVolumeOfWhiteBloodCells_mL;
	let rbc_mL = newState.vitals.cardio.totalVolumeOfErythrocytes_mL;

	let bloodVolume_mL = proteins_mL + water_mL + wbc_mL + rbc_mL;

	const plasma_mL = water_mL + proteins_mL;

	const renal_mL = renalBloodOutput_mLperMin * durationInMin;
	const plasmaRatio = bloodVolume_mL > 0 ? plasma_mL / bloodVolume_mL : 0;
	const renalPlasma_mL = renal_mL * plasmaRatio;

	bloodLogger.info("CurrentVolume: ", bloodVolume_mL, { plasmaRatio });

	// clean chemicals
	Object.entries(newState.vitals.cardio.chemicals).forEach(
		([chemId, value]) => {
			const chemical = getChemical(chemId);
			if (chemical != null) {
				if (chemical.clearance_mLperMin && chemical.vd_LperKg) {
					// TODO: ideal or effective
					const vd_L = chemical.vd_LperKg * meta.effectiveWeight_kg;
					const concentration_perMl = value / (vd_L * 1000);

					const theoreticalCleaned_mL =
						chemical.clearance_mLperMin * durationInMin;
					const eCleaned_mL = Math.min(theoreticalCleaned_mL, renalPlasma_mL);
					const delta = eCleaned_mL * concentration_perMl;

					bloodLogger.info("Clean ", chemical, {
						value,
						plasma_mL,
						renal_mL,
						plasmaRatio,
						renalPlasma_mL,
						durationInMin,
						concentration_perMl,
						eCleaned_mL,
						delta,
					});
					newState.vitals.cardio.chemicals[chemId] -= delta;
				} else if (chemical.halflife_s) {
					const ke = LN_2 / chemical.halflife_s;
					const r = Math.exp(-ke * (durationInMin * 60));

					newState.vitals.cardio.chemicals[chemId] *= r;
				}
			}
		}
	);

	if (effectiveLosses > 0) {
		const newVolume = normalize(bloodVolume_mL - effectiveLosses, { min: 0 });

		const ratio = bloodVolume_mL > 0 ? newVolume / bloodVolume_mL : 0;
		bloodLogger.info(
			"Losses: ",
			ratio,
			" = ",
			newVolume,
			" / ",
			bloodVolume_mL
		);

		proteins_mL *= ratio;
		water_mL *= ratio;
		wbc_mL *= ratio;
		rbc_mL *= ratio;
		bloodVolume_mL = newVolume;

		// apply ratio to chemicals too
		Object.entries(newState.vitals.cardio.chemicals).forEach(
			([chemId, value]) => {
				bloodLogger.info("Ratio on Chem: ", chemId, value, ratio);
				newState.vitals.cardio.chemicals[chemId] = value * ratio;
				bloodLogger.info("Chem: ", newState.vitals.cardio.chemicals[chemId]);
			}
		);
	}

	if (salineInput_mL > 0) {
		bloodVolume_mL += salineInput_mL;
		water_mL += salineInput_mL;
	}

	if (bloodInput_mL > 0) {
		bloodVolume_mL += bloodInput_mL;
		rbc_mL += bloodInput_mL;
	}

	newState.vitals.cardio.totalVolumeOfPlasmaProteins_mL = proteins_mL;
	newState.vitals.cardio.totalVolumeOfWater_mL = water_mL;
	newState.vitals.cardio.totalVolumeOfWhiteBloodCells_mL = wbc_mL;
	newState.vitals.cardio.totalVolumeOfErythrocytes_mL = rbc_mL;

	//	newState.vitals.cardio.totalVolumeOfInstantaneousLosses_mL =
	//		instantaneous_mL * newState.variables.bleedFactor;

	newState.vitals.cardio.totalVolume_mL = bloodVolume_mL;

	// chemical input
	Object.entries(chemicalsInput).forEach(([chemId, input]) => {
		newState.vitals.cardio.chemicals[chemId] =
			newState.vitals.cardio.chemicals[chemId] || 0;
		newState.vitals.cardio.chemicals[chemId] += input;
	});

	bloodLogger.info("Chemicals:", newState.vitals.cardio.chemicals);

	// Too much water. half-life 40min

	// water
	const idealWaterVolume = bloodVolume_mL * (1 - meta.hematocrit - 0.01) * 0.9;
	const extraWater = water_mL - idealWaterVolume;
	bloodLogger.info("Water: ", { idealWaterVolume, water_mL, extraWater });

	if (extraWater > 0) {
		// too much water
		const ke = LN_2 / (60 * 40);
		const r = Math.exp(-ke * (durationInMin * 60));

		//const newExtra = extraWater * r;
		const wLoss = extraWater * (1 - r);

		newState.vitals.cardio.totalVolumeOfWater_mL -= wLoss;
		newState.vitals.cardio.totalVolume_mL -= wLoss;

		bloodLogger.info("Water: ", {
			extraWater,
			r,
			wLoss,
			new: newState.vitals.cardio.totalVolumeOfWater_mL,
		});
	}

	//
	const delta_ml =
		newState.vitals.cardio.totalVolume_mL - initialTotalVolume_mL;
	logger.info("Blood Sum: ", {
		delta_ml,
		initialTotalVolume_mL,
		newTotal: newState.vitals.cardio.totalVolume_mL,
	});

	newState.vitals.cardio.q_delta_mLPermin =
		durationInMin > 0 ? delta_ml / durationInMin : 0;
	logger.debug(
		"Blood Sum delta/min: ",
		newState.vitals.cardio.q_delta_mLPermin
	);

	const newVitals = compute(newState, meta, env, durationInMin, stabilize);
	newState.vitals = newVitals;

	compensate(newState, meta, durationInMin);

	inferExtraOutputs({ state: newState, meta: meta });
	newState.time = newTime;
	return newState;
}

export function computeState(
	state: BodyState,
	meta: HumanMeta,
	env: Environnment,
	duration: number,
	pathologies: AfflictedPathology[],
	effects: BodyEffect[]
): BodyState {
	const previousTime = state.time;
	const time = previousTime + duration;

	/* Get rules with effective times */
	const rules = [
		...pathologies.flatMap((ap) => {
			const pathology = getPathology(ap.pathologyId);
			patchLogger.debug("Extract rules from ", pathology);
			if (pathology) {
				return pathology.rules.map((rule) => ({
					time: rule.time + ap.time,
					afflictedBlocks: ap.afflictedBlocks,
					rule: rule,
				}));
			} else {
				return [];
			}
		}),
		...effects.flatMap((effect) => {
			return effect.rules.map((rule) => {
				return {
					time: rule.time + effect.time,
					afflictedBlocks: effect.afflictedBlocks,
					rule: rule,
				};
			});
		}),
	];

	patchLogger.info("Extracted rules ", rules);

	const checkpoints = uniq([...rules.map((r) => r.time), time])
		.filter((t) => t > previousTime && t <= time)
		.sort();

	patchLogger.info("Checkpoints: ", {previousTime, time, checkpoints});


	return checkpoints.reduce<BodyState>((acc, checkpointTime) => {
		patchLogger.debug(
			"***************************************** Process Checkpoint **************",
			checkpointTime
		);

		const newState = updateVitals(acc, meta, env, checkpointTime, false);

		detectCardiacArrest(newState);


		function addToBlockVariable(
			block: Block,
			key: NumericBlockParams,
			defaultValue: number,
			delta: number | undefined
		) {
			if (delta) {
				block.params[key] = block.params[key] || defaultValue;
				patchLogger.info("AddTo ", key, delta);
				block.params[key]! += delta;
			}
		}

		function setBlockVariableIfGreater(
			block: Block,
			key: NumericBlockParams,
			value: number | undefined
		) {
			if (value != null) {
				const current = block.params[key];
				if (current != null) {
					patchLogger.info("Max ", key, current, value);
					block.params[key] = Math.max(value, current);
				} else {
					patchLogger.info("Init ", key, value);
					block.params[key] = value;
				}
			}
		}

		rules
			.filter((rule) => rule.time === checkpointTime)
			.forEach((rule) => {
				patchLogger.debug("Apply rule : ", rule);
				rule.afflictedBlocks
					.map((blockName) => findBlock(newState, blockName))
					.forEach((block) => {
						if (block != null) {
							patchLogger.info("Patch block ", block);
							const patch = rule.rule.blockPatch;

							const keys = Object.keys(patch) as (keyof Block["params"])[];
							keys.forEach((key) => {
								if (key === "instantaneousBloodLoss") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "arterialBleedingFactor") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "arterialBleedingReductionFactor") {
									setBlockVariableIfGreater(block, key, patch[key]);
								} else if (key === "venousBleedingFactor") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "venousBleedingReductionFactor") {
									setBlockVariableIfGreater(block, key, patch[key]);
								} else if (key === "internalBleedingFactor") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "internalBleedingReductionFactor") {
									setBlockVariableIfGreater(block, key, patch[key]);
								} else if (key === "salineSolutionInput_oneShot") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "salineSolutionInput_mLperMin") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "bloodInput_mLperMin") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "bloodInput_oneShot") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "chemicals") {
									patchLogger.info("Patch chemicals", patch.chemicals);
									Object.entries(patch.chemicals || {}).forEach(
										([chemId, value]) => {
											patchLogger.debug("Patch chemicals", chemId, value);
											block.params.chemicals = block.params.chemicals || {};
											const chem = block.params.chemicals[chemId] || {
												once: 0,
												perMin: 0,
											};
											if (value.once) {
												chem.once = chem.once
													? chem.once + value.once
													: value.once;
												patchLogger.info("ChemOnce += ", chemId, value.once);
											}
											if (value.perMin) {
												chem.perMin = chem.perMin
													? chem.perMin + value.perMin
													: value.perMin;
												patchLogger.info("Chem /min += ", chemId, value.perMin);
											}
											block.params.chemicals[chemId] = chem;
										}
									);
								} else if (key === "bloodFlow") {
									if (patch.bloodFlow != null) {
										block.params.bloodFlow = patch.bloodFlow;
									}
								} else if (key === "fiO2") {
									if (patch.fiO2 != null) {
										block.params.fiO2 = patch.fiO2;
									}
								} else if (key === "atmosphericPressure") {
									if (patch.atmosphericPressure) {
										block.params.atmosphericPressure =
											patch.atmosphericPressure;
									}
								} else if (key === "intubated") {
									if (patch.intubated != null) {
										block.params.intubated = patch.intubated;
									}
								} else if (key === "airResistance") {
									if (patch.airResistance) {
										block.params.airResistance = Math.max(
											patch.airResistance,
											block.params.airResistance || 0
										);
									}
								} else if (key === "airResistanceDelta") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "compliance") {
									if (patch.compliance != null) {
										block.params.compliance = Math.min(
											patch.compliance,
											block.params.compliance || 1
										);
									}
								} else if (key === "complianceDelta") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "bloodResistance") {
									addToBlockVariable(block, key, 0, patch[key]);
								} else if (key === "broken") {
									if (patch.broken != null) {
										block.params.broken = patch.broken || block.params.broken;
									}
								} else if (key === "nervousSystemBroken") {
									if (patch.nervousSystemBroken != null) {
										block.params.nervousSystemBroken =
											patch.nervousSystemBroken ||
											block.params.nervousSystemBroken;
									}
								} else if (key === "pain") {
									setBlockVariableIfGreater(block, key, patch[key]);
								} else if (key === "bloodFlow_mLper") {
									// not impactable
								} else if (key === "extLossesFlow_mlPerMin") {
									// not impactable
								} else if (key === "totalExtLosses_ml") {
									// not impactable
								} else {
									checkUnreachable(key);
								}
							});
							patchLogger.debug(" give", block);
						} else {
							patchLogger.debug("Undefined block !");
						}
					});

				const keys = Object.keys(
					rule.rule.variablePatch
				) as (keyof BodyState["variables"])[];
				keys.forEach((key) => {
					if (key === "bleedFactor") {
						if (rule.rule.variablePatch.bleedFactor != null) {
							newState.variables.bleedFactor *=
								rule.rule.variablePatch.bleedFactor;
						}
						//          } else if (key === 'paCO2Delta') {
						//            if (rule.rule.variablePatch.paCO2Delta != null) {
						//              newState.variables.paCO2Delta = add(newState.variables.paCO2Delta, rule.rule.variablePatch.paCO2Delta, {min: 0});
						//            }
					} else if (key === "ICP_mmHg") {
						if (rule.rule.variablePatch.ICP_mmHg != null) {
							newState.variables.ICP_mmHg += rule.rule.variablePatch.ICP_mmHg;
						}
					} else if (key === "ICP_deltaPerMin") {
						if (rule.rule.variablePatch.ICP_deltaPerMin != null) {
							newState.variables.ICP_deltaPerMin =
								newState.variables.ICP_deltaPerMin ?? 0;
							newState.variables.ICP_deltaPerMin +=
								rule.rule.variablePatch.ICP_deltaPerMin;
						}
					} else if (key === "paraOrthoLevel") {
						if (rule.rule.variablePatch.paraOrthoLevel != null) {
							newState.variables.paraOrthoLevel +=
								rule.rule.variablePatch.paraOrthoLevel;
						}
					} else if (key === "bodyPosition") {
						if (rule.rule.variablePatch.bodyPosition != null) {
							// TODO: restrict to recovery only ?
							newState.variables.bodyPosition +=
								rule.rule.variablePatch.bodyPosition;
						}
					} else {
						checkUnreachable(key);
					}
				});
			});
		patchLogger.debug(
			"Vitals/Variables: ",
			newState.vitals,
			newState.variables
		);

		return newState;
		//}, cloneDeep(body.state));
	}, state);
}

function _doSelectBetweenMinAndMaxBlocks(
	blocks: string[],
	numBlocks: number,
	repeat: boolean = false
): string[] {
	if ((!repeat && blocks.length < numBlocks) || blocks.length === 0) {
		throw "Not enough blocks:";
	}
	const bl = [...blocks];

	const selectedBlocks: string[] = [];
	for (let k = 0; k < numBlocks; k++) {
		const l = bl.length;
		const i = Math.floor(Math.random() * l);
		selectedBlocks.push(bl[i]!);
		if (!repeat) {
			bl.splice(i, 1);
		}
	}
	return selectedBlocks;
}

function selectBetweenMinAndMaxBlocks(
	blocks: string[],
	min: number,
	max: number,
	repeat: boolean = false,
	preferredBlocks?: string[]
): string[] {
	const range = max - min;
	const numBlocks = min + Math.floor(Math.random() * range);
	logger.debug("Select ", numBlocks, " within ", preferredBlocks, blocks);
	if (preferredBlocks?.length) {
		if (repeat || preferredBlocks.length >= numBlocks) {
			// select all blocks within preferred
			return _doSelectBetweenMinAndMaxBlocks(
				preferredBlocks,
				numBlocks,
				repeat
			);
		} else {
			// select all preferred blocks and fetch missings from others
			const nbMissing = numBlocks - preferredBlocks.length;
			const restBlocks = blocks.filter((b) => !preferredBlocks.includes(b));
			return [
				...preferredBlocks,
				..._doSelectBetweenMinAndMaxBlocks(restBlocks, nbMissing, false),
			];
		}
	} else {
		return _doSelectBetweenMinAndMaxBlocks(blocks, numBlocks, repeat);
	}
}

export function afflictPathology(
	//_body: HumanBody,
	pathology: PathologyDefinition,
	time: number,
	/** optional list of preferred blocks */
	blocks?: string[]
): AfflictedPathology {
	// TODO handle amputations : do not afflict non-existing blocks
	const ap = {
		id: "some_unique_id",
		time: time,
		pathologyId: pathology.id,
		afflictedBlocks: selectBetweenMinAndMaxBlocks(
			pathology.blocks,
			pathology.minNumberOfBlocks,
			pathology.maxNumberOfBlocks,
			false,
			blocks
		),
	};
	logger.debug("Afflict Pathology: ", ap, { blocks });
	return ap;
}

export function doItemActionOnHumanBody(
	item: ItemDefinition,
	action: ActionBodyEffect,
	//_body: HumanBody,
	blockNames: string[],
	time: number,
): BodyEffect | undefined {
	// find a match between given block and action ones
	const block = action.blocks.find((b) => blockNames.includes(b));

	// TODO handle amputations : do not afflict non-existing blocks
	if (!block) {
		patchLogger.warn("Block not found");
		return undefined;
	}

	return {
		id: "some_unique_id",
		time: time,
		rules: action.rules,
		afflictedBlocks: [block],
		item: item,
		action: action,
	};
}

function isNervousSystemFine(block: Block): boolean {
	return !block.params.nervousSystemBroken;
}

function isNervousSystemConnection(c: RevivedConnection) {
	return !!c.params.nervousSystem;
}

function isNotBroken(block: Block): boolean {
	return !block.params.broken;
}

function isBone(c: RevivedConnection) {
	return !!c.params.bones;
}

export function canWalk(body: HumanBody): boolean {
	visitorLogger.debug("Walk: ", body);
	if (body.state.vitals.cardio.hr < 10) {
		visitorLogger.debug("Can not walk: HR < 10");
		return false;
	}

	if (
		findConnection(body.state, "BRAIN", "PELVIS", {
			validBlock: isNervousSystemFine,
			shouldWalk: isNervousSystemConnection,
		}).length === 0
	) {
		visitorLogger.warn("Can not walk:NO NERVOUS PELVIS CONNECTION");
		return false;
	}

	if (
		findConnection(body.state, "HEAD", "PELVIS", {
			validBlock: isNotBroken,
			shouldWalk: isBone,
		}).length == 0
	) {
		visitorLogger.warn("Can not walk: BROKEN SPINE");
		return false;
	}

	if (
		findConnection(body.state, "PELVIS", "LEFT_FOOT", {
			validBlock: isNervousSystemFine,
			shouldWalk: isNervousSystemConnection,
		}).length === 0
	) {
		visitorLogger.warn("Can not walk: NOT NERVOUS CONNECTION TO LL");
		return false;
	}

	if (
		findConnection(body.state, "PELVIS", "RIGHT_FOOT", {
			validBlock: isNervousSystemFine,
			shouldWalk: isNervousSystemConnection,
		}).length === 0
	) {
		visitorLogger.warn("Can not walk: LL broken");
		return false;
	}

	if (
		findConnection(body.state, "PELVIS", "LEFT_FOOT", {
			validBlock: isNotBroken,
			shouldWalk: isBone,
		}).length === 0
	) {
		visitorLogger.warn("Can not walk: NOT NERVOUS CONNECTION TO RL");
		return false;
	}

	if (
		findConnection(body.state, "PELVIS", "RIGHT_FOOT", {
			validBlock: isNotBroken,
			shouldWalk: isBone,
		}).length === 0
	) {
		visitorLogger.warn("Can not walk: RL broken");
		return false;
	}

	return true;
}

export function getPain(body: HumanBody): number {
	let pain = 0;
	body.state.blocks.forEach(block => {
		if (block.params.pain || 0 > pain) {
			pain = block.params.pain!;
		}
	});
	return pain;
}


