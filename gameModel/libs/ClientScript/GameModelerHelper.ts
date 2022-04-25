import { BodyFactoryParam, createHumanBody } from "./HUMAn";
import { getCurrentHumanId, getEnv, parseObjectDescriptor, saveToObjectDescriptor } from "./WegasHelper";

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
	const meta = getCurrentHumanId();
	const initialBody = createHumanBody(meta!, env);

	const vitals = initialBody.state.vitals;

	const list: string[] = [];
	extractAllKeys(vitals, "", list);

	return list.map(key => ({ label: key, key }));
}


export function extractBlockChoices() {
	// Instantiate a body
	const env = getEnv();
	const meta = getCurrentHumanId()!;
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


export function createBodyParam(): BodyFactoryParam {
	return {
		age: 21,
		bmi: 22.5,
		height_cm: 170,
		lungDepth: 1,
		sex: 'male'
	}
}


export function createPatients(n: number, namer: string | ((n:  number) => string)) {
	const patientDesc = Variable.find(gameModel, 'patients');
	const patients = parseObjectDescriptor<BodyFactoryParam>(patientDesc);

	for (let i = 1; i <= n; i++) {
		let name = `${i}`;
		if (typeof namer === 'string'){
			name = `${namer}${i}`;
		} else if (typeof namer === 'function'){
			name = namer(i);
		}
		patients[name] = createBodyParam();
	}
	saveToObjectDescriptor(patientDesc, patients);
}