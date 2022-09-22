/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import { SkillLevel } from "../edition/GameModelerHelper";
import { checkUnreachable, getRandomValue, intersection, pickRandom, Range } from "../tools/helper";
import { Block, BlockName, BodyState, BodyStateKeys, BoneBlock, ExternalBlock, NervousBlock } from "./human";
import { getPathology } from "./registries";

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


type RangeDefs<T extends string> = Record<T, Range | undefined>;
type Args<T extends string> = Record<T, number | undefined>;

/**
 * Module Meta
 */

interface BaseModule<T extends string> {
	config: {
		type: string;
		/**
		 * List of block the module may affect
		 */
		blocks: BlockName[];
		//[key: string]: unknown;
	} & RangeDefs<T>;
	args: {
		type: string;
		//[key: string]: unknown;
	} & Args<T>;
}


export const hemorrhageArgKeys = ["instantaneousBloodLoss", "bleedingFactor"] as const;

interface HemorrhageMeta extends BaseModule<typeof hemorrhageArgKeys[number]> {
	config: {
		type: 'Hemorrhage';
		blocks: ExternalBlock[];
		subtype: 'internal' | 'arterial' | 'venous';
		instantaneousBloodLoss: Range | undefined;
		bleedingFactor: Range | undefined;
	};
	args: {
		type: 'HemorrhageArgs';
		instantaneousBloodLoss: number | undefined;
		bleedingFactor: number | undefined;
	}
}

interface FractureMeta extends BaseModule<never> {
	config: {
		type: 'Fracture',
		blocks: BoneBlock[];
		fractureType: BlockPatch['broken']
	};
	args: {
		type: 'NoArgs',
	};
}

interface NervousSystemMeta extends BaseModule<never> {
	config: {
		type: 'NervousSystem',
		blocks: NervousBlock[];
	};
	args: {
		type: 'NoArgs',
	};
}

export const tamponadeArgKeys = ["pericardial_deltaMin", "pericardial_mL"] as const;

interface TamponadeMeta extends BaseModule<typeof tamponadeArgKeys[number]> {
	config: {
		type: 'Tamponade';
		blocks: 'HEART'[];
		pericardial_deltaMin: Range | undefined;
		pericardial_mL: Range | undefined;
	};
	args: {
		type: 'TamponadeArgs',
		pericardial_deltaMin: number | undefined;
		pericardial_mL: number | undefined;
	}
}

export const airwaysResistanceArgKeys = ["airResistance", "airResistanceDelta"] as const;

interface AirwaysResistanceMeta extends BaseModule<typeof airwaysResistanceArgKeys[number]> {
	config: {
		type: 'AirwaysResistance';
		blocks: ('HEAD' | 'NECK' | 'BRONCHUS_1' | 'BRONCHUS_2')[];
		airResistance: Range | undefined;
		airResistanceDelta: Range | undefined;
	};
	args: {
		type: 'AirwaysResistanceArgs';
		airResistance: number | undefined;
		airResistanceDelta: number | undefined;
	}
}

export const pneumothoraxArgKeys = ["compliance", "complianceDelta"] as const;

interface PneumothoraxMeta extends BaseModule<typeof pneumothoraxArgKeys[number]> {
	config: {
		type: 'Pneumothorax';
		blocks: ('UNIT_BRONCHUS_1' | 'UNIT_BRONCHUS_2')[],
		pneumothoraxType: NonNullable<BlockPatch['pneumothorax']>;
		compliance: Range | undefined;
		complianceDelta: Range | undefined;
	};
	args: {
		type: 'PneumothoraxArgs';
		compliance: number | undefined;
		complianceDelta: number | undefined;
	}
}

export const burnArgKeys = ["percent"] as const;

interface BurnMeta extends BaseModule<typeof burnArgKeys[number]> {
	config: {
		type: 'Burn';
		blocks: ExternalBlock[]
		level: BlockPatch['burnLevel'];
		percent: Range | undefined;
	};
	args: {
		type: 'BurnArgs';
		percent: number | undefined;
	}
}

export const icpArgKeys = ["delta_perMin", "icp_mmHg"] as const;

interface ICPMeta extends BaseModule<typeof icpArgKeys[number]> {
	config: {
		type: 'ICP';
		blocks: 'HEAD'[]
		delta_perMin: Range | undefined;
		icp_mmHg: Range | undefined;
	};
	args: {
		type: 'ICPArgs';
		delta_perMin: number | undefined;
		icp_mmHg: number | undefined;
	}
}

export type ModuleMeta =
	| HemorrhageMeta
	| FractureMeta
	| NervousSystemMeta
	| TamponadeMeta
	| AirwaysResistanceMeta
	| PneumothoraxMeta
	| BurnMeta
	| ICPMeta;

export type ModuleDefinition = ModuleMeta['config'];

export type ModuleArgs = ModuleMeta['args'];


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
	 * pathology is made of modules
	 */
	modules: ModuleDefinition[];
	/**
	 * How to select blocks? if "same" all modules MUST target the same block, if "any", modules may
	 * may targets different blocks.
	 */
	blockSelectionMode: 'any' | 'same';
	/**
	 * Block preset.
	 * If undefined
	 */
	presets?: BlockName[][][];

	/**
	 *  minimm number of block the pathology should affect
	 */
	//minNumberOfBlocks: number;
	/**
	 * maximum number of block the pathology may affect
	 */
	//maxNumberOfBlocks: number;
	/**
	 * how the pathology affects a human being
	 */
	//rules: Rule[];
	/**
	 * Some body-level actions may have some effect on the pathology, define handler here.
	 * One should avoid such particular effect !!!
	 * EV: Recovery Position may affect some rules;
	 */
	//handler: ActionHandler[];
	/**
	 *
	 */
	//actions: PathologyAction[];
}


/**
 * Afflicted pathology
 * Uses Pathologydefinition and privides effective blocks and parameters to underlying modules
 */
export interface AfflictedPathology {
	/**
	 * Id of the pathology definition
	 */
	pathologyId: string;

	/**
	 * list of afflicted blocks.
	 * One item per module
	 */
	afflictedBlocks: BlockName[];
	/**
	 * modules parameters
	 */
	modulesArguments: ModuleArgs[];
}

export interface InstantiatedModule {
	block: BlockName;
	rules: Rule[];
}

export interface RevivedPathology {
	/**
	 * Id of the pathology definition
	 */
	pathologyId: string;
	/**
	 * Time the pathology appears
	 */
	time: number;
	/**
	 * Instantiated module
	 */
	modules: InstantiatedModule[];
}

function prettyPrintModuleDef(mod: ModuleDefinition, block: string, args: ModuleArgs): string {
	// TODO => args!
	switch (mod.type) {
		case 'AirwaysResistance':
			return `${block}: airways resistance`;
		case 'Burn':
			return `${block}: ${mod.level} degree burn`;
		case 'Fracture':
			return `${block}: ${mod.fractureType} fracture`;
		case 'Hemorrhage':
			return `${block}: ${mod.subtype} hemorrhage`;
		case 'ICP':
			return `Intracranial pressure`
		case 'NervousSystem':
			return `${block}: nervous system damage`
		case 'Pneumothorax': {
			const side = block.startsWith("UNIT_BRONCHUS_1") ? 'Left' : 'Right';
			return `${side} lung: ${mod.pneumothoraxType.toLowerCase()} pneumothorax`;
        }
		case 'Tamponade':
			return 'Tamponade';
	}
}

export function prettyPrinterAfflictedPathology(ap: AfflictedPathology): string {
	const pDef = getPathology(ap.pathologyId);
	if (pDef == null) {
		return `Unknown pathology ${ap.pathologyId}`;
	}

	const pName = pDef.name;

	const mods = pDef.modules.map((mod, i) => {
		return prettyPrintModuleDef(mod, ap.afflictedBlocks[i]!, ap.modulesArguments[i]!);
	});

	return `<h3>${pName}</h3>
	<ul>${mods.map(m => `<li>${m}</li>`).join("")}
	</ul>`;
}


type PathologyMeta = Pick<PathologyDefinition, 'id' | 'name' | 'blockSelectionMode'>;


type BlockKey = keyof Block["params"];


export function buildPathology(meta: PathologyMeta, modules: ModuleDefinition[], presets?: BlockName[][][]): PathologyDefinition {
	const p: PathologyDefinition = {
		...meta,
		modules: [...modules],
		presets: presets,
	};

	return p;
}

export function createRandomArgs(mod: ModuleDefinition): ModuleArgs {
	if (mod.type === 'Hemorrhage') {
		return {
			type: 'HemorrhageArgs',
			bleedingFactor: getRandomValue(mod.bleedingFactor),
			instantaneousBloodLoss: getRandomValue(mod.instantaneousBloodLoss),
		} as HemorrhageMeta['args'];
	} else if (mod.type === 'Fracture') {
		const args: FractureMeta['args'] = {
			type: 'NoArgs'
		};
		return args;
	} else if (mod.type === 'NervousSystem') {
		const args: NervousSystemMeta['args'] = {
			type: 'NoArgs'
		};
		return args;
	} else if (mod.type === 'Tamponade') {
		const args: TamponadeMeta['args'] = {
			type: 'TamponadeArgs',
			pericardial_deltaMin: getRandomValue(mod.pericardial_deltaMin),
			pericardial_mL: getRandomValue(mod.pericardial_mL)
		};
		return args;
	} else if (mod.type === 'AirwaysResistance') {
		const args: AirwaysResistanceMeta['args'] = {
			type: 'AirwaysResistanceArgs',
			airResistance: getRandomValue(mod.airResistance),
			airResistanceDelta: getRandomValue(mod.airResistanceDelta),
		};
		return args;
	} else if (mod.type === 'Pneumothorax') {
		const args: PneumothoraxMeta['args'] = {
			type: 'PneumothoraxArgs',
			compliance: getRandomValue(mod.compliance),
			complianceDelta: getRandomValue(mod.complianceDelta),
		};
		return args;
	} else if (mod.type === 'Burn') {
		const args: BurnMeta['args'] = {
			type: 'BurnArgs',
			percent: getRandomValue(mod.percent)!,
		};
		return args;
	} else if (mod.type === 'ICP') {
		const args: ICPMeta['args'] = {
			type: 'ICPArgs',
			delta_perMin: getRandomValue(mod.delta_perMin),
			icp_mmHg: getRandomValue(mod.icp_mmHg),
		};
		return args;
	} else {
		checkUnreachable(mod);
		throw "";
	}
}

export function afflictPathology(pathologyId: string): AfflictedPathology {
	const pathology = getPathology(pathologyId);

	if (pathology == null) {
		throw new Error("Pathology does not exist");
	}

	const aPatho: AfflictedPathology = {
		pathologyId: pathology.id,
		afflictedBlocks: [],
		modulesArguments: [],
	};

	let preset: BlockName[][] | undefined = undefined;
	if (pathology.presets) {
		preset = pickRandom(pathology.presets);
	}

	//if (pathology.presets && pathology.presets.length > 0) {
	//} else {
	if (preset == null) {
		// No preset, fetch the preset from module
		preset = pathology.modules.map(m => m.blocks);
	}

	if (pathology.blockSelectionMode === 'same') {
		// select the same block for all module
		const selectedBlock = pickRandom(intersection(...preset));
		if (selectedBlock == null) {
			throw new Error("Selected block is null");
		}
		aPatho.afflictedBlocks = pathology.modules.map(_ => selectedBlock);
	} else {
		// select a block for each module
		aPatho.afflictedBlocks = preset.map(m => {
			const b = pickRandom(m);
			if (b == null) {
				throw new Error("Selected block is null");
			}
			return b;
		});
	}

	aPatho.modulesArguments = pathology.modules.map(createRandomArgs);

	return aPatho;
}

export function instantiateModule(mod: ModuleDefinition, block: BlockName, args: ModuleArgs): InstantiatedModule {
	if (mod.type === 'Hemorrhage') {
		const hArgs = args as unknown as HemorrhageMeta['args'];

		const keyName: BlockKey = mod.subtype === 'venous' ? 'venousBleedingFactor' : mod.subtype === 'arterial' ? 'arterialBleedingFactor' : 'internalBleedingFactor';

		return {
			block: block,
			rules: [{
				time: 0,
				id: 'hemorrhage',
				name: 'hemorrhage',
				variablePatch: {},
				blockPatch: {
					pain: 4,
					instantaneousBloodLoss: hArgs.instantaneousBloodLoss,
					[keyName]: hArgs.bleedingFactor,
				}
			}],
		};
	} else if (mod.type === 'Fracture') {
		//const fArgs: FractureArgs = args;
		return {
			block: block,
			rules: [{
				id: 'fracture',
				name: 'fracture',
				blockPatch: {
					broken: mod.fractureType,
				},
				time: 0,
				variablePatch: {}
			}]
		};
	} else if (mod.type === 'NervousSystem') {
		return {
			block: block,
			rules: [{
				id: 'nervousSystem',
				name: 'nervousSystem',
				blockPatch: {
					nervousSystemBroken: true,
				},
				time: 0,
				variablePatch: {}
			}]
		};
	} else if (mod.type === 'Tamponade') {
		const aArgs = args as unknown as TamponadeMeta['args'];
		return {
			block: block,
			rules: [{
				id: 'tamponade',
				name: 'tamponade',
				blockPatch: {
					pain: 1,
				},
				time: 0,
				variablePatch: {
					pericardial_ml: aArgs.pericardial_mL,
					pericardial_deltaMin: aArgs.pericardial_deltaMin
				}
			}]
		};
	} else if (mod.type === 'AirwaysResistance') {
		const aArgs = args as unknown as AirwaysResistanceMeta['args'];

		return {
			block: block,
			rules: [{
				time: 0,
				id: 'airwaysRes',
				name: 'airways resistance',
				variablePatch: {},
				blockPatch: {
					pain: 2,
					airResistance: aArgs.airResistance,
					airResistanceDelta: aArgs.airResistanceDelta,
				}
			}],
		};
	} else if (mod.type === 'Pneumothorax') {
		const aArgs = args as unknown as PneumothoraxMeta['args'];
		return {
			block: block,
			rules: [{
				id: 'pno',
				name: 'pno',
				blockPatch: {
					pain: 4,
					pneumothorax: mod.pneumothoraxType,
					compliance: aArgs.compliance,
					complianceDelta: aArgs.complianceDelta,
				},
				time: 0,
				variablePatch: {}
			}]
		};
	} else if (mod.type === 'Burn') {
		const aArgs = args as unknown as BurnMeta['args'];
		return {
			block: block,
			rules: [{
				id: 'burn',
				name: 'burn',
				blockPatch: {
					pain: +(mod.level || 0) * 2, // TODO https://en.wikipedia.org/wiki/Burn#Signs_and_symptoms
					burnLevel: mod.level,
					burnedPercent: aArgs.percent,
				},
				time: 0,
				variablePatch: {}
			}]
		};
	} else if (mod.type === 'ICP') {
		const aArgs = args as unknown as ICPMeta['args'];
		return {
			block: block,
			rules: [{
				id: 'burn',
				name: 'burn',
				blockPatch: {
					pain: 5
				},
				time: 0,
				variablePatch: {
					ICP_deltaPerMin: aArgs.delta_perMin,
					ICP_mmHg: aArgs.icp_mmHg,
				}
			}]
		};
	} else {
		checkUnreachable(mod);
		throw "";
	}
}

export function revivePathology(afflictedPathology: AfflictedPathology, time: number): RevivedPathology {
	const { pathologyId, afflictedBlocks, modulesArguments } = afflictedPathology;
	const pDef: PathologyDefinition | undefined = getPathology(pathologyId);
	if (pDef == null) {
		throw new Error(`Pathology ${pathologyId} not found`);
	}
	const expctedNumberOfModule = pDef.modules.length;
	if (expctedNumberOfModule !== afflictedBlocks.length || expctedNumberOfModule !== modulesArguments.length) {
		throw new Error(`Number of module does not match`);
	}

	const result: RevivedPathology = {
		pathologyId: pathologyId,
		time: time,
		modules: pDef.modules.map((m, i) => {
			const afflictedBlock = afflictedBlocks[i];
			if (!afflictedBlock || !(m.blocks as string[]).includes(afflictedBlock)) {
				throw new Error(`Block ${afflictedBlock} is not valid within module ${m.type}`);
			}
			return instantiateModule(m, afflictedBlock, modulesArguments[i]!);
		})
	};

	wlog("result: ", result);
	return result;
}







/**
 * Acts and Items
 */

export type ABCDECategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'Z';

interface BaseAction {
	type: string;
	/** human readable name */
	name: string;
	category: ABCDECategory;
	duration: Record<SkillLevel, number>;
}

export interface ActionBodyEffect extends BaseAction {
	targetedObject: "HumanBody";
	type: 'ActionBodyEffect',
	name: string;
	visible: boolean;
	/**
	 * List of block the item may target
	 */
	blocks: BlockName[];
	/**
	 * how the item affects a human being
	 */
	rules: Rule[];
	/**
	 * onDo, install those action on the target
	 */
	createActions: HumanAction[];
}

export interface ActionBodyMeasure extends BaseAction {
	targetedObject: "HumanBody";
	type: 'ActionBodyMeasure',
	metricName: BodyStateKeys[];
}

export type HumanAction = ActionBodyEffect | ActionBodyMeasure;

/**
 * Definition of an Item
 */
export interface ItemDefinition {
	type: 'item',
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
	disposable: boolean;
	/**
	 *
	 */
	actions: Record<string, HumanAction>;
}


export interface ActDefinition {
	type: 'act',
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