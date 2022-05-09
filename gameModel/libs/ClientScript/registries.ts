/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { ChemicalDefinition, buildPathology, ItemDefinition, PathologyDefinition, ActDefinition } from "./pathology";
import { Compensation, SympSystem } from "./physiologicalModel";

const pathologies: Record<string, PathologyDefinition> = {};
const items: Record<string, ItemDefinition> = {};
const acts: Record<string, ActDefinition> = {};
const chemicals: Record<string, ChemicalDefinition> = {};

let model: SympSystem = {};
let compensation: Compensation = {}


let initialized = false;

export function registerPathology(def: PathologyDefinition): void {
	pathologies[def.id] = def;
}

export function getPathology(id: string): PathologyDefinition | undefined {
	init();
	return pathologies[id];
}


export function getPathologies(): { label: string, value: string }[] {
	init();
	return Object.entries(pathologies).map(([id, p]) => ({
		value: id,
		label: p.name,
	}));
}

export function registerItem(def: ItemDefinition): void {
	items[def.id] = def;
}

export function getItem(id: string): ItemDefinition | undefined {
	init();
	return items[id];
}

export function getItems(): { id: string, item: ItemDefinition }[] {
	init();
	return Object.entries(items).map(([id, item]) => ({
		id: id,
		item: item,
	}));
}


export function registerAct(def: ActDefinition): void {
	acts[def.id] = def;
}

export function getAct(id: string): ActDefinition | undefined {
	init();
	return acts[id];
}

export function getActs(): ActDefinition[] {
	init();
	return Object.values(acts);
}


export function registerChemical(def: ChemicalDefinition): void {
	chemicals[def.id] = def;
}

export function getChemical(id: string): ChemicalDefinition | undefined {
	init();
	return chemicals[id];
}

export function getCompensationModel(): Compensation {
	return compensation;
}

export function setCompensationModel(c: Compensation) {
	compensation = c;
}

export function getSystemModel(): SympSystem {
	return model;
}

export function setSystemModel(m: SympSystem) {
	model = m;
}

function init() {
	if (initialized) {
		return;
	}
	initialized = true;

	////////////////////////////////////////
	// Pathologies
	////////////////////////////////////////
	registerPathology(buildPathology({
		id: 'full_ac',
		name: 'full arterial cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: 1,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'semi_ac',
		name: 'semi arterial cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: 0.5,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'quarter_ac',
		name: 'quarter arterial cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: 0.25,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: '20p_ac',
		name: '20% arterial cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: 0.2,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'tenth_ac',
		name: '10% arterial cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: 0.1,
		instantaneousBloodLoss: 0,
	}]));


// Venous

	registerPathology(buildPathology({
		id: 'full_vc',
		name: 'full venous cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: 1,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'semi_vc',
		name: 'semi venous cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: 0.5,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'quarter_vc',
		name: 'quarter venous cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: 0.25,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: '20p_vc',
		name: '20% venous cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: 0.2,
		instantaneousBloodLoss: 0,
	}]));

	registerPathology(buildPathology({
		id: 'tenth_vc',
		name: '10% venous cut, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: 0.1,
		instantaneousBloodLoss: 0,
	}]));


// internal


	registerPathology(buildPathology({
		id: 'tenth_ih',
		name: '10% internal Hemorrhage, no initial loss',
		blocks: ['LEFT_LEG', 'RIGHT_LEG', 'LEFT_THIGH', 'RIGHT_THIGH',
			'LEFT_ARM', 'LEFT_FOREARM', 'RIGHT_ARM', 'RIGHT_FOREARM',
			'NECK', 'THORAX', 'ABDOMEN', 'PELVIS'],
	}, [{
		type: 'Hemorrhage',
		subtype: 'internal',
		bleedingFactor: 0.1,
		instantaneousBloodLoss: 0,
	}]));



	registerPathology({
		id: 'half_strangle',
		name: "Strangulation 50%",
		blocks: ['HEAD', 'NECK'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'strangle',
				name: 'strangle',
				variablePatch: {},
				blockPatch: {
					pain: 2,
					airResistance: 0.5
				}
			}],
		handler: [],
		actions: [],
	});

	registerPathology({
		id: 'strangle',
		name: "Strangle",
		blocks: ['HEAD', 'NECK'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'strangle',
				name: 'strangle',
				variablePatch: {},
				blockPatch: {
					pain: 2,
					airResistance: 1
				}
			}],
		handler: [],
		actions: [],
	});

	registerPathology({
		id: 'flyMeToTheMoon',
		name: "Fly me to the Moon",
		blocks: ['HEAD', 'NECK'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'flyMeToTheMoon',
				name: 'flyMeToTheMoon',
				variablePatch: {},
				blockPatch: {
					fiO2: 0,
				}
			}],
		handler: [],
		actions: [],
	});


	registerPathology({
		id: 'k2',
		name: "Le k2 sans oxygène",
		blocks: ['HEAD', 'NECK'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'flyMeToTheMoon',
				name: 'flyMeToTheMoon',
				variablePatch: {},
				blockPatch: {
					fiO2: 0.21,
					atmosphericPressure: 250
				}
			}],
		handler: [],
		actions: [],
	});

	registerPathology({
		id: 'baseCamp',
		name: "Camp de base à 5k",
		blocks: ['HEAD', 'NECK'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'flyMeToTheMoon',
				name: 'flyMeToTheMoon',
				variablePatch: {},
				blockPatch: {
					fiO2: 0.21,
					atmosphericPressure: 400
				}
			}],
		handler: [],
		actions: [],
	});

	registerPathology({
		id: 'lung_r1',
		name: "Bronch resistance:100%",
		blocks: ['BRONCHUS_1', 'BRONCHUS_2'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'resistance',
				name: 'resistance',
				variablePatch: {},
				blockPatch: {
					pain: 3,
					airResistance: 1,
				}
			}],
		handler: [],
		actions: [],
	});



	registerPathology({
		id: 'lung_r1_5pm',
		name: "Bronch resistance:to 100%",
		blocks: ['BRONCHUS_1', 'BRONCHUS_2'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'resistance',
				name: 'resistance',
				variablePatch: {},
				blockPatch: {
					pain: 3,
					airResistanceDelta: 0.05,
				}
			}],
		handler: [],
		actions: [],
	});


	registerPathology({
		id: 'lung_c0',
		name: "Bronch compliance:0%",
		blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'comp',
				name: 'comp',
				variablePatch: {},
				blockPatch: {
					pain: 3,
					compliance: 0,
				}
			}],
		handler: [],
		actions: [],
	});


	registerPathology({
		id: 'cityHunter',
		name: "Coup de masse sur la tête",
		blocks: ['HEAD'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'cityHunter',
				name: 'cityHunter',
				variablePatch: {
					ICP_deltaPerMin: 1,
				},
				blockPatch: {
					pain: 5,
				}
			}],
		handler: [],
		actions: [],
	});


	registerPathology({
		id: 'throax_circ',
		name: "Circulaire Thorax",
		blocks: ['THORAX'],
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [
			{
				time: 0,
				id: 'burn',
				name: 'burn',
				variablePatch: {},
				blockPatch: {
					pain: 7,
					complianceDelta: -0.01
				}
			}],
		handler: [],
		actions: [],
	});

	////////////////////////////////////////
	// Chemicals
	////////////////////////////////////////

	registerChemical({
		id: 'TranexamicAcid',
		name: 'Acide tranexamique HL 3h',
		halflife_s: 10800,
	});

	registerChemical({
		id: 'TranexamicAcid_Clearance',
		name: 'Acide tranexamique [Cl]',
		clearance_mLperMin: 110,
		vd_LperKg: 0.35,
	});

	////////////////////////////////////////
	// Items
	////////////////////////////////////////
	registerItem({
		id: 'cat',
		name: "Tourniquet",
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "apply",
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_LEG', 'RIGHT_LEG',
					'LEFT_THIGH', 'RIGHT_THIGH',
					'LEFT_ARM', 'LEFT_FOREARM',
					'RIGHT_ARM', 'RIGHT_FOREARM',
					'NECK'],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup CAT',
						variablePatch: {},
						blockPatch: {
							'bloodFlow': false,
							'airResistance': 1,
						},
					}
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'bandage',
		name: "bandage",
		actions: {
			pack: {
				type: 'ActionBodyEffect',
				name: "pack",
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['ABDOMEN'],
				rules: [
					{
						id: 'doPack',
						time: 0,
						name: 'Packing',
						variablePatch: {},
						blockPatch: {
							venousBleedingReductionFactor: 0.5,
							arterialBleedingReductionFactor: 0.5,
							internalBleedingReductionFactor: 0,
						},
					}
				],
				createActions: [],
			},
			pressureBandage: {
				type: 'ActionBodyEffect',
				name: "pressureBandage",
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: [
					'LEFT_FOOT', 'RIGHT_FOOT',
					'LEFT_LEG', 'RIGHT_LEG',
					'LEFT_THIGH', 'RIGHT_THIGH',
					'LEFT_ARM', 'RIGHT_ARM',
					'LEFT_FOREARM', 'RIGHT_FOREARM',
					'NECK'],
				rules: [
					{
						id: 'pressureBandage',
						time: 0,
						name: 'Pressure Bandage',
						variablePatch: {},
						blockPatch: {
							venousBleedingReductionFactor: 0.70,
							arterialBleedingReductionFactor: 0.15,
							internalBleedingReductionFactor: 0,
						},
					}
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'israeliBandage',
		name: "IsraeliBandage",
		actions: {
			israeli: {
				type: 'ActionBodyEffect',
				name: 'apply',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: [
					'LEFT_FOOT', 'RIGHT_FOOT',
					'LEFT_LEG', 'RIGHT_LEG',
					'LEFT_THIGH', 'RIGHT_THIGH',
					'LEFT_ARM', 'RIGHT_ARM',
					'LEFT_FOREARM', 'RIGHT_FOREARM',
					'NECK'],
				rules: [
					{
						id: 'pressureBandage',
						time: 0,
						name: 'Packing',
						variablePatch: {},
						blockPatch: {
							venousBleedingReductionFactor: 0.9,
							arterialBleedingReductionFactor: 0.25,
						},
					}
				],
				createActions: [],
			}
		}
	});


	registerItem({
		id: 'TranexamicAcid_500',
		name: "TranexamicAcid_500",
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				name: 'inject',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM'],
				category: 'C',
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject potion',
						variablePatch: {},
						blockPatch: {
							chemicals: {
								'TranexamicAcid': {
									once: 500,
								}
							}
						}
					},
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'SalineSolution_1l',
		name: "Saline 1L",
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				name: 'Inject oneshot',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM'],
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject saline',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: 100,
						}
					},
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'Blood_1l',
		name: "Blood 1L",
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				name: 'fill (oneshot)',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM'],
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject blood',
						variablePatch: {},
						blockPatch: {
							bloodInput_oneShot: 1000,
						}
					},
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'TranexamicAcid_500_CL',
		name: "TranexamicAcid_500_CL",
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				name: 'inject (oneshot)',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM'],
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject potion',
						variablePatch: {},
						blockPatch: {
							chemicals: {
								'TranexamicAcid_Clearance': {
									once: 500,
								}
							}
						}
					},
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'mask',
		name: "mask",
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "apply",
				targetedObject: 'HumanBody',
				blocks: ['HEAD'],
				category: 'B',
				rules: [
					{
						id: 'mask',
						time: 0,
						name: 'mask',
						variablePatch: {
						},
						blockPatch: {
							fiO2: .65
						}
					}
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'tube',
		name: "tube",
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "intubate",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				rules: [
					{
						id: 'intubation',
						time: 0,
						name: 'intubate',
						variablePatch: {
						},
						blockPatch: {
							intubated: true
						}
					}
				],
				createActions: [],
			}
		}
	});

	registerItem({
		id: 'tTube',
		name: "tTube",
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: 'do surgery',
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['NECK'],
				rules: [
					{
						id: 'tracheostomy',
						time: 0,
						name: 'tracheostomy',
						variablePatch: {
						},
						blockPatch: {
							fiO2: .21
						}
					}
				],
				createActions: [],
			}
		}
	});

	//
	registerItem({
		id: 'oxymeter',
		name: "Pulse Oxymeter",
		actions: {
			measure: {
				type: 'ActionBodyMeasure',
				name: 'SpO2',
				category: 'C',
				targetedObject: 'HumanBody',
				metricName: ['vitals.respiration.SaO2'],
				formatter: ['PERCENT'],
			}
		}
	});

	registerItem({
		id: 'sphygmomanometer',
		name: "Blood Pressure gauge",
		actions: {
			measure: {
				category: 'C',
				type: 'ActionBodyMeasure',
				name: 'Measure MAP (mmHg)',
				targetedObject: 'HumanBody',
				metricName: ['vitals.cardio.MAP'],
				formatter: ['INT']
			}
		}
	});


	////////////////////////////////////////
	// Acts
	////////////////////////////////////////
	registerAct({
		id: 'recoveryPosition',
		name: "Recovery position",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'E',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'RECOVERY'
				}
			}],
			createActions: []
		}
	});

	registerAct({
		id: 'sitDown',
		name: "Sit down",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'E',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'SITTING'
				}
			}],
			createActions: []
		}
	});

	registerAct({
		id: 'proneDecubitus',
		name: "Prone decubitus",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'E',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'PRONE_DECUBITUS'
				}
			}],
			createActions: []
		}
	});


	registerAct({
		id: 'supineDecubitus',
		name: "Supine decubitus",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'E',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'SUPINE_DECUBITUS'
				}
			}],
			createActions: []
		}
	});

	registerAct({
		id: 'getUp',
		name: "Get UP",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'E',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'STANDING'
				}
			}],
			createActions: []
		}
	});


	// Acts : measure
	registerAct({
		id: 'measureRR',
		name: "Respiratory Rate",
		action: {
			category: 'B',
			type: 'ActionBodyMeasure',
			name: 'RR',
			targetedObject: 'HumanBody',
			metricName: ['vitals.respiration.rr'],
			formatter: ['INT'],
		}
	});

	registerAct({
		id: 'measureHR',
		name: "Heart Rate",
		action: {
			type: 'ActionBodyMeasure',
			name: 'HR',
			category: 'C',
			targetedObject: 'HumanBody',
			metricName: ['vitals.cardio.hr'],
			formatter: ['INT'],
		}
	});

	registerAct({
		id: 'measureCRT',
		name: "CRT",
		action: {
			type: 'ActionBodyMeasure',
			name: 'CRT',
			category: 'C',
			targetedObject: 'HumanBody',
			metricName: ['vitals.capillaryRefillTime_s'],
			formatter: ['.2'],
		}
	});

	registerAct({
		id: 'measureGCS',
		name: "GCS",
		action: {
			type: 'ActionBodyMeasure',
			name: 'GCS',
			category: 'D',
			targetedObject: 'HumanBody',
			metricName: ['vitals.glasgow.total', 'vitals.glasgow.eye', 'vitals.glasgow.verbal', 'vitals.glasgow.motor'],
		}
	});

	registerAct({
		id: 'canYouWalk',
		name: "Can you walk?",
		action: {
			type: 'ActionBodyMeasure',
			category: 'E',
			name: 'walk',
			targetedObject: 'HumanBody',
			metricName: ['vitals.canWalk'],
		}
	});

	registerAct({
		id: 'areYouDead?',
		name: "Are you dead?",
		action: {
			category: 'Z',
			type: 'ActionBodyMeasure',
			name: 'dead',
			targetedObject: 'HumanBody',
			metricName: ['vitals.cardiacArrest'],
		}
	});
}

