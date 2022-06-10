import { BlockName, BodyFactoryParam, Environnment } from "./HUMAn";
import { Compensation, SympSystem } from "./physiologicalModel";

export function parse<T>(meta: string): T | null {
	try {
		return JSON.parse(meta) as T;
	} catch {
		return null;
	}
}

interface Point {
	x: number;
	y: number;
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

export function getBodyParam(humanId: string): BodyFactoryParam | undefined {

	const strP = Variable.find(gameModel, 'patients').getProperties()[humanId];
	if (strP){
		const parsed = parse<BodyFactoryParam>(strP);
		return parsed ? parsed: undefined;
	} else {
		return undefined;
	}
}

export function whoAmI(): string {
	return Variable.find(gameModel, 'whoAmI').getValue(self);
}

export function getCurrentHumanId(): BodyFactoryParam | undefined {
	const patientId = whoAmI();
	return getBodyParam(patientId);
}

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
}

export type TestScenarioEvent = PathologyEvent | ItemActionEvent;

export interface TestScenario {
	description: string;
	events: TestScenarioEvent[];
}

export function getCurrentScenario(): TestScenario {
	const scenarioId = Variable.find(gameModel, 'currentScenario').getValue(self);
	const strP = Variable.find(gameModel, 'scenario').getProperties()[scenarioId];
	if (strP){
		const parsed = parse<TestScenario>(strP);
		if (parsed){
			return parsed;
		}
	}
	return {
		description: "none",
		events:[],
	};

}

export function parseObjectDescriptor<T>(od: SObjectDescriptor): Record<string, T> {
	return Object.entries(od.getProperties()).reduce<{[k: string]: T}>((acc, [k, v]) => {
		const parsed = parse<T>(v);
		if (parsed){
			acc[k] = parsed;
		}
		return acc;
	}, {});
}

export function parseObjectInstance<T>(oi: SObjectInstance): Record<string, T> {
	return Object.entries(oi.getProperties()).reduce<{[k: string]: T}>((acc, [k, v]) => {
		const parsed = parse<T>(v);
		if (parsed){
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

	Object.entries(data).forEach(([k, v]) => {
		newObject.properties[k] = JSON.stringify(v);
	})
	APIMethods.updateVariable(newObject);
}

export function getHumanIds() {
	return Object.keys(Variable.find(gameModel, 'patients').getProperties());
}

export function getBodyFactoryParams() {
	return parseObjectDescriptor<BodyFactoryParam>(Variable.find(gameModel, 'patients'));
}

export function getPatientAsChoices(short: boolean = false) {
	const patients = Variable.find(gameModel, 'patients').getProperties();
	return Object.entries(patients).map(([k, v]) => {
		const meta = parse<BodyFactoryParam>(v);
		if (meta) {
			return {
				value: k,
				label:
					short ?
						`${k} (${meta.age}${meta.sex === 'male' ? 'M' : 'F'})`
						: `${k} (${meta.sex}; ${meta.age} years; ${meta.height_cm}cm; ${meta.bmi} (BMI); 2^${meta.lungDepth} lungs)`
			};
		} else {
			return { value: k, label: `Unparsable ${k}` }
		}
	});
}

export function getScenariosAsChoices() {
	const patients = Variable.find(gameModel, 'scenario').getProperties();
	return Object.entries(patients).map(([k, v]) => {
		const meta = parse<TestScenario>(v);
		if (meta != null) {
			return {
				value: k,
				label: `${k} (${meta.description})`
			};
		} else {
			return { value: k, label: `Unparsable ${k}` }
		}
	});
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
