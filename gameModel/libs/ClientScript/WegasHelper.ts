import { TargetedEvent } from "./baseEvent";
import { getSkillDefinition, SkillDefinition, SkillLevel } from "./GameModelerHelper";
import { Point } from "./point2D";
import { BodyFactoryParam, Environnment } from "./HUMAn";
import { logger } from "./logger";
import { Compensation, SympSystem } from "./physiologicalModel";
import { getPathology } from "./registries";
import { BagDefinition, HumanTreatmentEvent, PathologyEvent } from "./the_world";

export function parse<T>(meta: string): T | null {
	try {
		return JSON.parse(meta) as T;
	} catch {
		return null;
	}
}

interface Serie {
	label: string;
	points: Point[];
}

interface Graph {
	id: string;
	series: Serie[];
}

type RawPoints = [number, number][];


function findObjectDescriptor(vdName: string): SObjectDescriptor | undefined {
	const variable = Variable.find(gameModel, vdName as keyof VariableClasses);
	if (variable.getJSONClassName() === 'ObjectDescriptor') {
		return variable as SObjectDescriptor;
	}
	return undefined;
}


function loadVitalsSeries(vdName: string): Graph[] {
	const obj = findObjectDescriptor(vdName);
	const properties = obj != null ? obj.getInstance(self).getProperties() : {};

	const keys = Object.keys(properties).sort();

	const graphs = keys.map(key => {
		const parsed = JSON.parse(properties[key]!);

		const data = Array.isArray(parsed) ?
			// 1 serie: array xy tuple [[x,y], ..., [x,y]]
			[{ label: key, points: (parsed as RawPoints).map(([x, y]) => ({ x, y })) }]
			:
			// many series:  {"serie1":[[x,y], ..., [x,y], "serie2":[[x,y], ..., [x,y]}
			Object.entries(parsed).map(([k, v]) => {
				return {
					label: k,
					points: (v as RawPoints).map(([x, y]) => ({ x, y }))
				};
			});

		return {
			id: key,
			series: data,
		}
	});

	return graphs;
};

export function getVitalsSeries() {
	return loadVitalsSeries('output');
}


export function getCardioVitalsSeries() {
	return loadVitalsSeries('outputCardio');
}


export function getOtherVitalsSeries() {
	return loadVitalsSeries('outputOther');
}

function getRawHumanBodyParams() {
	const patients = Variable.find(gameModel, 'patients').getProperties();
	const characters = Variable.find(gameModel, 'characters').getProperties();

	const all = { ...patients, ...characters };

	if (Object.keys(all).length !== Object.keys(patients).length + Object.keys(characters).length) {
		logger.error("Patients And characters duplicates ids !");
	}

	return all;
}

export function getHumanIds() {
	const all = getRawHumanBodyParams();
	return Object.keys(all);
}

export function alphaNumericSort (a: string, b: string) : number {
	return a.localeCompare(b, undefined, {sensitivity: 'base', numeric: true})
} 

export function getPatientIds() {
	return Object.keys(Variable.find(gameModel, 'patients').getProperties());
}

export function getSortedPatientIds() {
	return Object.keys(Variable.find(gameModel, 'patients').getProperties()).sort(alphaNumericSort);
}

export function getBodyParam(humanId: string): BodyFactoryParam | undefined {
	const strP = getRawHumanBodyParams()[humanId];
	if (strP) {
		const parsed = parse<BodyFactoryParam>(strP);
		return parsed ? parsed : undefined;
	} else {
		return undefined;
	}
}

export function whoAmI(): string {
	return Variable.find(gameModel, 'whoAmI').getValue(self);
}

export function getCurrentPatientId(): string {
	return Variable.find(gameModel, 'currentPatient').getValue(self);
}

export function getCurrentPatientBodyParam(): BodyFactoryParam | undefined {
	const patientId = getCurrentPatientId();
	return getBodyParam(patientId);
}


/*
interface PathologyEvent {
	time: number;
	blocks: BlockName[];
	event: {
		type: 'HumanPathology',
		pathologyId: string;
	}
}

interface ItemActionEvent {
	time: number;
	blocks: BlockName[];
	event: {
		type: 'ItemActionOnHuman',
		itemId: string;
		actionId: string;
	}
}*/


type CleanEvent<T extends TargetedEvent> = Omit<T, 'emitterPlayerId' | 'emitterCharacterId' | 'targetId' | 'targetType'> & {
	time: number;
};

export type TestScenarioEvent =
	| CleanEvent<PathologyEvent>
	| CleanEvent<HumanTreatmentEvent>;

export interface TestScenario {
	description: string;
	events: TestScenarioEvent[];
}

const testScenarios: Record<string, TestScenario> = {};

testScenarios["0_Healthy"] = {
	description: "Healthy",
	events: []
};


testScenarios["1_intHemoAbd"] = {
	description: "Hemorragie interne abdomen (rate)",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'tenth_ih',
		afflictedBlocks: ['ABDOMEN'],
		modulesArguments: [{
			type: 'HemorrhageArgs',
			bleedingFactor: 0.1,
			instantaneousBloodLoss: undefined,
		}]
	}]
};

testScenarios["2_leftForearmVenousHem"] = {
	description: "Hemorragie veineuse avant-bras gauche",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'semi_vh',
		afflictedBlocks: ['LEFT_FOREARM'],
		modulesArguments: [{
			type: 'HemorrhageArgs',
			bleedingFactor: 0.5,
			instantaneousBloodLoss: undefined,
		}]
	}]
};


testScenarios["2v_leftForearmVenousHem"] = {
	description: "Hemorragie arteriel avant-bras gauche",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'full_ah',
		afflictedBlocks: ['LEFT_THIGH'],
		modulesArguments: [{
			type: 'HemorrhageArgs',
			bleedingFactor: 1,
			instantaneousBloodLoss: undefined,
		}]
	}]
};



testScenarios["2c_leftKneeACut"] = {
	description: "Hemorragie arteriel genoux gauche",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'full_ah',
		afflictedBlocks: ['LEFT_KNEE'],
		modulesArguments: [{
			type: 'HemorrhageArgs',
			bleedingFactor: 1,
			instantaneousBloodLoss: undefined,
		}]
	}]
};


testScenarios["3_tamponade_mild"] = {
	description: "Mild Tamponade",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'tamponade_mild',
		afflictedBlocks: ['HEART'],
		modulesArguments: [{
			type: 'TamponadeArgs',
			pericardial_deltaMin: 10,
			pericardial_mL: undefined,
		}]
	}]
};

testScenarios["4_simple_pno_left"] = {
	description: "Simple full unilateral pneumothorax",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'simple_pno_full',
		afflictedBlocks: ['UNIT_BRONCHUS_1', 'THORAX_LEFT', 'THORAX_LEFT'],
		modulesArguments: [{
			type: 'PneumothoraxArgs',
			compliance: 0,
			complianceDelta: undefined,
		}, {
			type: 'HemorrhageArgs',
			instantaneousBloodLoss: 50,
			bleedingFactor: undefined,
		}, {
			type: 'NoArgs'
		}]
	}]
};


testScenarios["5_upper_airways_burn"] = {
	description: "Upper airways burn",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'upper_airways_burn',
		afflictedBlocks: ['NECK', 'HEAD'],
		modulesArguments: [{
			type: 'AirwaysResistanceArgs',
			airResistanceDelta: 0.05,
			airResistance: undefined,
		}, {
			type: 'BurnArgs',
			percent: 0.5,
		}]
	}]
};

testScenarios["6_thorac_circ_burn"] = {
	description: "Circumferential Thorax Burn",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'thorax_circ',
		afflictedBlocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
		modulesArguments: [{
			type: 'BurnArgs',
			percent: 1,
		},
		{
			type: 'BurnArgs',
			percent: 1,
		}
		]
	}]
};

testScenarios["7_ICP"] = {
	description: "Coup de masse",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'cityHunter',
		afflictedBlocks: ['HEAD', 'HEAD'],
		modulesArguments: [
			{
				type: "ICPArgs",
				delta_perMin: 1,
				icp_mmHg: undefined,
			}, {
				type: "HemorrhageArgs",
				bleedingFactor: 0.01,
				instantaneousBloodLoss: undefined,
			}
		]
	}]
};



testScenarios["8_dislocation_c1c2"] = {
	description: "C1-C2 dislocation",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'disclocation_c1c2',
		afflictedBlocks: ['C1-C4'],
		modulesArguments: [{
			type: 'NoArgs',
		}]
	}]
};


testScenarios["9_dislocation_c7c8"] = {
	description: "C7-C8 dislocation",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'disclocation_c5c7',
		afflictedBlocks: ['C5-C7'],
		modulesArguments: [{
			type: 'NoArgs',
		}]
	}]
};


testScenarios["10_tension_pneumothorax"] = {
	description: "Tension Pneumothorax",
	events: [{
		type: 'HumanPathology',
		time: 10,
		pathologyId: 'simple_pno_full',
		afflictedBlocks: ['UNIT_BRONCHUS_1', 'THORAX_LEFT', 'THORAX_LEFT'],
		modulesArguments: [{
			type: 'PneumothoraxArgs',
			compliance: 0,
			complianceDelta: undefined,
		}, {
			type: 'HemorrhageArgs',
			instantaneousBloodLoss: 50,
			bleedingFactor: undefined,
		}, {
			type: 'NoArgs'
		}]
	}, {
		type: 'HumanTreatment',
		time: 600,
		source: {
			type: 'itemAction',
			itemId: 'balloon',
			actionId: 'setup'
		},
		blocks: ['HEAD'],
	}]
};

export function parseObjectDescriptor<T>(od: SObjectDescriptor): Record<string, T> {
	return Object.entries(od.getProperties()).reduce<{ [k: string]: T }>((acc, [k, v]) => {
		const parsed = parse<T>(v);
		if (parsed) {
			acc[k] = parsed;
		}
		return acc;
	}, {});
}

export function parseObjectInstance<T>(oi: SObjectInstance): Record<string, T> {
	return Object.entries(oi.getProperties()).reduce<{ [k: string]: T }>((acc, [k, v]) => {
		const parsed = parse<T>(v);
		if (parsed) {
			acc[k] = parsed;
		}
		return acc;
	}, {});
}


export function saveToObjectInstance(oi: SObjectInstance, data: object) {
	const newInstance = Helpers.cloneDeep(oi.getEntity());

	Object.entries(data).forEach(([k, v]) => {
		newInstance.properties[k] = JSON.stringify(v);
	})
	APIMethods.updateInstance(newInstance);
}

/**
 * Erase each values with given data
 */
export function dropObjectInstance(oi: SObjectInstance) {
	const newInstance = Helpers.cloneDeep(oi.getEntity());

	newInstance.properties = {};

	APIMethods.updateInstance(newInstance);
}

/**
 * Erase each values with given data
 */
export function clearObjectInstance(oi: SObjectInstance, data: object) {
	const newInstance = Helpers.cloneDeep(oi.getEntity());

	Object.keys(newInstance.properties).forEach((k) => {
		newInstance.properties[k] = JSON.stringify(data);
	});

	APIMethods.updateInstance(newInstance);
}


export function saveToObjectDescriptor<T>(od: SObjectDescriptor, data: Record<string, T>) {
	const newObject = Helpers.cloneDeep(od.getEntity());
	newObject.properties = {};
	Object.entries(data).forEach(([k, v]) => {
		newObject.properties[k] = JSON.stringify(v);
	})
	APIMethods.updateVariable(newObject);
}


export function getPatientsBodyFactoryParams() {
	return parseObjectDescriptor<BodyFactoryParam>(Variable.find(gameModel, 'patients'));
}

export function getPatientsBodyFactoryParamsArray() {
	return Object.entries(getPatientsBodyFactoryParams()).map(([id, meta]) => {
		return { id: id, meta: meta };
	}).sort((a, b) => {
		return a.id.localeCompare(b.id);
	});
}

export function prettyPrint(id: string, param: BodyFactoryParam, short: boolean = false): string {
	const skill = param.skillId ? ` [${param.skillId}]` : '';

	const ps = (param.scriptedPathologies || []).map(sp => {
		const def = getPathology(sp.payload.pathologyId);
		return def?.name || '';
	}).filter(p => p).join(", ");

	return short ?
		`${id} (${param.age}${param.sex === 'male' ? 'M' : 'F'}) ${skill}`
		: `${id} ${skill} (${param.sex}; ${param.age} years; ${param.height_cm}cm; ${param.bmi} (BMI); 2^${param.lungDepth} lungs) ${ps}`
}


function getHumansAsChoices(od: SObjectDescriptor, short: boolean = false) {
	const humans = parseObjectDescriptor<BodyFactoryParam>(od);
	return Object.entries(humans).map(([k, meta]) => {
		if (meta) {
			return {
				value: k,
				label: prettyPrint(k, meta, short),
			};
		} else {
			return { value: k, label: `Unparsable ${k}` }
		}
	});
}

export function getPatientsAsChoices(short: boolean = false) {
	return getHumansAsChoices(Variable.find(gameModel, 'patients'), short);
}

export function getCharactersAsChoices(short: boolean = false) {
	return getHumansAsChoices(Variable.find(gameModel, 'characters'), short);
}

export function getAllHumansAsChoices(short: boolean = false) {
	return [...getCharactersAsChoices(short), ...getPatientsAsChoices(short)];

}

export function getAutonomicNervousSystemModelsAsChoices() {
	const systems = Variable.find(gameModel, 'autonomicNervousSystems')
	return systems.getItems().map(child => {
		return {
			label: I18n.toString(child),
			value: child.getName(),
		}
	});
}

export function getEnv(): Environnment {
	return {
		atmosphericPressure_mmHg: Variable.find(gameModel, 'atmP_mmHg').getValue(self),
		FiO2: Variable.find(gameModel, 'fiO2').getValue(self),
	};
}

export function loadSystem(): SympSystem {
	const systemVarName = Variable.find(gameModel, "ansModel").getValue(self);
	const obj = findObjectDescriptor(systemVarName);
	if (obj) {
		return parseObjectDescriptor(obj);
	} else {
		return {};
	}
}

export function getSystemSeries(): Graph[] {
	const system = loadSystem();

	const graphs = Object.entries(system).map(([key, value]) => {
		return {
			id: key,
			series: [{
				label: key,
				points: value,
			}]
		}
	});

	return graphs;
};

export function loadCompensationModel(): Compensation {
	return parseObjectDescriptor(Variable.find(gameModel, "comp"));
}

export function getCompensationSeries(): Graph[] {
	const system = loadCompensationModel();

	const graphs = Object.entries(system).map(([key, value]) => {
		return {
			id: key,
			series: [{
				label: key,
				points: value.points,
			}]
		}
	});

	return graphs;
};


export function getBagDefinition(bagId: string) {
	const sdef = Variable.find(gameModel, 'bagsDefinitions').getProperties()[bagId];
	return parse<BagDefinition>(sdef || "");
}

/**
 * Get character skills
 */
export function getHumanSkillDefinition(humanId: string): SkillDefinition {
	const humanDef = getBodyParam(humanId);
	const skillId = humanDef?.skillId;
	return getSkillDefinition(skillId);
}

/**
 * Get current character skills
 */
export function getMySkillDefinition(): SkillDefinition {
	return getHumanSkillDefinition(whoAmI());
}

/**
 * Get humanId skillLevel for the given action
 */
export function getHumanSkillLevelForItemAction(humanId: string, itemId: string, actionId: string): SkillLevel | undefined {
	const key = `item::${itemId}::${actionId}`;
	const skills = getHumanSkillDefinition(humanId);
	return skills.actions && skills.actions[key];
}

export function getHumanSkillLevelForAct(humanId: string, actId: string) {
	const key = `act::${actId}`;
	const skills = getHumanSkillDefinition(humanId);
	return skills.actions && skills.actions[key];
}