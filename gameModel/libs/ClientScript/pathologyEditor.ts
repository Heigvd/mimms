
/**
 * Pathology editor
 */

import { checkUnreachable, Range } from "./helper";
import { BlockName, BodyFactoryParam } from "./HUMAn/human";
import { AfflictedPathology, airwaysResistanceArgKeys, burnArgKeys, hemorrhageArgKeys, icpArgKeys, ModuleMeta, pneumothoraxArgKeys, prettyPrinterAfflictedPathology, tamponadeArgKeys } from "./HUMAn/pathology";
import { buildScriptedPathologyPayload, buildScriptedTreatmentPayload, getAvailableTreatmentFromValue, getHumanGenerator } from "./patientGeneration";
import { getPathology } from "./HUMAn/registries";
import { ScriptedEvent } from "./the_world";
import { getBodyParam, getCurrentPatientId } from "./WegasHelper";


interface PathologyEditorContext {
	id: number;
	patientId: string;
	pathologyId: string;
	description: string;
	modules: {
		id: number;
		block: BlockName,
		meta: ModuleMeta
	}[];
	presets: BlockName[][][] | undefined;
	preset: number | undefined;
	afflictedPathology: AfflictedPathology;
}

export function prettyPrintModule(meta: ModuleMeta) {
	if (meta.config.type === 'Hemorrhage') {
		return `${meta.config.type}, ${meta.config.subtype}`;
	} else if (meta.config.type === 'Fracture') {
		return `${meta.config.type}, ${meta.config.fractureType}`;
	} else if (meta.config.type === 'Pneumothorax') {
		return `${meta.config.type}, ${meta.config.pneumothoraxType}`;
	} else if (meta.config.type === 'Burn') {
		return `${meta.config.type}, degree: ${meta.config.level}`;
	}
	return meta.config.type;
}

export function getPathologyEditorContext(): PathologyEditorContext {
	return Context.pathologyEditorContext;
}

function getConfigFromAfflictedPathology(
	id: number,
	patientId: string,
	ap: AfflictedPathology,
): PathologyEditorContext {
	const definition = getPathology(ap.pathologyId);
	if (definition == null) {
		throw new Error("Pathology does not exist");
	}

	const mods = definition.modules.map((mDef, i) => {
		const mArgs = ap.modulesArguments[i];
		return {
			id: i,
			type: mDef.type,
			block: ap.afflictedBlocks[i]!,
			meta: {
				config: mDef,
				args: mArgs,
			} as ModuleMeta // TODO typecheck !!!
		}
	});
	let preset: number | undefined = undefined;

	if (definition.presets != null && definition.presets.length > 0) {
		// auto-detect selected preset
		const find = definition.presets.findIndex(preset => {
			for (const i in ap.afflictedBlocks) {
				const ab = ap.afflictedBlocks[i]!;
				if (preset[i]!.includes(ab)) {
					return true;
				}
			}

			return false;
		});
		if (find >= 0) {
			preset = find;
		}
	}

	return {
		id: id,
		patientId: patientId,
		pathologyId: ap.pathologyId,
		description: definition.name,
		modules: mods,
		afflictedPathology: ap,
		presets: definition.presets,
		preset: preset,
	};
}


export function getPatientPathologyConfigs(patientId: string): PathologyEditorContext[] {
	const param = getBodyParam(patientId);
	if (param == null) {
		throw new Error("Patient not found");
	}

	return (param.scriptedEvents || [])
		.flatMap(event => {
			if (event.payload.type === 'HumanPathology') {
				return [event.payload];
			} else {
				return [];
			}
		})
		.map((payload, i) => getConfigFromAfflictedPathology(i, patientId, payload));
}

export function prettyPrintScript(script: ScriptedEvent[] = []): string {
	if (script.length > 0) {
		return (script || [])
			.map(event => {
				if (event.payload.type === 'HumanPathology') {
					return prettyPrinterAfflictedPathology(event.payload);
				} else if (event.payload.type === 'HumanTreatment') {
					const source = event.payload.source;
					return `${source.type === 'act' ? source.actId : source.itemId}`;
				} else if (event.payload.type === 'Teleport') {
					return '';
				} else {
					checkUnreachable(event.payload)
				}
			})
			.join('<br />');
	}

	return 'Patient is healthy';
}


/**
 * persist patient
 * Overide patient description
 */
function persistPatient(patientId: string, param: BodyFactoryParam, generateDescription: boolean) {
	if (generateDescription){
		param.description = prettyPrintScript(param.scriptedEvents);
	}

	const script = `Variable.find(gameModel, "patients").setProperty('${patientId}', ${JSON.stringify(JSON.stringify(param))})`
	APIMethods.runScript(script, {});
}

export function generateDescription(patientId: string, param: BodyFactoryParam){
	persistPatient(patientId, param, true);
}

export function saveDescription(patientId: string, param: BodyFactoryParam, description: string) {
	param.description = description;
	persistPatient(patientId, param, false);
}

export function removeScriptedEvent(patientId: string, param: BodyFactoryParam, eventIndex: number) {
	if (param.scriptedEvents) {
		param.scriptedEvents.splice(eventIndex, 1);
		persistPatient(patientId, param, true);
	} else {
		wlog("Unable to remove scripted event");
	}
}

export function changePathology(patientId: string, param: BodyFactoryParam, pathologyIndex: number, pathologyId: string, time: number) {
	const p = buildScriptedPathologyPayload(pathologyId, time);

	(param.scriptedEvents || []).splice(pathologyIndex, 1, p);

	persistPatient(patientId, param, true);
}

export function inoculate(patientId: string, param: BodyFactoryParam, pathologyId: string, time: number) {
	const p = buildScriptedPathologyPayload(pathologyId, time);

	if (param.scriptedEvents == null) {
		param.scriptedEvents = [];
	}
	param.scriptedEvents.push(p);

	persistPatient(patientId, param, true);
}

export function inoculateRandom(patientId: string, param: BodyFactoryParam, time: number) {
	getHumanGenerator().addPathologies(param, 1, time);
	persistPatient(patientId, param, true);
}


export function addRandomTreatment(patientId: string, param: BodyFactoryParam, time: number) {
	getHumanGenerator().addTreatments(param, 1, time);
	persistPatient(patientId, param, true);
}


export function changeTreatment(patientId: string, param: BodyFactoryParam, tIndex: number, newTreatment: string, time: number) {

	const treatment = getAvailableTreatmentFromValue(newTreatment);

	if (treatment) {
		if (param.scriptedEvents == null) {
			param.scriptedEvents = [];
		}

		const p = buildScriptedTreatmentPayload(treatment, time);
		param.scriptedEvents.splice(tIndex, 1, p);
		persistPatient(patientId, param, true);
	}
}


function updatePatientPathology(patientId: string, newAp: AfflictedPathology) {
	const param = getBodyParam(patientId);
	if (param) {
		const context = getPathologyEditorContext();

		const pathologyIndex = context.id;

		if (param?.scriptedEvents) {
			const current = param.scriptedEvents[pathologyIndex]!.payload;
			param.scriptedEvents[pathologyIndex]!.payload = { ...current, ...newAp };
		}
		persistPatient(patientId, param, true);
	}
}

export function getCurrentPatientPathologyConfigs(): PathologyEditorContext[] {
	return getPatientPathologyConfigs(getCurrentPatientId());
}

export function getArgumentKeys(mod: ModuleMeta): Readonly<string[]> {
	switch (mod.args.type) {
		case 'HemorrhageArgs':
			return hemorrhageArgKeys;
		case 'AirwaysResistanceArgs':
			return airwaysResistanceArgKeys;
		case 'BurnArgs':
			return burnArgKeys;
		case 'ICPArgs':
			return icpArgKeys;
		case 'NoArgs':
			return [];
		case 'PneumothoraxArgs':
			return pneumothoraxArgKeys;
		case 'TamponadeArgs':
			return tamponadeArgKeys;
	}
}


export function getModuleArguments(moduleMeta: ModuleMeta) {
	return getArgumentKeys(moduleMeta).flatMap(key => {
		// @ts-ignore: check typings
		const aConfig: Range | undefined = moduleMeta.config[key];
		if (aConfig) {
			return [{
				id: key,
				min: aConfig.min,
				max: aConfig.max,
				// @ts-ignore: check typings
				value: moduleMeta.args[key] as number ?? aConfig.min,
			}];
		} else {
			return [];
		}
	});
}

export function getBlockChoices() {
	const moduleIndex = Context.module.id;
	const context = getPathologyEditorContext();
	const mod = context.modules[moduleIndex]!;
	if (context.preset ?? -1 >= 0) {
		if (context.presets) {
			const p = context.presets[context.preset!];
			if (p) {
				return p[moduleIndex]!.map(block => ({
					value: block,
					label: block,
				}));
			}
		}
	}
	return mod.meta.config.blocks.map(block => ({
		value: block,
		label: block,
	}));
}



export function updateModuleBlock(blockName: BlockName) {
	const context = getPathologyEditorContext();

	const moduleIndex = Context.module.id;

	const ap = context.afflictedPathology;
	ap.afflictedBlocks[moduleIndex] = blockName

	updatePatientPathology(context.patientId, ap);
}


export function updateModuleArg(value: number) {
	const context = getPathologyEditorContext();

	const moduleIndex = Context.module.id;
	const key = Context.moduleArg.id;


	const ap = context.afflictedPathology;

	const args = ap.modulesArguments[moduleIndex];

	// @ts-ignore: check typings
	args[key] = value;

	updatePatientPathology(context.patientId, ap);
}