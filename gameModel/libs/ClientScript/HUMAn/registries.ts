/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { extBlocks, ExternalBlock, simpleFractureBonesBlocks } from './human';
import {
	ChemicalDefinition,
	buildPathology,
	ItemDefinition,
	PathologyDefinition,
	ActDefinition,
} from './pathology';
import { Compensation, SympSystem } from './physiologicalModel';
import { substraction } from '../tools/helper';

const pathologies: Record<string, PathologyDefinition> = {};
const items: Record<string, ItemDefinition> = {};
const acts: Record<string, ActDefinition> = {};
const chemicals: Record<string, ChemicalDefinition> = {};

let model: SympSystem = {};
let compensation: Compensation | undefined = undefined;
let overdrive: Compensation | undefined = undefined;

let initialized = false;

function registerPathology(def: PathologyDefinition): void {
	pathologies[def.id] = def;
}

export function getPathology(id: string): PathologyDefinition | undefined {
	init();
	return pathologies[id];
}

export function getPathologies(): { label: string; value: string }[] {
	init();
	return Object.entries(pathologies).map(([id, p]) => ({
		value: id,
		label: p.name,
	}));
}

export function getPathologiesMap(): Record<string, string> {
	init();
	return Object.entries(pathologies).reduce<Record<string, string>>((bag, [id, { name }]) => {
		bag[id] = name;
		return bag;
	}, {});
}

function registerItem(def: Omit<ItemDefinition, 'type' | 'translationGroup'>): void {
	items[def.id] = { ...def, type: 'item', translationGroup: 'human-items' };
}

export function getItem(id: string): ItemDefinition | undefined {
	init();
	return items[id];
}

export function getItems(): { id: string; item: ItemDefinition }[] {
	init();
	return Object.entries(items).map(([id, item]) => ({
		id: id,
		item: item,
	}));
}

function registerAct(def: Omit<ActDefinition, 'type' | 'translationGroup'>): void {
	acts[def.id] = { ...def, type: 'act', translationGroup: 'human-actions' };
}

export function getAct(id?: string): ActDefinition | undefined {
	if (!id) {
		return undefined;
	}

	init();
	return acts[id];
}

export function getActs(): ActDefinition[] {
	init();
	return Object.values(acts);
}

function registerChemical(def: Omit<ChemicalDefinition, 'type' | 'translationGroup'>): void {
	chemicals[def.id] = { ...def, type: 'chemical', translationGroup: 'human-chemicals' };
}

export function getChemical(id: string): ChemicalDefinition | undefined {
	init();
	return chemicals[id];
}

export function getCompensationModel(): Compensation | undefined {
	return compensation;
}

export function setCompensationModel(c: Compensation) {
	compensation = c;
}


export function getOverdriveModel(): Compensation | undefined {
	return overdrive;
}

export function setOverdriveModel(c: Compensation) {
	overdrive = c;
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

	// const arterialBlocks = substraction<ExternalBlock>(extBlocks, ['HEAD', 'ABDOMEN', 'PELVIS']);

	const extremities: ExternalBlock[] =
		[
			"LEFT_ELBOW", "LEFT_FOREARM", "LEFT_WRIST", "LEFT_HAND",
			"RIGHT_ELBOW", "RIGHT_FOREARM", "RIGHT_WRIST", "RIGHT_HAND",
			"LEFT_ANKLE", "LEFT_FOOT",
			"RIGHT_ANKLE", "RIGHT_FOOT",
		];

	const venousBlocks = substraction<ExternalBlock>(extBlocks, ['HEAD', 'ABDOMEN', 'PELVIS']);
	////////////////////////////////////////
	// Pathologies
	////////////////////////////////////////
	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ah',
				name: 'catastrophic arterial hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.25, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ah__2',
				name: 'catastrophic arterial hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.85, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ah',
				name: 'severe arterial hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.08, max: 0.25 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ah__2',
				name: 'severe arterial hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.17, max: 0.85 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'urgent_ah',
				severity: 'urgent',
				name: 'urgent arterial hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.06, max: 0.3 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_ARM',
						'RIGHT_ARM',
					],
				},
			],
		),
	);


	registerPathology(
		buildPathology(
			{
				id: 'minor_ah',
				severity: 'non_urgent',
				name: 'minor arterial hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.0001, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: extremities,
				},
			],
		),
	);




	// Venous
	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_vh',
				name: 'catastrophic venous hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.25, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_vh__2',
				name: 'catastrophic venous hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.85, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_vh',
				name: 'severe venous hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.08, max: 0.25 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_vh__2',
				name: 'severe venous hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.17, max: 0.85 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'test_vh',
				severity: 'immediate',
				name: 'severe venous hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: venousBlocks,
				},
			],
		),
	);



	registerPathology(
		buildPathology(
			{
				id: 'urgent_vh',
				severity: 'urgent',
				name: 'moderate venous hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.06, max: 0.3 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_ARM',
						'RIGHT_ARM',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'minor_vh',
				severity: 'non_urgent',
				name: 'minor venous hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.001, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: extremities,
				},
			],
		),
	);

	// internal
	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ih',
				severity: 'dead',
				name: 'catastrophic internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.075, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ih',
				severity: 'immediate',
				name: 'severe internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0135, max: 0.075 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'urgent_ih',
				severity: 'urgent',
				name: 'urgent internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0036, max: 0.135 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'minor_ih',
				severity: 'non_urgent',
				name: 'minor internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0001, max: 0.0036 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	/**
	 * Respiration
	 */

	/*registerPathology(
		buildPathology(
			{
				id: 'half_strangle',
				name: 'Strangulation 50%',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK', 'HEAD'],
					airResistance: { min: 0.5, max: 0.5 },
					airResistanceDelta: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'strangle',
				name: 'Strangle',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK', 'HEAD'],
					airResistance: { min: 1, max: 1 },
					airResistanceDelta: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'lung_r1_5pm',
				name: 'Bronch resistance:to 100%',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['BRONCHUS_1', 'BRONCHUS_2'],
					airResistanceDelta: { min: 0.05, max: 0.05 },
					airResistance: undefined,
				},
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'upper_airways_burn',
				severity: 'urgent',
				name: 'Upper airways burn',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK'],
					airResistanceDelta: { min: 0.01, max: 0.1 },
					airResistance: undefined,
				},
				{
					type: 'Burn',
					blocks: ['HEAD'],
					level: '2',
					percent: { min: 0.25, max: 0.6 },
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'simple_pno_full',
				name: 'Simple pneumothorax full',
				severity: 'non_urgent',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Pneumothorax',
					blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
					pneumothoraxType: 'SIMPLE',
					compliance: { min: 0, max: 0 },
					complianceDelta: undefined,
				},
				{
					type: 'Hemorrhage',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					subtype: 'venous',
					instantaneousBloodLoss: { min: 0, max: 60 },
					bleedingFactor: undefined,
				},
				{
					type: 'Fracture',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					fractureType: 'nonDisplaced',
				},
			],
			[
				[['UNIT_BRONCHUS_1'], ['THORAX_LEFT'], ['THORAX_LEFT']],
				[['UNIT_BRONCHUS_2'], ['THORAX_RIGHT'], ['THORAX_RIGHT']],
			],
		),
	);

/*
	registerPathology(
		buildPathology(
			{
				id: 'open_pno_full',
				name: 'Open pneumothorax full',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Pneumothorax',
					blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
					pneumothoraxType: 'OPEN',
					compliance: { min: 0, max: 0 },
					complianceDelta: undefined,
				},
				{
					type: 'Hemorrhage',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					subtype: 'venous',
					instantaneousBloodLoss: { min: 100, max: 200 },
					bleedingFactor: undefined,
				},
				{
					type: 'Fracture',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					fractureType: 'displaced',
				},
			],
			[
				[['UNIT_BRONCHUS_1'], ['THORAX_LEFT'], ['THORAX_LEFT']],
				[['UNIT_BRONCHUS_2'], ['THORAX_RIGHT'], ['THORAX_RIGHT']],
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'cranialTrauma',
				severity: 'immediate',
				name: 'cranial trauma with hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'ICP',
					blocks: ['HEAD'],
					delta_perMin: { min: 0.05, max: 2 },
					icp_mmHg: undefined,
				},
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					blocks: ['HEAD'],
					bleedingFactor: undefined,
					instantaneousBloodLoss: { min: 1, max: 150 },
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'thorax_circ',
				severity: 'immediate',
				name: 'Circumferential Thorax Burn',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Burn',
					blocks: ['THORAX_LEFT'],
					level: '3',
					percent: { min: 1, max: 1 },
				},
				{
					type: 'Burn',
					blocks: ['THORAX_RIGHT'],
					level: '3',
					percent: { min: 1, max: 1 },
				},
			],
		),
	);

	/*registerPathology(
		buildPathology(
			{
				id: 'tamponade_slow',
				name: 'Tamponade Light',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 0.1, max: 5 },
					pericardial_mL: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'tamponade_mild',
				name: 'Tamponade Mild',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 5, max: 25 },
					pericardial_mL: undefined,
				},
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'tamponade_hard',
				severity: 'immediate',
				name: 'Tamponade',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 0.1, max: 50 },
					pericardial_mL: undefined,
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_c1c2',
				severity: 'dead',
				name: 'Dislocation C1/C2',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['C1-C4'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_c5c7',
				severity: 'non_urgent',
				name: 'Dislocation C5/C7',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['C5-C7'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_t1l4',
				severity: 'non_urgent',
				name: 'Dislocation T1/T4',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['T1-T4'],
				},
			],
		),
	);

	registerPathology(buildPathology({
		id: 'fracture_simple',
		severity: 'non_urgent',
		name: 'fracture non-displaced',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'nonDisplaced',
		},
		{
			type: 'Hemorrhage',
			subtype: 'internal',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0, max: 0.5
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	registerPathology(buildPathology({
		id: 'fracture_displaced',
		name: 'fracture displaced',
		severity: 'non_urgent',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'displaced',
		},
		{
			type: 'Hemorrhage',
			subtype: 'internal',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0.5, max: 1
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	registerPathology(buildPathology({
		id: 'fracture_open',
		severity: 'non_urgent',
		name: 'fracture open & displaced',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'displaced',
		},
		{
			type: 'Hemorrhage',
			subtype: 'venous',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0, max: 1
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	////////////////////////////////////////
	// Chemicals
	////////////////////////////////////////

	registerChemical({
		id: 'TranexamicAcid',
		//name: 'Acide tranexamique HL 3h',
		halflife_s: 10800,
	});

	registerChemical({
		id: 'TranexamicAcid_Clearance',
		//name: 'Acide tranexamique [Cl]',
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
		priority: 0,
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			visible: false,
			blocks: [],
			category: 'A',
			rules: [
				{
					id: '',
					name: '',
					time: 0,
					blockPatch: {},
					variablePatch: {
						bodyPosition: 'RECOVERY',
					},
				},
			],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'openAirways',
		priority: 100,
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			visible: false,
			blocks: [],
			category: 'A',
			rules: [],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerItem({
		id: 'guedel',
		//name: 'Guedel',
		priority: 1000,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				visible: true,
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {},
						blockPatch: {
							intubated: true,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'wendel',
		//name: 'Wendel',
		priority: 1000,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				visible: true,
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {},
						blockPatch: {
							intubated: true,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'igel',
		//name: 'I-Gel',
		priority: 1000,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['NECK'],
				visible: true,
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {},
						blockPatch: {
							intubated: true,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'mask',
		//name: 'Mask',
		priority: 1000,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['HEAD'],
				visible: true,
				rules: [
					{
						id: 'ventilate',
						time: 0,
						name: 'ventilate',
						variablePatch: {},
						blockPatch: {
							fiO2: 0.65,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'balloon',
		//name: 'Balloon',
		priority: 1000,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				category: 'A',
				blocks: ['HEAD'],
				visible: true,
				rules: [
					{
						id: 'ventilate',
						time: 0,
						name: 'ventilate',
						variablePatch: {
							positivePressure: true,
						},
						blockPatch: {},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'intubate',
		priority: 1000,
		//name: 'intubate',
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				category: 'A',
				targetedObject: 'HumanBody',
				blocks: ['NECK'],
				visible: true,
				rules: [
					{
						id: 'intubate',
						time: 0,
						name: 'intubate',
						variablePatch: {},
						blockPatch: {
							fiO2: 0.21,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'cricotomie',
		priority: 1000,
		//name: 'Cricotomie',
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				category: 'A',
				targetedObject: 'HumanBody',
				blocks: ['NECK'],
				visible: true,
				rules: [
					{
						id: 'cricotomie',
						time: 0,
						name: 'cricotomie',
						variablePatch: {},
						blockPatch: {
							fiO2: 0.21,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	// Breathing
	////////////////////////////////////////
	registerItem({
		id: '3side',
		priority: 1000,
		//name: '3 sided dressing',
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
				visible: true,
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup',
						variablePatch: {},
						blockPatch: {
							// something: true,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'exsufflation',
		priority: 1000,
		//name: 'Exsufflation',
		disposable: true,
		actions: {
			do: {
				type: 'ActionBodyEffect',
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
				visible: false,
				rules: [
					{
						id: 'do',
						time: 0,
						name: 'do',
						variablePatch: {},
						blockPatch: {
							internalPressure: 'RESET',
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'thoracic_drain',
		priority: 1000,
		//name: 'Thoracic Drainage',
		disposable: true,
		actions: {
			drain: {
				type: 'ActionBodyEffect',
				category: 'B',
				targetedObject: 'HumanBody',
				blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
				visible: true,
				rules: [
					{
						id: 'drain',
						time: 0,
						name: 'drain',
						variablePatch: {},
						blockPatch: {
							internalPressure: 'DRAIN',
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerAct({
		id: 'measureRR',
		priority: 0,
		//name: 'Respiratory Rate',
		action: {
			category: 'B',
			type: 'ActionBodyMeasure',
			targetedObject: 'HumanBody',
			metricName: ['vitals.respiration.rr'],
			duration: { low_skill: 15, high_skill: 15 },
		},
	});

registerItem({
		id: 'oxymeter',
		//name: 'Pulse Oxymeter',
		priority: 100,
		disposable: false,
		actions: {
			measure: {
				type: 'ActionBodyMeasure',
				category: 'B',
				targetedObject: 'HumanBody',
				metricName: ['vitals.respiration.SpO2'],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});


	// Circulation
	////////////////////////////////////////
	registerItem({
		id: 'cat',
		//name: 'CAT',
		priority: 0,
		disposable: true,
		actions: {
			setup: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				visible: true,
				blocks: [
					'LEFT_LEG',
					'RIGHT_LEG',
					'LEFT_THIGH',
					'RIGHT_THIGH',
					'LEFT_ARM',
					'LEFT_FOREARM',
					'RIGHT_ARM',
					'RIGHT_FOREARM',
					'NECK',
				],
				rules: [
					{
						id: 'setup',
						time: 0,
						name: 'setup CAT',
						variablePatch: {},
						blockPatch: {
							bloodFlow: false,
							airResistance: 1,
							pain: 5,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'bandage',
		//name: 'Bandage',
		priority: 200,
		disposable: true,
		actions: {
			pack: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['ABDOMEN'],
				visible: true,
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
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
			pressureBandage: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				visible: true,
				blocks: [
					'LEFT_FOOT',
					'RIGHT_FOOT',
					'LEFT_ANKLE',
					'RIGHT_ANKLE',
					'LEFT_LEG',
					'RIGHT_LEG',
					'LEFT_KNEE',
					'RIGHT_KNEE',
					'LEFT_THIGH',
					'RIGHT_THIGH',
					'LEFT_HAND',
					'RIGHT_HAND',
					'LEFT_WRIST',
					'RIGHT_WRIST',
					'LEFT_ELBOW',
					'RIGHT_ELBOW',
					'LEFT_ARM',
					'RIGHT_ARM',
					'LEFT_SHOULDER',
					'RIGHT_SHOULDER',
					'LEFT_FOREARM',
					'RIGHT_FOREARM',
					'NECK',
					'HEAD',
				],
				rules: [
					{
						id: 'pressureBandage',
						time: 0,
						name: 'Pressure Bandage',
						variablePatch: {},
						blockPatch: {
							venousBleedingReductionFactor: 0.7,
							arterialBleedingReductionFactor: 0.15,
							internalBleedingReductionFactor: 0,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'israeliBandage',
		priority: 100,
		//name: 'Israeli Bandage',
		disposable: true,
		actions: {
			israeli: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				visible: true,
				blocks: [
					'LEFT_FOOT',
					'RIGHT_FOOT',
					'LEFT_ANKLE',
					'RIGHT_ANKLE',
					'LEFT_LEG',
					'RIGHT_LEG',
					'LEFT_KNEE',
					'RIGHT_KNEE',
					'LEFT_THIGH',
					'RIGHT_THIGH',
					'LEFT_HAND',
					'RIGHT_HAND',
					'LEFT_WRIST',
					'RIGHT_WRIST',
					'LEFT_ELBOW',
					'RIGHT_ELBOW',
					'LEFT_ARM',
					'RIGHT_ARM',
					'LEFT_SHOULDER',
					'RIGHT_SHOULDER',
					'LEFT_FOREARM',
					'RIGHT_FOREARM',
					'NECK',
					'HEAD',
				],
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
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'TranexamicAcid_500',
		//name: 'Tranexamic Acid 500mg',
		priority: 1000,
		disposable: true,
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				targetedObject: 'HumanBody',
				visible: false,
				blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
				category: 'C',
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject potion',
						variablePatch: {},
						blockPatch: {
							chemicals: {
								TranexamicAcid: {
									once: 500,
								},
							},
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'SalineSolution_1l',
		priority: 500,
		//name: 'NaCl 0.9% 1L',
		disposable: true,
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				visible: true,
				blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject saline',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: 100,
						},
					},
					{
						id: 'empty',
						time: 600,
						name: '',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: -100,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'SalineSolution_100ml',
		//name: 'NaCl 0.9% 100mL',
		priority: 500,
		disposable: true,
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
				visible: true,
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: 100,
						},
					},
					{
						id: 'empty',
						time: 60,
						name: '',
						variablePatch: {},
						blockPatch: {
							salineSolutionInput_mLperMin: -100,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerItem({
		id: 'Blood_1l',
		//name: 'Blood 1L',
		priority: 600,
		disposable: true,
		actions: {
			inject: {
				type: 'ActionBodyEffect',
				category: 'C',
				targetedObject: 'HumanBody',
				blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
				visible: true,
				rules: [
					{
						id: 'inject',
						time: 0,
						name: 'inject blood',
						variablePatch: {},
						blockPatch: {
							bloodInput_mLperMin: 100,
						},
					},
					{
						id: 'empty',
						time: 600,
						name: '',
						variablePatch: {},
						blockPatch: {
							bloodInput_mLperMin: -100,
						},
					},
				],
				createActions: [],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	registerAct({
		id: 'measureHR',
		priority: 0,
		//name: 'Heart Rate',
		action: {
			type: 'ActionBodyMeasure',
			category: 'C',
			targetedObject: 'HumanBody',
			metricName: ['vitals.cardio.hr'],
			duration: { low_skill: 15, high_skill: 10 },
		},
	});

	registerAct({
		id: 'measureCRT',
		priority: 10,
		//name: 'CRT',
		action: {
			type: 'ActionBodyMeasure',
			category: 'C',
			targetedObject: 'HumanBody',
			metricName: ['vitals.capillaryRefillTime_s'],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerItem({
		id: 'sphygmomanometer',
		//name: 'Blood Pressure gauge',
		priority: 20,
		disposable: false,
		actions: {
			measure: {
				category: 'C',
				type: 'ActionBodyMeasure',
				targetedObject: 'HumanBody',
				metricName: ['vitals.cardio.MAP'],
				duration: { low_skill: 0, high_skill: 0 },
			},
		},
	});

	// Disabilities
	////////////////////////////////////////

	registerAct({
		id: 'measureGCS',
		//name: 'GCS',
		priority: 0,
		action: {
			type: 'ActionBodyMeasure',
			category: 'D',
			targetedObject: 'HumanBody',
			metricName: [
				'vitals.glasgow.total',
				'vitals.glasgow.eye',
				'vitals.glasgow.verbal',
				'vitals.glasgow.motor',
			],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'measureMotricity',
		//name: 'GCS',
		priority: 10,
		action: {
			type: 'ActionBodyMeasure',
			category: 'D',
			targetedObject: 'HumanBody',
			metricName: [
				'vitals.motricity.leftArm',
				'vitals.motricity.rightArm',
				'vitals.motricity.leftLeg',
				'vitals.motricity.rightLeg',
			],
			duration: { low_skill: 4, high_skill: 4 },
		},
	});

	// Etc
	////////////////////////////////////////
	registerAct({
		id: 'canYouWalk',
		priority:0,
		//name: 'Can you walk?',
		action: {
			type: 'ActionBodyMeasure',
			category: 'Z',
			targetedObject: 'HumanBody',
			metricName: ['vitals.canWalk'],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'painLevel',
		priority: 10,
		action: {
			type: 'ActionBodyMeasure',
			category: 'Z',
			targetedObject: 'HumanBody',
			metricName: ['vitals.visiblePain'],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	// Etc
	////////////////////////////////////////

	registerAct({
		id: 'sitDown',
		//name: 'Sit down',
		priority: 0,
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			blocks: [],
			category: 'Z',
			visible: false,
			rules: [
				{
					id: '',
					name: '',
					time: 0,
					blockPatch: {},
					variablePatch: {
						bodyPosition: 'SITTING',
					},
				},
			],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'proneDecubitus',
		priority: 10,
		//name: 'Prone decubitus',
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			blocks: [],
			category: 'Z',
			visible: false,
			rules: [
				{
					id: '',
					name: '',
					time: 0,
					blockPatch: {},
					variablePatch: {
						bodyPosition: 'PRONE_DECUBITUS',
					},
				},
			],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'supineDecubitus',
		//name: 'Supine decubitus',
		priority: 20,
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			blocks: [],
			category: 'Z',
			visible: false,
			rules: [
				{
					id: '',
					name: '',
					time: 0,
					blockPatch: {},
					variablePatch: {
						bodyPosition: 'SUPINE_DECUBITUS',
					},
				},
			],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	registerAct({
		id: 'getUp',
		//name: 'Get UP',
		priority: 30,
		action: {
			type: 'ActionBodyEffect',
			targetedObject: 'HumanBody',
			blocks: [],
			category: 'Z',
			visible: false,
			rules: [
				{
					id: '',
					name: '',
					time: 0,
					blockPatch: {},
					variablePatch: {
						bodyPosition: 'STANDING',
					},
				},
			],
			createActions: [],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});

	/*
	registerAct({
		id: 'areYouDead?',
		name: 'Are you dead?',
		action: {
			category: 'Z',
			type: 'ActionBodyMeasure',
			name: 'dead',
			targetedObject: 'HumanBody',
			metricName: ['vitals.cardiacArrest'],
			duration: { low_skill: 0, high_skill: 0 },
		},
	});*/
}
