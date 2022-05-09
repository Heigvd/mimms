import { checkUnreachable } from "./helper";
import { Block, BodyEffect, BodyStateKeys, readKey } from "./HUMAn";
import { logger } from "./logger";
import { ABCDECategory, ActDefinition, ActionBodyEffect, ActionBodyMeasure, HumanAction, ItemDefinition, PathologyDefinition } from "./pathology";
import { getAct, getItem, getPathology } from "./registries";
import { getCurrentPatientBody, getHealth, getHuman, getMyInventory, getMyMedicalActs, InventoryEntry } from "./the_world";
import { getCurrentSimulationTime } from "./TimeManager";


/////////////////////////////////
// The Wheel
/////////////////////////////////

interface BaseItem {
	id: string;
	label: string;
	icon?: string;
}

interface WithActionType {
	actionType: HumanAction['type'];
	actionCategory: HumanAction['category'];
}

type WheelItemAction = BaseItem & WithActionType & {
	type: "WheelItemAction",

	itemActionId: {
		itemId: string;
		actionId: string;
	};
	counter: Number | 'infinity';
}

type WheelAct = BaseItem & WithActionType & {
	type: "WheelAct";
}

type WheelAction = WheelItemAction | WheelAct;

type SubMenu = BaseItem & {
	type: "WheelSubMenu";
	id: string;
	items: WheelAction[];
}

type WheelItem = SubMenu | WheelAction;

type Wheel = WheelItem[];



/////////////////////////////////
// The State
/////////////////////////////////

export interface PatientZoomState {
	logs: string[];
	currentPatient: string | undefined;
	selectedAction: WheelAction | undefined;
	selectedMenu: string;
	selectedBlock: string | undefined;
	availableBlocks: string[];
}

export function getInitialPatientZoomState(): PatientZoomState {
	return {
		selectedAction: undefined,
		selectedMenu: "",
		availableBlocks: [],
		selectedBlock: undefined,
		logs: [],
		currentPatient: undefined,
	};
}

export type SetZoomState = (state: PatientZoomState | ((currentState: PatientZoomState) => PatientZoomState)) => void;

interface FullState {
	state: PatientZoomState;
	setState: SetZoomState;
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

export function clearConsole(setState: SetZoomState){
	setState(state => {
		return {...state, logs: []};
	});
}

function getActionIcon(action: HumanAction): string {
	if (action.type === 'ActionBodyEffect') {
		return "syringe";
	} else if (action.type === 'ActionBodyMeasure') {
		return "ruler";
	}
	return "";
}

function getWheelActionFromInventory(inventory: InventoryEntry[]): WheelAction[] {
	return inventory.flatMap(inventoryItem => {
		const item = getItem(inventoryItem.itemId);

		if (item != null) {
			return Object.entries(item.actions).map(([key, action]) => {
				return {
					id: `${item.id}::${key}`,
					label: `${item.name} ${action.name}`,
					type: 'WheelItemAction',
					actionType: action.type,
					actionCategory: action.category,
					itemActionId: {
						itemId: item.id,
						actionId: key,
					},
					icon: getActionIcon(action),
					counter: inventoryItem.count,
				};
			});
		}

		return [];
	})
}


function getWheelActionFromActs(acts: ActDefinition[]): WheelAction[] {
	return acts.map(act => {
		return {
			type: 'WheelAct',
			actionType: act.action.type,
			actionCategory: act.action.category,
			id: act.id,
			label: act.name,
			icon: getActionIcon(act.action),
		};
	});
}

function getItemsWheel(): Wheel {
	const itemActions = getWheelActionFromInventory(getMyInventory());
	const actActions = getWheelActionFromActs(getMyMedicalActs());

	return [{
		type: 'WheelSubMenu',
		id: 'itemsMenu',
		label: 'Items',
		icon: 'briefcase-medical',
		items: itemActions,
	}, {
		type: 'WheelSubMenu',
		id: 'actsMenu',
		label: 'Acts',
		icon: 'hand-sparkles',
		items: actActions,
	}];
}

interface ByType {
	measures: WheelAction[],
	treatments: WheelAction[],
}

function populateByTypes(actions: WheelAction[], bag: ByType) {
	actions.forEach(a => {
		if (a.actionType === "ActionBodyEffect") {
			bag.treatments.push({ ...a, icon: 'syringe' });
		} else if (a.actionType === "ActionBodyMeasure") {
			bag.measures.push({ ...a, icon: 'ruler' });
		}
	});
}

function getActionsWheel(): Wheel {
	const itemActions = getWheelActionFromInventory(getMyInventory());
	const actActions = getWheelActionFromActs(getMyMedicalActs());

	const byTypes: ByType = {
		measures: [],
		treatments: [],
	};

	populateByTypes(itemActions, byTypes);
	populateByTypes(actActions, byTypes);

	return [{
		type: 'WheelSubMenu',
		id: 'measureMenu',
		label: 'Measures',
		items: byTypes.measures,
		icon: 'ruler',
	}, {
		type: 'WheelSubMenu',
		id: 'treatmentMenu',
		label: 'Treatments',
		items: byTypes.treatments,
		icon: 'syringe',
	}];
}

function getABCDEWheel(): Wheel {
	const itemActions = getWheelActionFromInventory(getMyInventory());
	const actActions = getWheelActionFromActs(getMyMedicalActs());

	const categories: Record<ABCDECategory, SubMenu> = {
		'A': {
			id: 'aMenu',
			label: 'A',
			icon: 'wind',
			items: [],
			type: 'WheelSubMenu'
		},
		'B': {
			id: 'bMenu',
			label: 'B',
			icon: 'lungs',
			items: [],
			type: 'WheelSubMenu'
		},
		'C': {
			id: 'cMenu',
			label: 'C',
			icon: 'heartbeat',
			items: [],
			type: 'WheelSubMenu'
		},
		'D': {
			id: 'dMenu',
			label: 'D',
			icon: 'dizzy',
			items: [],
			type: 'WheelSubMenu'
		},
		'E': {
			id: 'eMenu',
			label: 'E',
			icon: 'stethoscope',
			items: [],
			type: 'WheelSubMenu'
		},
		'Z': {
			id: 'zMenu',
			label: 'F',
			icon: 'comments',
			items: [],
			type: 'WheelSubMenu'
		},
	};

	itemActions.forEach(a => {
		categories[a.actionCategory].items.push(a);
	});

	actActions.forEach(a => {
		categories[a.actionCategory].items.push(a);
	})

	return Object.values(categories);
}

/**
 *
 */
type WheelType = 'ABCDE' | 'ITEMS' | 'ACTIONS';

function getWheelType(): WheelType {
	return Variable.find(gameModel, "patientWheelType").getValue(self) as WheelType || 'ITEMS';
}

export function getWheel(): Wheel {
	const wType = getWheelType();
	switch (wType) {
		case 'ABCDE':
			return getABCDEWheel();
		case 'ITEMS':
			return getItemsWheel();
		case 'ACTIONS':
			return getActionsWheel();
	}
}



/////////////////////////////////
// The Wheel Helpers
/////////////////////////////////

export function getButtonLabel(item: WheelItem) {
	switch (item.type) {
		case 'WheelAct':
			return item.label;
		case 'WheelItemAction':
			return `${item.label} (${item.counter === 'infinity' ? "∞" : item.counter})`;
		case 'WheelSubMenu':
			return item.label
	}
}

export function getWheelSubmenuTitle(state: PatientZoomState): string {
	const wheel = getWheel();
	const menu = wheel.find(item =>
		item.type === 'WheelSubMenu' && item.id === state.selectedMenu
	);
	if (menu != null) {
		return menu.label;
	}
	return "nothing selected";
}


export function getWheelSubmenu(state: PatientZoomState,): WheelAction[] {
	const wheel = getWheel();
	const menu = wheel.find(item =>
		item.type === 'WheelSubMenu' && item.id === state.selectedMenu
	);
	if (menu != null) {
		return (menu as SubMenu).items;
	}
	return [];
}

export function selectWheelMenu(menuId: string, setState: SetZoomState) {
	setState(state => {
		return { ...state, selectedMenu: menuId }
	})
}

export function selectWheelAction(action: WheelAction | undefined, setState: SetZoomState) {
	if (action?.actionType === 'ActionBodyEffect') {
		const rAction = resolveAction<ActionBodyEffect>(action, "ActionBodyEffect");

		const blocks = rAction?.blocks || [];
		const block = blocks.length === 1 ? blocks[0] : undefined;

		setState(state => {
			return {
				...state,
				selectedAction: action,
				selectedBlock: block,
				availableBlocks: blocks,
			};
		});
	} else {
		setState(state => {
			return {
				...state,
				selectedAction: action,
				selectedBlock: undefined,
				availableBlocks: []
			};
		});
	}
}

export function selectWheelItem(item: WheelItem, setState: SetZoomState) {
	if (item.type === 'WheelSubMenu') {
		selectWheelMenu(item.id, setState);
	} else {
		selectWheelAction(item, setState);
	}
}

export function selectWheelBlock(block: string, setState: SetZoomState) {
	setState(state => {
		return {
			...state,
			selectedBlock: state.availableBlocks.includes(block) ? block : undefined,
		};
	});
}

/////////////////////////////////
// Do Action
/////////////////////////////////

function resolveAction<T extends HumanAction>(wheelAction: WheelAction, aType: T['type']): T | undefined {
	if (wheelAction.actionType === aType) {
		if (wheelAction.type === 'WheelAct') {
			const act = getAct(wheelAction.id);
			if (act?.action?.type === aType) {
				return act.action as T;
			}
		} else if (wheelAction.type === 'WheelItemAction') {
			const item = getItem(wheelAction.itemActionId.itemId);
			if (item != null) {
				const action = item.actions[wheelAction.itemActionId.actionId];
				if (action?.type === aType) {
					return action as T;
				}
			}
		}
	}
}

function postEvent(measure: WheelAction) {

}

export function doWheelMeasure(measure: WheelAction, setState: SetZoomState) {
	const action = resolveAction<ActionBodyMeasure>(measure, 'ActionBodyMeasure');

	if (action != null) {
		doMeasure(action, setState);
	}
}


export function doWheelTreatment(treatment: WheelAction, block: string, setState: SetZoomState) {
	const action = resolveAction<ActionBodyEffect>(treatment, 'ActionBodyEffect');

	if (action != null) {
		const source = treatment.type === 'WheelAct' ? {
			type: 'act',
			actId: treatment.id,
		} : {
			type: 'itemAction',
			...treatment.itemActionId
		};
		APIMethods.runScript(`EventManager.doHumanTreatment(
				Context.humanId, {
					type: Context.source.type,
					actId: Context.source.actId,
					itemId: Context.source.itemId,
					actionId: Context.source.actionId,
				}, block ? [Context.block]: []);`, {
			humanId: Context.patientConsole.state.currentPatient,
			source: source,
			block: block,
		});
	}
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


function getBlockDetails(block: Block | undefined): string[] {
	const output: string[] = [];
	if (block) {
		output.push(`<h4>${block.name}</h4>`);
		logger.info("Block: ", block.params);
		if (block.params.totalExtLosses_ml ?? 0 > 0) {
			output.push("<h5>Hemorrhage</h5>");
			if (block.params.extLossesFlow_mlPerMin ?? 0 > 0) {
				const arterialLoss = (block.params.arterialBleedingFactor ?? 0) - (block.params.arterialBleedingReductionFactor ?? 0) > 0;
				const venousLoss = (block.params.venousBleedingFactor ?? 0) - (block.params.venousBleedingReductionFactor ?? 0) > 0;

				output.push("<div>Arterial: " + arterialLoss + "</div>");
				output.push("<div>Venous: " + venousLoss + "</div>");

				output.push("<div>Active: " + (block.params.extLossesFlow_mlPerMin ?? 0).toFixed() + " mL/min</div>");

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
					return `${e.source.name}/${e.action.name}`;
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