import { BodyFactoryParam, createHumanBody, defaultMeta } from "./HUMAn";
import { DataDef, MatrixConfig } from "./MatrixEditor";
import { generateOnePatient, setTestPatients, testPatients } from "./patientGeneration";
import { getActs, getItems, getPathologies } from "./registries";
import { BagDefinition } from "./the_world";
import { getBagDefinition, getEnv, parse, parseObjectDescriptor, saveToObjectDescriptor } from "./WegasHelper";

const observableVitals = [
	{ label: 'SaO2', value: "respiration.SaO2" },
	{ label: "CaO2", value: "respiration.CaO2" },
	{ label: "GCS (sum)", value: "glasgow.total" },
	{ label: "GCS (sum)", value: "glasgow.eye" },
	{ label: "GCS (sum)", value: "glasgow.verbal" },
	{ label: "GCS (sum)", value: "glasgow.total" },
];

function extractAllKeys(obj: object, currentKey: string, list: string[]) {
	Object.entries(obj).forEach(([k, v]) => {
		const key = `${currentKey ? `${currentKey}.` : ''}${k}`;
		if (v instanceof Object) {
			extractAllKeys(v, key, list);
		} else {
			list.push(key);
		}
	});
}


export function extractVitalKeys() {
	// Instantiate a body
	const env = getEnv();
	const meta = defaultMeta;
	const initialBody = createHumanBody(meta!, env);

	const vitals = initialBody.state.vitals;

	const list: string[] = [];
	extractAllKeys(vitals, "", list);

	return list.map(key => ({ label: key, key }));
}


export function extractBlockChoices() {
	// Instantiate a body
	const env = getEnv();
	const meta = defaultMeta;
	const initialBody = createHumanBody(meta, env);

	const choices: { label: string, value: string }[] = [];
	initialBody.state.blocks.forEach(b => {
		choices.push({
			label: b.name,
			value: b.name,
		});
	})
	return choices;
}

export function getBlocksSelector() {
	const blockChoices = extractBlockChoices();
	return {
		type: 'array',
		required: true,
		view: {
			label: 'Block(s)',
			layout: "longInline"
		},
		items: {
			type: 'string',
			view: {
				type: 'select',
				choices: blockChoices
			},
		},
	};
}

export function createPatients(n: number, namer: string | ((n: number) => string)) {
	//const patients = parseObjectDescriptor<BodyFactoryParam>(patientDesc);

	const patients: Record<string, BodyFactoryParam> = {};
	for (let i = 1; i <= n; i++) {
		let name = `${i}`;
		if (typeof namer === 'string') {
			name = `${namer}${i}`;
		} else if (typeof namer === 'function') {
			name = namer(i);
		}
		patients[name] = generateOnePatient(undefined, 1);
	}
	setTestPatients(Object.values(patients));
	const patientDesc = Variable.find(gameModel, 'patients');

	saveToObjectDescriptor(patientDesc, patients);
}


function compare(a?: string, b?: string){
	if (a == null && b == null){
		return 0;
	}
	if (a == null){
		return -1;
	}
	if (b == null){
		return 1;
	}
	return a.localeCompare(b);
}

/**
 * Bags Definitions Edition
 */

type BagId = string;
type ItemId = string;

type BagMatrixCell = undefined | number | 'infinity';

type BagOnChangeFn = (x: DataDef<BagId>, y: DataDef<ItemId>, value: BagMatrixCell) => void;

const BagOnChangeRefName = 'bagDefOnChange';

const onChangeRef = Helpers.useRef<BagOnChangeFn>(BagOnChangeRefName, () => { });


onChangeRef.current = (x, y, newData) => {
	const bagId = x.id;
	const itemId = y.id;

	const def = getBagDefinition(bagId) || { name: '', items: {} };

	if (newData != null) {
		def.items[itemId] = newData;
	} else {
		delete def.items[itemId];
	}


	const script = `Variable.find(gameModel, "bagsDefinitions").setProperty('${bagId}', ${JSON.stringify(JSON.stringify(def))})`

	APIMethods.runScript(script, {});
};

export function getBagsDefinitions() {
	return parseObjectDescriptor<BagDefinition>(Variable.find(gameModel, 'bagsDefinitions'));
}

export function getBagsDefinitionsAsChoices() {
	const bags = getBagsDefinitions();
	return Object.entries(bags).map(([bagId, bagDef]) => ({
		label: bagDef.name,
		value: bagId,
	}));
};


export function getBagsDefsMatrix(): MatrixConfig<BagId, ItemId, BagMatrixCell> {
	const items = getItems()
		.sort((a, b) => {
			return a.item.name.localeCompare(b.item.name);
		});
	const bags = getBagsDefinitions();

	const matrix: Record<ItemId, Record<BagId, BagMatrixCell>> = {};

	Object.entries(bags).forEach(([bagId, bagDef]) => {
		matrix[bagId] = {};
		Object.entries(bagDef.items).forEach(([itemId, data]) => {
			matrix[bagId]![itemId] = data;
		});
	});

	return {
		y: items.map(item => ({
			label: item.item.name,
			id: item.id,
		})),
		x: Object.entries(bags)
			.sort(([, a], [, b]) => compare(a.name, b.name))
			.map(([bagId, bag]) => ({
				id: bagId,
				label: bag?.name || 'no name',
			})),
		data: matrix,
		cellDef: [
			{
				type: 'enum',
				label: 'none',
				values: [undefined],
			},
			{
				type: 'number',
				label: 'limited',
			},
			{
				type: 'enum',
				label: 'unlimited',
				values: ['infinity'],
			}
		],
		onChangeRefName: BagOnChangeRefName,
	};
}


/**
 * Situations Definitions Edition
 */

type SituationId = string;
type PathologyId = string;

type SituationMatrixCell = undefined | boolean;

type SituationOnChangeFn = (x: DataDef<SituationId>, y: DataDef<PathologyId>, value: SituationMatrixCell) => void;

const SituationOnChangeRefName = 'situDefOnChange';

const onSituationChangeRef = Helpers.useRef<SituationOnChangeFn>(SituationOnChangeRefName, () => { });

interface SituationDefinition {
	name?: string,
	pathologies?: Record<PathologyId, boolean>,
}


export function getSituationDefinition(situId: string){
	const sdef = Variable.find(gameModel, 'situationsDefinitions').getProperties()[situId];
	return parse<SituationDefinition>(sdef || "");
}

onSituationChangeRef.current = (x, y, newData) => {

	const situationId = x.id;
	const pathologyId = y.id;

	const def = getSituationDefinition(situationId) || { name: '', pathologies: {} };

	if (newData) {
		if (def.pathologies == null){
			def.pathologies = {};
		}
		def.pathologies[pathologyId] = true;
	} else {
		if (def.pathologies){
			delete def.pathologies[pathologyId];
		}
	}

	const script = `Variable.find(gameModel, "situationsDefinitions").setProperty('${situationId}',
		 ${JSON.stringify(JSON.stringify(def))});`

	APIMethods.runScript(script, {});
};

export function getSituationsDefinitions() {
	return parseObjectDescriptor<SituationDefinition>(Variable.find(gameModel, 'situationsDefinitions'));
}

export function getSituationsDefinitionsAsChoices() {
	const situations = getSituationsDefinitions();
	const choices = Object.entries(situations).map(([situId, situDef]) => ({
		label: situDef.name,
		value: situId,
	}));
	choices.unshift({
		label: 'all',
		value: '',
	})
	return choices;
};


export function getSituationsDefsMatrix(): MatrixConfig<SituationId, PathologyId, SituationMatrixCell> {
	const pathologies = getPathologies()
		.sort((a, b) => {
			return a.label.localeCompare(b.label);
		});
	const situations = getSituationsDefinitions();

	const matrix: Record<SituationId, Record<PathologyId, SituationMatrixCell>> = {};

	Object.entries(situations).forEach(([situId, situDef]) => {
		matrix[situId] = {};
		Object.keys(situDef.pathologies || {}).forEach(pathoId => {
			matrix[situId]![pathoId] = true;
		});
	});

	return {
		y: pathologies.map(item => ({
			label: item.label,
			id: item.value,
		})),
		x: Object.entries(situations)
			.sort(([, a], [, b]) => compare(a.name, b.name))
			.map(([situId, situ]) => ({
				id: situId,
				label: situ?.name || 'no name',
			})),
		data: matrix,
		cellDef: [
			{
				type: 'boolean',
				label: '',
			}
		],
		onChangeRefName: SituationOnChangeRefName,
	};
}








/**
 * Skill Definitions Edition
 */

type SkillId = string;
/**
 * act::id | item::itemId::actionId
 */
type ActionId = string;

type SkillMatrixCell = undefined | 'low_skill' | 'high_skill';

type SkillOnChangeFn = (x: DataDef<SkillId>, y: DataDef<ActionId>, value: SkillMatrixCell) => void;

const SkillOnChangeRefName = 'skillDefOnChange';

const onSkillChangeRef = Helpers.useRef<SkillOnChangeFn>(SkillOnChangeRefName, () => { });

interface SkillDefinition {
	name?: string,
	actions?: Record<ActionId, 'low_skill' | 'high_skill'>,
}


export function getSkillDefinition(skillId: string) {
	const sdef = Variable.find(gameModel, 'skillsDefinitions').getProperties()[skillId];
	return parse<SkillDefinition>(sdef || "");
}

onSkillChangeRef.current = (x, y, newData) => {

	const skillId = x.id;
	const actionId = y.id;

	const def = getSkillDefinition(skillId) || { name: '', actions: {} };

	if (newData) {
		if (def.actions == null) {
			def.actions = {};
		}
		def.actions[actionId] = newData;
	} else {
		if (def.actions) {
			delete def.actions[actionId];
		}
	}

	const script = `Variable.find(gameModel, "skillsDefinitions").setProperty('${skillId}',
		 ${JSON.stringify(JSON.stringify(def))});`

	APIMethods.runScript(script, {});
};

export function getSkillsDefinitions() {
	return parseObjectDescriptor<SkillDefinition>(Variable.find(gameModel, 'skillsDefinitions'));
}

export function getSkillsDefinitionsAsChoices() {
	const situations = getSkillsDefinitions();
	const choices = Object.entries(situations).map(([situId, situDef]) => ({
		label: situDef.name || situId,
		value: situId,
	}));
	choices.push({
		label: 'none',
		value: '',
	})
	return choices;
};


export function getSkillActId(actId: string) {
	return `act::${actId}`;
}

export function getSkillItemActionId(itemId: string, actionId: string) {
	return `item::${itemId}::${actionId}`;
}

export function getSkillsDefsMatrix(): MatrixConfig<SkillId, ActionId, SkillMatrixCell> {
	const actActions = getActs()
		.sort((a, b) => {
			return a.name.localeCompare(b.name);
		}).map(act => ({
			label: `Act ${act.name}`,
			id: getSkillActId(act.id),
		}));

	const itemActions = getItems()
		.sort((a, b) => {
			return a.item.name.localeCompare(b.item.name);
		})
		.flatMap(item => {
			return Object.entries(item.item.actions).map(([actionId, action], i, entries) => {
				return {
					label: `Item ${item.item.name}${entries.length > 1 ? "/" + action.name: ''}`,
					id: getSkillItemActionId(item.id, actionId),
				};
			});
		})

	const skills = getSkillsDefinitions();

	const matrix: Record<SkillId, Record<ActionId, SkillMatrixCell>> = {};

	Object.entries(skills).forEach(([skillDef, situDef]) => {
		matrix[skillDef] = {};
		Object.entries(situDef.actions || {}).forEach(([actionId, value]) => {
			matrix[skillDef]![actionId] = value;
		});
	});

	return {
		y: [...actActions, ...itemActions],
		x: Object.entries(skills)
			.sort(([, a], [, b]) => compare(a.name, b.name))
			.map(([situId, situ]) => ({
				id: situId,
				label: situ?.name || 'no name',
			})),
		data: matrix,
		cellDef: [
			{
				type: 'enum',
				label: 'no',
				values: [undefined],
			}, {
				type: 'enum',
				label: 'low',
				values: ['low_skill'],
			}, {
				type: 'enum',
				label: 'high',
				values: ['high_skill'],
			}
		],
		onChangeRefName: SkillOnChangeRefName,
	};
}
