/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import {extBlocks} from "./HUMAn";
import {ChemicalDefinition, buildPathology, ItemDefinition, PathologyDefinition, ActDefinition} from "./pathology";
import {Compensation, SympSystem} from "./physiologicalModel";

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

export function getPathologies(): {label: string, value: string}[] {
	init();
	return Object.entries(pathologies).map(([id, p]) => ({
		value: id,
		label: p.name,
	}));
}

export function getPathologiesMap(): Record<string, string> {
	init();
	return Object.entries(pathologies).reduce<Record<string, string>>((bag, [id, {name}]) => {
		bag[id] = name;
		return bag;
	}, {});
}


export function registerItem(def: ItemDefinition): void {
	items[def.id] = def;
}

export function getItem(id: string): ItemDefinition | undefined {
	init();
	return items[id];
}

export function getItems(): {id: string, item: ItemDefinition}[] {
	init();
	return Object.entries(items).map(([id, item]) => ({
		id: id,
		item: item,
	}));
}


export function registerAct(def: ActDefinition): void {
	acts[def.id] = def;
}

export function getAct(id?: string): ActDefinition | undefined {
	if (!id){
		return undefined;
	}

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
		id: 'full_ah',
		name: 'full arterial cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: {min: 1},
		//instantaneousBloodLoss: {min: 1},
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'semi_ah',
		name: 'semi arterial cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: {min: 0.5},
		//instantaneousBloodLoss: {min: 0},
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'quarter_ah',
		name: 'quarter arterial cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: {min: 0.25},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: '20p_ah',
		name: '20% arterial cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: {min: 0.2},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'tenth_ah',
		name: '10% arterial cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'arterial',
		bleedingFactor: {min: 0.1},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));


	// Venous

	registerPathology(buildPathology({
		id: 'full_vh',
		name: 'full venous cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: {min: 1},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'semi_vh',
		name: 'semi venous cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: {min: 0.5},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'quarter_vh',
		name: 'quarter venous cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: {min: 0.25},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: '20p_vh',
		name: '20% venous cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: {min: 0.2},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	registerPathology(buildPathology({
		id: 'tenth_vh',
		name: '10% venous cut, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'venous',
		bleedingFactor: {min: 0.1},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));


	// internal
	registerPathology(buildPathology({
		id: 'tenth_ih',
		name: '10% internal Hemorrhage, no initial loss',
		blockSelectionMode: 'any',
	}, [{
		type: 'Hemorrhage',
		subtype: 'internal',
		bleedingFactor: {min: 0.1},
		//instantaneousBloodLoss: 0,
		blocks: [...extBlocks],
	}]));

	/**
	 * Respiration
	 */

	registerPathology(buildPathology({
		id: 'half_strangle',
		name: "Strangulation 50%",
		blockSelectionMode: 'any',
	}, [{
		type: 'AirwaysResistance',
		blocks: ['NECK', 'HEAD', 'BRONCHUS_1', 'BRONCHUS_2'],
		airResistance: {min: 0.5},
	}]));

	registerPathology(buildPathology({
		id: 'strangle',
		name: "Strangle",
		blockSelectionMode: 'any',
	}, [{
		type: 'AirwaysResistance',
		blocks: ['NECK', 'HEAD', 'BRONCHUS_1', 'BRONCHUS_2'],
		airResistance: {min: 1},
	}]));

	registerPathology(buildPathology({
		id: 'lung_r1_5pm',
		name: "Bronch resistance:to 100%",
		blockSelectionMode: 'any',
	}, [{
		type: 'AirwaysResistance',
		blocks: ['BRONCHUS_1', 'BRONCHUS_2'],
		airResistanceDelta: {min: 0.05}
	}]));


	registerPathology(buildPathology({
		id: 'upper_airways_burn',
		name: "Upper airways burn",
		blockSelectionMode: 'any',
	}, [{
		type: 'AirwaysResistance',
		blocks: ['NECK'],
		airResistanceDelta: {min: 0.05}
	}, {
		type: 'Burn',
		blocks: ['HEAD'],
		level: '2',
		percent: {min: 0.5},
	}]));



	registerPathology(buildPathology({
		id: 'simple_pno_full',
		name: "Simple pneumothorax full",
		blockSelectionMode: 'any',
	}, [
		{
			type: 'Pneumothorax',
			blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
			pneumothoraxType: 'SIMPLE',
			compliance: {min: 0}
		}, {
			type: 'Hemorrhage',
			blocks: ["THORAX"],
			subtype: 'venous',
			instantaneousBloodLoss: {min: 50}
		}, {
			type: 'Fracture',
			blocks: ["THORAX"],
			fractureType: 'nonDisplaced',
		}
	],
		[
			[['UNIT_BRONCHUS_1'], ['THORAX'], ['THORAX']],
			[['UNIT_BRONCHUS_2'], ['THORAX'], ['THORAX']],
		]
	));


	registerPathology(buildPathology({
		id: 'open_pno_full',
		name: "Open pneumothorax full",
		blockSelectionMode: 'any',
	}, [
		{
			type: 'Pneumothorax',
			blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
			pneumothoraxType: 'OPEN',
			compliance: {min: 0}
		}, {
			type: 'Hemorrhage',
			blocks: ["THORAX"],
			subtype: 'venous',
			instantaneousBloodLoss: {min: 150}
		}, {
			type: 'Fracture',
			blocks: ["THORAX"],
			fractureType: 'displaced',
		}
	],
		[
			[['UNIT_BRONCHUS_1'], ['THORAX'], ['THORAX']],
			[['UNIT_BRONCHUS_2'], ['THORAX'], ['THORAX']],
		]
	));


	registerPathology(buildPathology({
		id: 'cityHunter',
		name: "Coup de masse sur la tête",
		blockSelectionMode: 'any',
	}, [{
		type: 'ICP',
		delta_perMin: {min: 1},
		blocks: ['HEAD'],
	}]
	));


	registerPathology(buildPathology({
		id: 'thorax_circ',
		name: "Circumferential Thorax Burn",
		blockSelectionMode: "any",
	},
		[{
			type: 'Burn',
			blocks: ['THORAX'],
			level: '3',
			percent: {min: 1},
		}]
	));

	registerPathology(buildPathology({
		id: 'tamponade_slow',
		name: "Tamponade +5ml/min",
		blockSelectionMode: 'any',
	}, [{
		type: 'Tamponade',
		blocks: ['HEART'],
		pericardial_deltaMin: {min: 5},
	}]));


	registerPathology(buildPathology({
		id: 'tamponade_mild',
		name: "Tamponade +10ml/min",
		blockSelectionMode: 'any',
	}, [{
		type: 'Tamponade',
		blocks: ['HEART'],
		pericardial_deltaMin: {min: 10},
	}]));


	registerPathology(buildPathology({
		id: 'tamponade_hard',
		name: "Tamponade +50ml/min",
		blockSelectionMode: 'any',
	}, [{
		type: 'Tamponade',
		blocks: ['HEART'],
		pericardial_deltaMin: {min: 50},
	}]));


	registerPathology(buildPathology({
		id: 'disclocation_c1c2',
		name: "Dislocation C1/C2",
		blockSelectionMode: 'any',
	}, [{
		type: 'NervousSystem',
		blocks: ['C1-C4'],
	}]));


	registerPathology(buildPathology({
		id: 'disclocation_c5c7',
		name: "Dislocation C5/C7",
		blockSelectionMode: 'any',
	}, [{
		type: 'NervousSystem',
		blocks: ['C5-C7'],
	}]));


	registerPathology(buildPathology({
		id: 'disclocation_t1l4',
		name: "Dislocation T1/T4",
		blockSelectionMode: 'any',
	}, [{
		type: 'NervousSystem',
		blocks: ['T1-L4'],
	}]));



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
	// Items & Acts
	////////////////////////////////////////

	// Airways
	////////////////////////////////////////
	registerAct({
		id: 'recoveryPosition',
		name: "Recovery position",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'A',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'RECOVERY'
				}
			}],
			createActions: [],
			duration: {low_skill: 0, high_skill: 0, },
		}
	});

	registerItem({
		id: 'guedel',
		name: "Guedel",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "setup",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {
						},
						blockPatch: {
							intubated: true
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'wendel',
		name: "Wendel",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "setup",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {
						},
						blockPatch: {
							intubated: true
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	registerItem({
		id: 'igel',
		name: "I-Gel",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "setup",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {
						},
						blockPatch: {
							intubated: true
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	registerItem({
		id: 'mask',
		name: "Mask",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "ventilate",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['HEAD'],
				rules: [
					{
						id: 'ventilate',
						time: 0,
						name: 'ventilate',
						variablePatch: {
						},
						blockPatch: {
							fiO2: 0.65
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'balloon',
		name: "Balloon",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "ventilate",
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['HEAD'],
				rules: [
					{
						id: 'ventilate',
						time: 0,
						name: 'ventilate',
						variablePatch: {
							positivePressure: true,
						},
						blockPatch: {
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'intubate',
		name: "intubate",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: '',
				category: 'A',
				targetedObject: 'HumanBody',
				blocks: ['NECK'],
				rules: [
					{
						id: 'intubate',
						time: 0,
						name: 'intubate',
						variablePatch: {
						},
						blockPatch: {
							fiO2: .21
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	registerItem({
		id: 'cricotomie',
		name: "Cricotomie",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: '',
				category: 'A',
				targetedObject: 'HumanBody',
				blocks: ['NECK'],
				rules: [
					{
						id: 'cricotomie',
						time: 0,
						name: 'cricotomie',
						variablePatch: {
						},
						blockPatch: {
							fiO2: .21
						}
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	// Breathing
	////////////////////////////////////////
	registerItem({
		id: '3side',
		name: "3 sided dressing",
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				name: "apply",
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX'],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {},
						blockPatch: {
							// something: true,
						},
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'exsufflation',
		name: "Exsufflation",
		disposable: true,
		actions: {
			do: {
				type: 'ActionBodyEffect',
				name: "do",
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX'],
				rules: [
					{
						id: 'do',
						time: 0,
						name: 'do',
						variablePatch: {},
						blockPatch: {
							internalPressure: 'RESET',
						},
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'thoracic_drain',
		name: "Thoracic Drainage",
		disposable: true,
		actions: {
			drain: {
				type: 'ActionBodyEffect',
				name: "drain",
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX'],
				rules: [
					{
						id: 'drain',
						time: 0,
						name: 'drain',
						variablePatch: {},
						blockPatch: {
							internalPressure: 'DRAIN',
						},
					}
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerAct({
		id: 'measureRR',
		name: "Respiratory Rate",
		action: {
			category: 'B',
			type: 'ActionBodyMeasure',
			name: 'RR',
			targetedObject: 'HumanBody',
			metricName: ['vitals.respiration.rr'],
			duration: {low_skill: 0, high_skill: 0, },
		}
	});


	// Circulation
	////////////////////////////////////////
	registerItem({
		id: 'cat',
		name: "CAT",
		disposable: true,
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
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'bandage',
		name: "Bandage",
		disposable: true,
		actions: {
			pack: {
				type: 'ActionBodyEffect',
				name: "Packing",
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
				duration: {low_skill: 0, high_skill: 0, },
			},
			pressureBandage: {
				type: 'ActionBodyEffect',
				name: "Pressure Bandage",
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
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'israeliBandage',
		name: "Israeli Bandage",
		disposable: true,
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
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	registerItem({
		id: 'TranexamicAcid_500',
		name: "Tranexamic Acid 500mg",
		disposable: true,
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
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'SalineSolution_1l',
		name: "Saline 1L",
		disposable: true,
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
					}, {
						id: 'empty',
						time: 600,
						name: '',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: -100,
						}
					},
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'SalineSolution_100ml',
		name: "NaCl 0.9% 100mL",
		disposable: true,
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
						name: 'inject',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: 100,
						}
					}, {
						id: 'empty',
						time: 60,
						name: '',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: -100,
						}
					},
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'Blood_1l',
		name: "Blood 1L",
		disposable: true,
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
							bloodInput_mLperMin: 100,
						}
					}, {
						id: 'empty',
						time: 600,
						name: '',
						variablePatch: {},
						blockPatch: {
							bloodInput_mLperMin: -100,
						}
					},
				],
				createActions: [],
				duration: {low_skill: 0, high_skill: 0, },
			}
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
			duration: {low_skill: 15, high_skill: 5, },
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
			duration: {low_skill: 0, high_skill: 0, },
		}
	});

	// Disabilities
	////////////////////////////////////////

	registerAct({
		id: 'measureGCS',
		name: "GCS",
		action: {
			type: 'ActionBodyMeasure',
			name: 'GCS',
			category: 'D',
			targetedObject: 'HumanBody',
			metricName: ['vitals.glasgow.total', 'vitals.glasgow.eye', 'vitals.glasgow.verbal', 'vitals.glasgow.motor'],
			duration: {low_skill: 0, high_skill: 0, },
		}
	});

	// Etc
	////////////////////////////////////////
	registerAct({
		id: 'canYouWalk',
		name: "Can you walk?",
		action: {
			type: 'ActionBodyMeasure',
			category: 'E',
			name: 'walk',
			targetedObject: 'HumanBody',
			metricName: ['vitals.canWalk'],
			duration: {low_skill: 0, high_skill: 0, },
		}
	});

	////////////////////////////////////////
	// Old Items
	////////////////////////////////////////

	//
	registerItem({
		id: 'oxymeter',
		name: "Pulse Oxymeter",
		disposable: false,
		actions: {
			measure: {
				type: 'ActionBodyMeasure',
				name: 'SpO2',
				category: 'B',
				targetedObject: 'HumanBody',
				metricName: ['vitals.respiration.SaO2'],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});

	registerItem({
		id: 'sphygmomanometer',
		name: "Blood Pressure gauge",
		disposable: false,
		actions: {
			measure: {
				category: 'C',
				type: 'ActionBodyMeasure',
				name: 'MAP (mmHg)',
				targetedObject: 'HumanBody',
				metricName: ['vitals.cardio.MAP'],
				duration: {low_skill: 0, high_skill: 0, },
			}
		}
	});


	// Etc
	////////////////////////////////////////


	registerAct({
		id: 'sitDown',
		name: "Sit down",
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			name: 'move',
			blocks: [],
			category: 'Z',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'SITTING'
				}
			}],
			createActions: [],
			duration: {low_skill: 0, high_skill: 0, },
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
			category: 'Z',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'PRONE_DECUBITUS'
				}
			}],
			createActions: [],
			duration: {low_skill: 0, high_skill: 0, },
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
			category: 'Z',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'SUPINE_DECUBITUS'
				}
			}],
			createActions: [],
			duration: {low_skill: 0, high_skill: 0, },
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
			category: 'Z',
			rules: [{
				id: '',
				name: '',
				time: 0,
				blockPatch: {},
				variablePatch: {
					bodyPosition: 'STANDING'
				}
			}],
			createActions: [],
			duration: {low_skill: 0, high_skill: 0, },
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
			duration: {low_skill: 0, high_skill: 0, },
		}
	});
}

