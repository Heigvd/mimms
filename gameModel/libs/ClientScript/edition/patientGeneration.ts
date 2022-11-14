import { Histogram, HistogramDistribution, IHistogram, NormalDistribution } from './distributionSampling'
import { getSituationDefinition } from './GameModelerHelper';
import { pickRandom } from '../tools/helper';
import { BodyFactoryParam, Sex } from '../HUMAn/human';
import { ActDefinition, ActionBodyEffect, afflictPathology, ItemDefinition } from '../HUMAn/pathology';
import { getAct, getActs, getItem, getItems, getPathologies, getPathologiesMap } from '../HUMAn/registries';
import { ActionSource, HumanTreatmentEvent, resolveAction, ScriptedEvent } from '../game/logic/the_world';
import { getCurrentPatientId, getPatientsBodyFactoryParams, parseObjectDescriptor, saveToObjectDescriptor } from '../tools/WegasHelper';
import { clearAllPatientsFromPresets, removePatientFromPresets } from './patientPreset';
import { patientGenerationLogger } from '../tools/logger';
import {getActTranslation, getItemActionTranslation, getTranslation} from '../tools/translation';

/**
 * Add patients to the existing list
 */
export function createPatients(n: number, namer?: string | ((n: number) => string) | undefined) {

	const patients: Record<string, BodyFactoryParam> = getPatientsBodyFactoryParams();

	for (let i = 1; i <= n; i++) {
		let name : string;
		if (typeof namer === 'string') {
			name = `${namer}${i}`;
		} else if (typeof namer === 'function') {
			name = namer(i);
		} else {
			name = makeOfficialUid();
		}
		while(patients[name]) // collision
		{
			name = makeOfficialUid();
		}
		patients[name] = generateOnePatient(undefined, 1);
	}
	setTestPatients(Object.values(patients));
	const patientDesc = Variable.find(gameModel, 'patients');
	saveToObjectDescriptor(patientDesc, patients);
}

export function deleteAllPatients(): void {

	if(!Editor.getFeatures().ADVANCED){
		patientGenerationLogger.error('Cannot delete all patient if not in ADVANCED mode');
		return;
	}

	patientGenerationLogger.warn('Deleting all patients !!!');

	resetCurrentPatient();

	const patientDesc = Variable.find(gameModel, 'patients');
	setTestPatients(Object.values({}));
	saveToObjectDescriptor(patientDesc, {});

	// clean up drill presets
	clearAllPatientsFromPresets();
}

/**
 * Delete one patient permanently
 */
export function deletePatient(patientId: string)
: void {
	const patients = getPatientsBodyFactoryParams();
	delete patients[patientId];
	if(getCurrentPatientId() == patientId){
		// reset current patient
		resetCurrentPatient();
	}
	const patientDesc = Variable.find(gameModel, 'patients');
	saveToObjectDescriptor(patientDesc, patients);

	// update drill presets
	removePatientFromPresets(patientId);
}


function resetCurrentPatient(): void {
	APIMethods.runScript(
		`Variable.find(gameModel, 'currentPatient').setValue(self, '');`,
		{},
	);
}

// @ts-ignore
function makeUid(length: number): string {
	let id = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < length; i++){
		id += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return id;
}

/**
 * CH-XY-123 official patient format
 */
export function makeOfficialUid(): string {

	let id = 'CH-';
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	for (let i = 0; i < 2; i++){
		id += letters.charAt(Math.floor(Math.random() * letters.length));
	}

	id += '-';
	const numbers = "0123456789";

	for (let i = 0; i < 3; i++){
		id += numbers.charAt(Math.floor(Math.random() * numbers.length));
	}

	return id;
}

// @ts-ignore
function makeRandomName(length : number): string {

	const consonants = "bcdfghjklmnprstvwxz";
	const vowels = "aeiouy";

	const all : string[] = [consonants, vowels];
	let letterType = Math.random() > 0.8 ? 1:0;

	let name = "";

	for (let i = 0; i < length; i++){
		const letters = all[letterType]!;
		name += letters.charAt(Math.floor(Math.random() * letters.length));
		letterType = (letterType + 1)%2;
	}

	return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Todo: filter pathologies according to current situation
 */
export function getAvailablePathologies(): { label: string, value: string }[] {
	const situId = Variable.find(gameModel, 'situation').getValue(self);

	if (!situId) {
		return getPathologies();
	} else {
		const situDef = getSituationDefinition(situId);
		if (situDef == null) {
			throw new Error("Situation not found");
		} else {
			const map = getPathologiesMap();
			return Object.keys(situDef.pathologies || {}).map(id => ({
				label: map[id]!,
				value: id
			}));
		}
	}
}

interface Treatment {
	label: string;
	value: string;
	action: ActionBodyEffect,
	source: ActionSource,
}

function prettyPrintActDefinition(act: ActDefinition) : string {
	return `${getTranslation('pretriage-interface', 'treatment')} ${getActTranslation(act)}`;
}

function getActTreatment(act: ActDefinition): Treatment {
	return {
		label: prettyPrintActDefinition(act),
		value: `act::${act.id}`,
		action: act.action as ActionBodyEffect,
		source: {
			type: 'act' as const,
			actId: act.id,
		}
	};
}

function prettyPrintItemAction(item: ItemDefinition, actionId: string ) : string {
	return `${getTranslation('pretriage-interface', 'treatment')} ${getItemActionTranslation(item, actionId)}`;
}

function getItemTreatment(item: ItemDefinition, actionId: string): Treatment {
	const action = item.actions[actionId]!;
	return {
		label: prettyPrintItemAction(item, actionId),
		value: `item::${item.id}::${actionId}`,
		action: action as ActionBodyEffect,
		source: {
			type: 'itemAction' as const,
			itemId: item.id,
			actionId: actionId,
		}
	};
}

export function getAvailableTreatments(): Treatment[] {
	const items = getItems().flatMap(item => {
		return Object.entries(item.item.actions)
			.filter(([, action]) => action.type === 'ActionBodyEffect')
			.map(([actionId]) =>
				getItemTreatment(item.item, actionId)
			);
	});

	const acts = getActs()
		.filter(act => act.action.type === 'ActionBodyEffect')
		.map(getActTreatment);

	return [...items, ...acts];
}

export function getAvailableTreatmentFromValue(value: string): Treatment | undefined {
	const split = value.split("::");
	if (split[0] == 'act') {
		const act = getAct(split[1])
		if (act) {
			return getActTreatment(act);
		}
	} else if (split[0] === 'item') {
		const item = getItem(split[1]!);
		const actionId = split[2]!;
		if (item) {
			return getItemTreatment(item, actionId);
		}
	}

	return undefined;
}

export function buildScriptedTreatmentPayload(treatment: Treatment, time: number): ScriptedEvent {
	const block = treatment.action.blocks[0];
	const p: ScriptedEvent = {
		time: time,
		payload: {
			type: 'HumanTreatment',
			targetType: 'Human',
			targetId: '',
			emitterPlayerId: '',
			emitterCharacterId: '',
			source: treatment.source,
			blocks: block ? [block] : [],
		}
	};
	return p;
}

export function getTreatmentName(event: HumanTreatmentEvent): string {
	const resolved = resolveAction(event);

	if (resolved?.source.type === 'act'){
		return resolved.label;
	} else if (resolved?.source.type === 'item') {
		return resolved.label;
	} else {
		return "Unhandled " + event.type;
	}
}


export function getBlocksChoices(event: HumanTreatmentEvent): { label: string, value: string }[] {
	const resolved = resolveAction(event);
	if (resolved?.action.type === 'ActionBodyEffect') {
		return resolved.action.blocks.map(b => ({
			label: b, value: b
		}))
	} else {
		return [];
	}
}

export interface PatientDistributionSettings {

	ageHistogram: IHistogram,

	heightMeanMen: number,
	heightStdDevMen: number,

	heightMeanWomen: number,
	heightStdDevWomen: number,

	BMImean: number,
	BMIstdDev: number,

	WomanManRatio: number,
}

export function buildScriptedPathologyPayload(pId: string | undefined, time: number): ScriptedEvent {
	if (!pId) {
		throw (new Error('No pathology can be afflicted'));
	} else {
		const affPathology = afflictPathology(pId);
		const p: ScriptedEvent = {
			time: time,
			payload: {
				type: 'HumanPathology',
				targetType: 'Human',
				targetId: '',
				emitterPlayerId: '',
				emitterCharacterId: '',
				...affPathology,
			}
		};
		return p;
	}
}

export class HumanGenerator {

	settings: PatientDistributionSettings;
	public readonly heightDistributionMen: NormalDistribution;
	public readonly heightDistributionWomen: NormalDistribution;
	public readonly bmiDistribution: NormalDistribution;

	public readonly ageDistribution: HistogramDistribution;

	constructor() {

		const raw = Variable.find(gameModel, 'generation_settings');
		const s = parseObjectDescriptor<PatientDistributionSettings>(raw)['generationSettings'];
		if (s == null) {
			throw new Error("Unable to fetch generation settings!");
		}
		this.settings = s;

		this.heightDistributionMen = new NormalDistribution(s.heightMeanMen, s.heightStdDevMen);
		this.heightDistributionWomen = new NormalDistribution(s.heightMeanWomen, s.heightStdDevWomen);

		const h = new Histogram(s.ageHistogram);
		this.ageDistribution = new HistogramDistribution(h);
		this.bmiDistribution = new NormalDistribution(s.BMImean, s.BMIstdDev);
	}

	public generateOneHuman(sexArg?: Sex): BodyFactoryParam {

		//pick sex if undefined
        const sex = sexArg || Math.random() > this.settings.WomanManRatio ? 'female' : 'male';

		const heightDist: NormalDistribution = sex === 'female' ? this.heightDistributionWomen : this.heightDistributionMen;
		const height = Math.floor(heightDist.sample());

		const age = Math.floor(this.ageDistribution.sample());
		const bmi = Math.round((this.bmiDistribution.sample() + Number.EPSILON) * 100) / 100;

		const h: BodyFactoryParam = {
			sex: sex,
			age: age,
			height_cm: height,
			bmi: bmi,
			lungDepth: 1,
		}

		return h;
	}

	// TODO gravity factor and more configuration and avoid apply twice with the same parameters
	public addPathologies(human: BodyFactoryParam, n: number, time: number = 10): BodyFactoryParam {

		if (!human.scriptedEvents) {
			human.scriptedEvents = [];
		}

		const pList = getAvailablePathologies();
		for (let i = 0; i < n; i++) {

			const def = pickRandom(pList);
			// TODO : time
			const p = buildScriptedPathologyPayload(def?.value, time);
			human.scriptedEvents.push(p);
		}

		return human;
	}


	/**
	 * Add random treatment
	 */
	public addTreatments(human: BodyFactoryParam, n: number, time: number = 10): BodyFactoryParam {

		if (!human.scriptedEvents) {
			human.scriptedEvents = [];
		}

		const list = getAvailableTreatments();
		for (let i = 0; i < n; i++) {

			const def = pickRandom(list);
			// TODO : time
			const p = buildScriptedTreatmentPayload(def!, time);
			human.scriptedEvents.push(p);
		}

		return human;
	}
}

export let testPatients: BodyFactoryParam[] = [];

export function setTestPatients(newPatients: BodyFactoryParam[]) {
	testPatients = newPatients;
}

export const getHumanGenerator = (() => {
	let pg: HumanGenerator | undefined = undefined;

	return () => {
		if (!pg) {
			pg = new HumanGenerator();
		}
		return pg;
	}
})();

export function generateOnePatient(sex?: Sex, nPathologies?: number): BodyFactoryParam {
	const h = getHumanGenerator().generateOneHuman(sex);
	return getHumanGenerator().addPathologies(h, nPathologies || 0);
}

export function generateTestPatients(forceNew: boolean) {

	if (forceNew) {
		testPatients = [];
	}
	if (testPatients.length > 0)
		return;

	for (let i = 0; i < 10000; i++) {
		testPatients.push(getHumanGenerator().generateOneHuman());
	}
}

function _generateTestPoints(min: number, max: number, attr: string, humans: BodyFactoryParam[]) {
	const size = max - min;
	const counts = new Array(size).fill(0);
	for (let i = 0; i < humans.length; i++) {
		const v = Math.floor((humans[i] as any)[attr]);
		counts[v - min]++;
	}

	const points = counts.map((v, i) => { return { x: min + i, y: v / humans.length } }, []);
	return [{ label: attr, points: points }];
}

export function generateTestPoints(min: number, max: number, attr: string) {
	generateTestPatients(false);
	wlog('Generating points for ', attr, min, max);
	return _generateTestPoints(min, max, attr, testPatients);
}

export function testPatientsHeight() {
	const min = Math.floor(getHumanGenerator().heightDistributionWomen.min());
	const max = Math.ceil(getHumanGenerator().heightDistributionMen.max());
	return generateTestPoints(min, max, 'height_cm');
}

export function testPatientBmi() {
	const d = getHumanGenerator().bmiDistribution;
	return generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'bmi');
}

export function testPatientAge() {
	const d = getHumanGenerator().ageDistribution;
	return generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'age');
}

export function getPatientsHeight() {
	const min = Math.floor(getHumanGenerator().heightDistributionWomen.min());
	const max = Math.ceil(getHumanGenerator().heightDistributionMen.max());
	const humans = Object.values(getPatientsBodyFactoryParams());
	return _generateTestPoints(min, max, 'height_cm', humans);
}

export function getPatientBmi() {
	const d = getHumanGenerator().bmiDistribution;
	const humans = Object.values(getPatientsBodyFactoryParams());
	return _generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'bmi', humans);
}

export function getPatientAge() {
	const d = getHumanGenerator().ageDistribution;
	const humans = Object.values(getPatientsBodyFactoryParams());
	return _generateTestPoints(Math.floor(d.min()), Math.ceil(d.max()), 'age', humans);
}
