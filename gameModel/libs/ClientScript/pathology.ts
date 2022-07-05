/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { Block, BlockName, BodyState, BodyStateKeys } from "./HUMAn";


export type VariablePatch = Partial<BodyState["variables"]>;
export type BlockPatch = Partial<Block["params"]>;

export interface Rule {
	id: string;
	time: number;
	name: string;
	variablePatch: VariablePatch;
	blockPatch: BlockPatch;
}

export interface RulePatch {
	id: string;
	patch: (r: Readonly<Rule>) => Rule;
}

export interface ActionHandler {
	actionType: string;
	patch: RulePatch;
}

export interface PathologyAction {
	id: string;
	condition: unknown;

	effect: RulePatch[];
}

/**
 * Definition of a pathology
 */
export interface PathologyDefinition {
	/**
	 * Kind of unique system-wide pathology identifier
	 */
	id: string;
	/**
	 * To be displayed
	 */
	name: string;
	/**
	 * List of block the pathology may affect
	 */
	blocks: string[];
	/**
	 *  minimm nunber of block the pathology should affect
	 */
	minNumberOfBlocks: number;
	/**
	 * maximum number of block the pathology may affect
	 */
	maxNumberOfBlocks: number;
	/**
	 * how the pathology affects a human being
	 */
	rules: Rule[];
	/**
	 * Some body-level actions may have some effect on the pathology, define handler here.
	 * One should avoid such particular effect !!!
	 * EV: Recovery Position may affect some rules;
	 */
	handler: ActionHandler[];
	/**
	 *
	 */
	actions: PathologyAction[];
}

export interface AfflictedPathology {
	/**
	 * Unique affected pathology identifier
	 */
	id: string;
	/**
	 * Time the pathology appears
	 */
	time: number;
	/**
	 * list of afflicted blocks
	 */
	afflictedBlocks: string[];
	/**
	 * Id of the pathology definition
	 */
	pathologyId: string;
}

export type ABCDECategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'Z';

export interface ActionBodyEffect {
	targetedObject: "HumanBody";
	type: 'ActionBodyEffect',
	/** human readable name */
	name: string;
	/**
	 * List of block the item may target
	 */
	blocks: string[];
	/**
	 * how the item affects a human being
	 */
	rules: Rule[];
	/**
	 * onDo, install those action on the target
	 */
	createActions: HumanAction[];
	category: ABCDECategory;
}

export interface ActionBodyMeasure {
	targetedObject: "HumanBody";
	type: 'ActionBodyMeasure',
	/** human readable name */
	name: string;
	metricName: BodyStateKeys[];
	category: ABCDECategory;
}

export type HumanAction = ActionBodyEffect | ActionBodyMeasure;

/**
 * Definition of an Item
 */
export interface ItemDefinition {
	/**
	 * Kind of unique system-wide item identifier
	 */
	id: string;
	/**
	 * To be displayed
	 */
	name: string;
	/**
	 *
	 */
	actions: Record<string, HumanAction>;
}


export interface ActDefinition {
	/**
	 * Kind of unique system-wide skill identifier
	 */
	id: string;
	/**
	 * To be displayed
	 */
	name: string;
	/**
	 * Actions
	 */
	action: HumanAction;
}


export interface Skill {
	/**
	 * Kind of unique system-wide skill identifier
	 */
	id: string;
	/**
	 * list of skill id
	 */
	inherit: string[];
}


export interface ChemicalDefinition {
	/**
	 * Kind of unique system-wide item identifier
	 */
	id: string;
	/**
	 * To be displayed
	 */
	name: string;
	/**
	 * maximum volume of plasma cleaned per minutes
	 */
	clearance_mLperMin?: number;
	/**
	 * 
	 */
	vd_LperKg?: number;
	halflife_s?: number;
}

interface HemorrhageMeta {
	type: 'Hemorrhage'
	subtype: 'internal' | 'arterial' | 'venous';
	instantaneousBloodLoss?: number;
	bleedingFactor?: number;
}

type PathologyModule = HemorrhageMeta;

interface PathologyMeta {
	id: string;
	name: string;
	blocks: BlockName[];
}

type BlockKey = keyof Block["params"];


export function buildPathology({id, name, blocks}: PathologyMeta, modules: PathologyModule[]): PathologyDefinition {
	const p: PathologyDefinition = {
		id: id,
		name: name,
		minNumberOfBlocks: 1,
		maxNumberOfBlocks: 1,
		rules: [],
		blocks: blocks,
		handler: [],
		actions: [],
	};

	modules.forEach(m => {
		if (m.type === 'Hemorrhage') {
			if (m.instantaneousBloodLoss) {
				p.rules.push({
					time: 0,
					id: 'initalLoss',
					name: 'Initial loss',
					variablePatch: {},
					blockPatch: {
						pain: 4,
						'instantaneousBloodLoss': m.instantaneousBloodLoss,
					}
				});
			}
			if (m.bleedingFactor) {
				const keyName: BlockKey = m.subtype === 'venous' ? 'venousBleedingFactor' : 'arterialBleedingFactor';
				p.rules.push({
					time: 0,
					id: 'bleed',
					name: 'Bleed',
					variablePatch: {},
					blockPatch: {
						pain: 4,
						[keyName]: m.bleedingFactor
					}
				});
			}
		}
	})

	return p;
}

