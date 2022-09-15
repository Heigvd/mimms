import { TargetedEvent } from "./baseEvent";
import { getSkillDefinition, SkillDefinition, SkillLevel } from "./GameModelerHelper";
import { Point } from "./point2D";
import { BodyFactoryParam, Environnment } from "./HUMAn";
import { logger } from "./logger";
import { Compensation, SympSystem } from "./physiologicalModel";
import { getAct, getItem, getPathology } from './registries';
import { BagDefinition, HumanTreatmentEvent, PathologyEvent } from "./the_world";
import { checkUnreachable } from "./helper";

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

		const data = Array.isArray(parsed)
			? // 1 serie: array xy tuple [[x,y], ..., [x,y]]
			[{ label: key, points: (parsed as RawPoints).map(([x, y]) => ({ x, y })) }]
			: // many series:  {"serie1":[[x,y], ..., [x,y], "serie2":[[x,y], ..., [x,y]}
			Object.entries(parsed).map(([k, v]) => {
				return {
					label: k,
					points: (v as RawPoints).map(([x, y]) => ({ x, y })),
				};
			});

		return {
			id: key,
			series: data,
		};
	});

	return graphs;
}

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
		logger.error('Patients And characters duplicates ids !');
	}

	return all;
}

export function getHumanIds() {
	const all = getRawHumanBodyParams();
	return Object.keys(all);
}

export function alphaNumericSort(a: string, b: string): number {
	return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
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

type CleanEvent<T extends TargetedEvent> = Omit<
	T,
	'emitterPlayerId' | 'emitterCharacterId' | 'targetId' | 'targetType'
> & {
	time: number;
};

export type TestScenarioEvent = CleanEvent<PathologyEvent> | CleanEvent<HumanTreatmentEvent>;

export interface TestScenario {
	description: string;
	events: TestScenarioEvent[];
}

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
	});
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

	Object.keys(newInstance.properties).forEach(k => {
		newInstance.properties[k] = JSON.stringify(data);
	});

	APIMethods.updateInstance(newInstance);
}

export function saveToObjectDescriptor<T>(od: SObjectDescriptor, data: Record<string, T>) {
	const newObject = Helpers.cloneDeep(od.getEntity());
	newObject.properties = {};
	Object.entries(data).forEach(([k, v]) => {
		newObject.properties[k] = JSON.stringify(v);
	});
	APIMethods.updateVariable(newObject);
}

export function getPatientsBodyFactoryParams() {
	return parseObjectDescriptor<BodyFactoryParam>(Variable.find(gameModel, 'patients'));
}

export function getPatientsBodyFactoryParamsArray() {
	return Object.entries(getPatientsBodyFactoryParams())
		.map(([id, meta]) => {
			return { id: id, meta: meta };
		})
		.sort((a, b) => {
			return alphaNumericSort(a.id, b.id)
		});
}

export function prettyPrint(id: string, param: BodyFactoryParam, short: boolean = false): string {
	const skill = param.skillId ? ` [${param.skillId}]` : '';

	const ps = (param.scriptedEvents || [])
		.map(sp => {
			if (sp.payload.type === 'HumanPathology') {
				const def = getPathology(sp.payload.pathologyId);
				return def?.name || '';
			} else if (sp.payload.type === 'HumanTreatment') {
				const source = sp.payload.source;
				if (source.type === 'act') {
					const act = getAct(source.actId);
					return act?.name || '';
				} else {
					const item = getItem(source.itemId);
					return item?.name || '';
				}
			} else if (sp.payload.type === 'Teleport') {
				return `Located at [${sp.payload.location.x};${sp.payload.location.y}] on ${sp.payload.location.mapId}`;
			} else {
				checkUnreachable(sp.payload);
			}
		})
		.filter(p => p)
		.join(', ');

	return short
		? `${id} (${param.age}${param.sex === 'male' ? 'M' : 'F'}) ${skill}`
		: `${id} ${skill} (${param.sex}; ${param.age} years; ${param.height_cm}cm; ${param.bmi} (BMI); 2^${param.lungDepth} lungs) ${ps}`;
}

export function sortChoicesByLabel(choices: { label: string, value: string }[]) {
	return [...choices].sort((a, b) => alphaNumericSort(a.label, b.label));
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
			return { value: k, label: `Unparsable ${k}` };
		}
	});
}

export function getPatientsAsChoices(short: boolean = false) {
	return sortChoicesByLabel(getHumansAsChoices(Variable.find(gameModel, 'patients'), short));
}

export function getCharactersAsChoices(short: boolean = false) {
	return sortChoicesByLabel(getHumansAsChoices(Variable.find(gameModel, 'characters'), short));
}

export function getAllHumansAsChoices(short: boolean = false) {
	return sortChoicesByLabel([...getCharactersAsChoices(short), ...getPatientsAsChoices(short)]);
}

export function getAutonomicNervousSystemModelsAsChoices() {
	const systems = Variable.find(gameModel, 'autonomicNervousSystems');
	return systems.getItems().map(child => {
		return {
			label: I18n.toString(child),
			value: child.getName(),
		};
	});
}

export function getEnv(): Environnment {
	return {
		atmosphericPressure_mmHg: Variable.find(gameModel, 'atmP_mmHg').getValue(self),
		FiO2: Variable.find(gameModel, 'fiO2').getValue(self),
	};
}

export function loadSystem(): SympSystem {
	const sympathetic: SympSystem = {
		"vitals.cardio.MAP": [{ "x": 0, "y": 100 }, { "x": 40, "y": 35 }, { "x": 70, "y": 0 }, { "x": 90, "y": 0 }, { "x": 180, "y": 0 }, { "x": 200, "y": 0 }],
		"vitals.cardio.DO2Sys": [{ "x": 0, "y": 100 }, { "y": 0, "x": 850 }, { "x": 1100, "y": 0 }, { "x": 2000, "y": 0 }],
		"vitals.respiration.PaO2": [{ "x": 0, "y": 100 }, { "y": 100, "x": 0 }, { "x": 50, "y": 50 }, { "x": 70, "y": 20 }, { "y": 5, "x": 80 }, { "x": 90, "y": 0 }]
	};

	return sympathetic;
}

export function getSystemSeries(): Graph[] {
	const system = loadSystem();

	const graphs = Object.entries(system).map(([key, value]) => {
		return {
			id: key,
			series: [
				{
					label: key,
					points: value,
				},
			],
		};
	});

	return graphs;
}
export function loadCompensationModel(): Compensation {
	const model: Compensation = {
		"vitals.respiration.tidalVolume_L": {
			"points": [{
				"x": 0,
				"y": 0
			}, {
				"x": 20,
				"y": 0.1
			}, {
				"x": 100,
				"y": 1
			}]
		},
		"vitals.cardio.hr": {
			"points": [{
				"x": 0,
				"y": 0
			}, {
				"x": 100,
				"y": 1
			}],
			"t4Nerve": true
		},
		"vitals.cardio.endSystolicVolume_mL": {
			"points": [{
				"x": 0,
				"y": 1
			}, {
				"x": 100,
				"y": 0
			}],
			"t4Nerve": true
		},
		"vitals.cardio.Ra_mmHgMinPerL": {
			"points": [{
				"x": 0,
				"y": 11
			}, {
				"x": 100,
				"y": 20
			}],
			"t4Nerve": true
		},
		"vitals.respiration.rr": {
			"points": [{
				"x": 0,
				"y": 10
			}, {
				"y": 15,
				"x": 30
			}, {
				"x": 40,
				"y": 35
			}, {
				"x": 100,
				"y": 50
			}]
		},
	};
	return model;
}

export function getCompensationSeries(): Graph[] {
	const system = loadCompensationModel();

	const graphs = Object.entries(system).map(([key, value]) => {
		return {
			id: key,
			series: [
				{
					label: key,
					points: value.points,
				},
			],
		};
	});

	return graphs;
}


export function loadOverdriveModel(): Compensation {
	const max = 1;
	const overdrive : Compensation = {
		"vitals.respiration.tidalVolume_L": {
			"points": [{
				"x": 0,
				"y": 0.2
			}, {
				"x": 0.1,
				"y": 0.2
			}, {
				"x": max,
				"y": 0.2
			}]
		},
		"vitals.cardio.hr": {
			"points": [{
				"x": 0,
				"y": 0.5
			}, {
				"x": max,
				"y": 0.0
			}],
			"t4Nerve": true
		},
		"vitals.cardio.endSystolicVolume_mL": {
			"points": [{
				"x": 0,
				"y": 0
			}, {
				"x": max,
				"y": 1
			}],
			"t4Nerve": true
		},
		"vitals.cardio.Ra_mmHgMinPerL": {
			"points": [{
				"x": 0,
				"y": 13
			}, {
				"x": 0.5,
				"y": 30
			}],
			"t4Nerve": true
		},
		"vitals.respiration.rr": {
			"points": [{
				"x": 0,
				"y": 15
			}, {
				"x": max,
				"y": 15
			}]
		},
	};
	return overdrive;
}

export function getOverdriveSeries(): Graph[] {
	const system = loadOverdriveModel();

	const graphs = Object.entries(system).map(([key, value]) => {
		return {
			id: key,
			series: [
				{
					label: key,
					points: value.points,
				},
			],
		};
	});

	return graphs;
}

export function getBagDefinition(bagId: string) {
	const sdef = Variable.find(gameModel, 'bagsDefinitions').getProperties()[bagId];
	return parse<BagDefinition>(sdef || '');
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
export function getHumanSkillLevelForItemAction(
	humanId: string,
	itemId: string,
	actionId: string,
): SkillLevel | undefined {
	const key = `item::${itemId}::${actionId}`;
	const skills = getHumanSkillDefinition(humanId);
	return skills.actions && skills.actions[key];
}

export function getHumanSkillLevelForAct(humanId: string, actId: string) {
	const key = `act::${actId}`;
	const skills = getHumanSkillDefinition(humanId);
	return skills.actions && skills.actions[key];
}
