/*
 * License to be defined
 *
 * Copyright (2021-2022)
 *  - School of Management and Engineering Vaud (AlbaSim, MEI, HEIG-VD, HES-SO)
 *  - Hôpitaux Universitaires Genêve (HUG)
 */

import {
	ChemicalDefinition,
	ItemDefinition,
	PathologyDefinition,
	ActDefinition,
} from './pathology';
import { SympSystem } from './physiologicalModel';
import { initPathologies } from '../HUMAn/registry/pathologies';
import { initItemAndActs } from '../HUMAn/registry/acts';

const pathologies: Record<string, PathologyDefinition> = {};
const items: Record<string, ItemDefinition> = {};
const acts: Record<string, ActDefinition> = {};
const chemicals: Record<string, ChemicalDefinition> = {};

let model: SympSystem = {};
// let compensation: Compensation | undefined = undefined;
// let overdrive: Compensation | undefined = undefined;

let initialized = false;


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

/*export function getCompensationModel(): Compensation | undefined {
	return compensation;
}*/

/* export function setCompensationModel(c: Compensation) {
	compensation = c;
}*/


/*export function getOverdriveModel(): Compensation | undefined {
	return overdrive;
}

export function setOverdriveModel(c: Compensation) {
	overdrive = c;
}*/

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

	//const venousBlocks = substraction<ExternalBlock>(extBlocks, ['HEAD', 'ABDOMEN', 'PELVIS']);
	////////////////////////////////////////
	// Pathologies
	////////////////////////////////////////

	initPathologies(pathologies);

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

	initItemAndActs(items, acts);
	
}
