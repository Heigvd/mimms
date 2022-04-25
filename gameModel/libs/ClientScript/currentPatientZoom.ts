import { checkUnreachable } from "./helper";
import { Block, BodyEffect, BodyStateKeys, readKey } from "./HUMAn";
import { logger } from "./logger";
import { ActDefinition, ActionBodyEffect, ActionBodyMeasure, ItemDefinition, PathologyDefinition } from "./pathology";
import { getItem, getPathology } from "./registries";
import { getCurrentPatientBody, getHealth, getHuman, getMyInventory, getMyMedicalActs } from "./the_world";
import { getCurrentSimulationTime } from "./TimeManager";

export interface PatientZoomState {
	logs: string[];
	currentPatient: string | undefined;
	selectedItem: string | undefined;
	selectedAction: string | undefined;
	selectedActionType: ItemDefinition['actions'][number]['type'] | undefined;
	selectedBlock: string | undefined;
	blockRequired: boolean;
}

type SetZoomState = (state: PatientZoomState | ((currentState: PatientZoomState) => PatientZoomState)) => void;

interface FullState {
	state: PatientZoomState;
	setState: SetZoomState;
}

export function getInitialPatientZoomState(): PatientZoomState {
	return {
		logs: [],
		currentPatient: undefined,
		selectedItem: undefined,
		selectedAction: undefined,
		selectedActionType: undefined,
		selectedBlock: undefined,
		blockRequired: false,
	}
}

export function keepStateAlive({ state, setState }: FullState) {
	const ePatient = I18n.toString(Variable.find(gameModel, 'currentPatient'))
	const cPatient = state.currentPatient;
	if (ePatient !== cPatient) {
		setState({
			...getInitialPatientZoomState(),
			currentPatient: ePatient
		});
	}
}

export interface PreparedItem {
	itemId: string;
	item: ItemDefinition;
	count: number | 'infinity'
}

export interface PreparedAction {
	itemId: string;
	actionId: string;
	actionType: ItemDefinition['actions'][number]['type'];
	name: string;
	blockRequired: boolean;
}

export function getAvailableItems(): PreparedItem[] {
	const inventory = getMyInventory();

	return inventory.flatMap(item => {
		const itemDef = getItem(item.itemId);

		if (itemDef != null) {
			return [{
				itemId: item.itemId,
				item: itemDef,
				count: item.count,
			}];
		} else {
			return [];
		}
	});
}

export function getAvailableActions({ selectedItem }: PatientZoomState): PreparedAction[] {
	if (selectedItem != null) {
		const itemDef = getItem(selectedItem);
		if (itemDef != null) {
			return Object.entries(itemDef.actions).map(([key, action]) => {
				return {
					itemId: selectedItem,
					actionId: key,
					name: action.name,
					actionType: action.type,
					blockRequired: action.type === 'ActionBodyEffect',
				};
			});
		}
	}
	return [];
}

export function getAvailableBlocks({ selectedAction, selectedItem }: PatientZoomState): { id: string }[] | undefined {
	if (selectedItem != null && selectedAction != null) {
		const itemDef = getItem(selectedItem);
		if (itemDef != null) {
			const action = itemDef.actions[selectedAction];
			if (action != null) {
				if (action.type === 'ActionBodyEffect') {
					return action.blocks.map(b => ({ id: b }));
				} else {
					return [];
				}
			}
		}
	}
	return undefined;
}



export function selectItem({ item }: PreparedItem, setState: SetZoomState) {

	const actions = Object.keys(item.actions);
	const selectedAction = actions.length === 1 ? actions[0] : undefined;

	const action = selectedAction ? item.actions[selectedAction] : undefined;

	setState(state => {
		const newState = { ...state };
		newState.selectedItem = item.id;
		newState.selectedAction = selectedAction;
		newState.selectedActionType = action?.type;
		newState.selectedBlock = undefined;
		newState.blockRequired = action?.type === 'ActionBodyEffect';
		return newState;
	})
}


export function selectAction({ itemId, actionId, blockRequired, actionType }: PreparedAction, setState: SetZoomState) {
	setState(state => {
		const newState = { ...state };
		newState.selectedItem = itemId;
		newState.selectedAction = actionId;
		newState.selectedActionType = actionType;
		newState.selectedBlock = undefined;
		newState.blockRequired = blockRequired
		return newState;
	});
}



export function selectBlock(block: string, setState: SetZoomState) {
	setState(state => {
		const newState = { ...state };
		newState.selectedBlock = block;
		return newState;
	})
}

function prettyPrintKey(key: BodyStateKeys): string {
	switch (key) {
		case 'vitals.canWalk':
			return '';
		case 'vitals.cardio.MAP':
			return 'MAP';
		case 'vitals.cardio.hr':
			return 'Heart rate';
		case 'vitals.respiration.SaO2':
			return "SpO2";
		default:
			return key;
	}
}

function doMeasure(action: ActionBodyMeasure, setState: SetZoomState) {
	const name = action.name;
	const metrics = action.metricName;
	const body = getCurrentPatientBody();
	const values = metrics.map((metric, i) => {
		let value = readKey(body.state, metric);
		if (action.formatter) {
			const formatter = action.formatter[i];
			if (formatter) {
				if (formatter === 'PERCENT') {
					if (typeof value === 'number') {
						value = (value * 100).toFixed() + " %";
					} else {
						wlog("Value is not a number (PERCENT formatter)");
					}
				} else if (formatter === 'INT') {
					if (typeof value === 'number') {
						value = value.toFixed();
					} else {
						wlog("Value is not a number (int formatter)");
					}
				} else if (formatter === '.2') {
					if (typeof value === 'number') {
						value = value.toFixed(2);
					} else {
						wlog("Value is not a number (.2 formatter)");
					}
				} else {
					checkUnreachable(formatter);
				}
			}
		}
		return `${prettyPrintKey(metric)}: ${value}`;
	}).join("<br />");
	setState(state => ({
		...state,
		logs: [...state.logs, name, values]
	}))
}

export function doItemAction({ state, setState }: FullState) {
	if (state.selectedItem != null && state.selectedAction != null) {
		const item = getItem(state.selectedItem);
		if (item != null) {
			const action = item.actions[state.selectedAction];
			const block = state.selectedBlock;

			switch (action.type) {
				case 'ActionBodyEffect':
					wlog("Do Action: ", item.id, action.name, block);
					break;
				case 'ActionBodyMeasure':
					// TODO disposable item may be destroyed by action
					doMeasure(action, setState);
					break;
			}
		}
	} else {
		setState(state => {
			return { ...state, logs: [...state.logs, "Woohps..."] };
		});

	}
}



export function doAct(act: ActDefinition, setState: SetZoomState) {
	const action = act.action;
	switch (action.type) {
		case 'ActionBodyEffect':
			wlog("Do Action: ", action.name);
			break;
		case 'ActionBodyMeasure':
			doMeasure(action, setState);
			break;
	}
}


function getBlockDetails(block: Block | undefined): string[] {
	const output: string[] = [];
	if (block) {
		output.push(`<h4>${block.name}</h4>`);
		logger.info("Block: ", block.params);
		if (block.params.totalExtLosses_ml ?? 0 > 0) {
			output.push("<h5>Hemmoragia</h5>");
			if (block.params.extLossesFlow_mlPerMin ?? 0 > 0) {
				const arterialLoss = (block.params.arterialBleedingFactor ?? 0) - (block.params.arterialBleedingReductionFactor ?? 0) > 0;
				const venousLoss = (block.params.venousBleedingFactor ?? 0) - (block.params.venousBleedingReductionFactor ?? 0) > 0;

				output.push("<div>Arterial: " + arterialLoss + "</div>");
				output.push("<div>Venous: " + venousLoss + "</div>");

				output.push("<div>Active: " + block.params.extLossesFlow_mlPerMin + " mL/min</div>");

			} else {
				output.push("<div>Hemostasis</div>");
			}
		}
		if (block.params.broken) {
			output.push("<div>Bone is broken</div>");
		}

		if (block.params.fiO2 != null && block.params.fiO2 !== 'freshAir') {
			output.push("<div>FiO2: " + block.params.fiO2 + "</div>");
		}

		if (block.params.intubated) {
			output.push("<div>Intubated</div>");
		}
	}

	return output;
}

export function getDetails() {

	const id = I18n.toString(Variable.find(gameModel, 'currentPatient'));

	const human = getHuman(id);
	const health = getHealth(id);
	const currentTime = getCurrentSimulationTime();

	const output: string[] = ["<h3>Details</h3>"];

	if (human != null) {
		const blocks: Record<string, {
			pathologies: PathologyDefinition[];
			effects: BodyEffect[];
		}> = {};

		const pathologies = health.pathologies.filter(p => p.time < currentTime);
		const effects = health.effects.filter(p => p.time < currentTime);
		//logger.warn("Spy: ", { health, currentTime });
		pathologies.forEach(p => {
			const pathology = getPathology(p.pathologyId);
			if (pathology != null) {
				p.afflictedBlocks.forEach(blockName => {
					const block = blocks[blockName] || { effects: [], pathologies: [] };
					block.pathologies.push(pathology);
					blocks[blockName] = block;

				});
			}
		});
		effects.forEach(effect => {
			effect.afflictedBlocks.forEach(blockName => {
				if (effect != null) {
					const block = blocks[blockName] || { effects: [], pathologies: [] };
					block.effects.push(effect);
					blocks[blockName] = block;
				}
			});
		});
		const entries = Object.entries(blocks);
		if (entries.length > 0) {

			entries.forEach(([blockName, data]) => {
				const block = human.state.blocks.get(blockName);
				output.push(...getBlockDetails(block));
				//output.push(`<h4>${blockName}</h4>`);
				//output.push(...data.pathologies.map(p => p.name));
				output.push(...data.effects.map(e => {
					return `${e.item.name}/${e.action.name}`;
				}));
			});
		} else {
			output.push("<em>nothing visible</em>");
		}
	} else {
		output.push("<em>nothing visible</em>");
	}


	return output.join("");
}

// const acts = getMyMedicalActs();