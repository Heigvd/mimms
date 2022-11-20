import { initEmitterIds } from "../logic/baseEvent";
import { sendEvent } from "../logic/EventManager";
import { Block, BlockName, BodyEffect, BodyState, BodyStateKeys, HumanBody, MotricityValue, readKey } from "../../HUMAn/human";
import { logger } from "../../tools/logger";
import { ABCDECategory, ActDefinition, ActionBodyEffect, ActionBodyMeasure, HumanAction, ModuleDefinition, PathologyDefinition } from "../../HUMAn/pathology";
import { getAct, getItem, getPathology } from "../../HUMAn/registries";
import { ConsoleLog, getCurrentPatientBody, getCurrentPatientId, getHealth, getHuman, getHumanConsole, getMyInventory, Inventory } from "../logic/the_world";
import { getCurrentSimulationTime } from "../logic/TimeManager";
import { categoryToHtml, doAutomaticTriage, getCategory, getTagSystem, resultToHtmlObject } from "../logic/triage";
import { getOverview, HumanOverview } from "./graphics";
import { getActTranslation, getItemActionTranslation, getTranslation } from "../../tools/translation";
import { getMySkillDefinition } from "../../tools/WegasHelper";
import { toHourMinutesSeconds } from "../../tools/helper";
import { getBloodRatio } from "../../HUMAn/physiologicalModel";

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
	priority: number;
}

type WheelItemAction = BaseItem &
	WithActionType & {
		type: 'WheelItemAction';

		itemActionId: {
			itemId: string;
			actionId: string;
		};
		disposable: boolean;
		counter: number | 'infinity';
	};

type WheelAct = BaseItem &
	WithActionType & {
		type: 'WheelAct';
	};

type WheelExtraPanel = BaseItem & {
	type: 'ExtraPanel';
	id: string;
};

type WheelAction = WheelItemAction | WheelAct;

type WheelMenuItem = BaseItem & {
	type: 'WheelMenuItem';
	id: string;
	items: WheelAction[];
};

type WheelItem = WheelMenuItem | WheelExtraPanel;

type WheelMenu = BaseItem & {
	type: 'WheelMenu';
	id: string;
	items: WheelMenuItem[];
};

interface Wheel {
	mainMenu: WheelMenu[];
	shortcuts: WheelItem[];
}

/////////////////////////////////
// The State
/////////////////////////////////

export interface PatientZoomState {
	//logs: string[];
	currentPatient: string | undefined;
	selectedPanel: string | undefined;
	/** Id of the selected mainmenu */
	selectedMenu: string | undefined;
	/** Id of the selected sub-menu */
	selectedSubMenu: string | undefined;
	/** selected action */
	selectedAction: WheelAction | undefined;
	selectedBlock: string | undefined;
	observedBlock: string | undefined;
	availableBlocks: string[];
	selectedCategory: string | undefined;
	// responsive display
	selectedColumn: "first" | 'second' | 'third';
}

export function getInitialPatientZoomState(): PatientZoomState {
	return {
		selectedAction: undefined,
		selectedPanel: undefined,
		selectedMenu: undefined,
		selectedSubMenu: undefined,
		availableBlocks: [],
		selectedBlock: undefined,
		//logs: [],
		currentPatient: undefined,
		observedBlock: undefined,
		selectedCategory: undefined,
		selectedColumn: 'first',
	};
}

export type SetZoomState = (
	state: PatientZoomState | ((currentState: PatientZoomState) => PatientZoomState),
) => void;

interface FullState {
	state: PatientZoomState;
	setState: SetZoomState;
}

//////////////////////////////////////////////////////7
// Responsive
////////////////////

const widthLimit = 10; //1050;

export function shouldDisplayColumn({ state }: FullState, colId: PatientZoomState['selectedColumn']) {
	const pageWidth = Context.mainPageSize?.width;
	if (!pageWidth) {
		return true;
	}
	return pageWidth > widthLimit || state.selectedColumn === colId;
}

export function shouldHideNavButtons() {
	const pageWidth = Context.mainPageSize?.width;
	if (!pageWidth) {
		return true;
	}
	return pageWidth > widthLimit;
}

export function shouldHideColumn(fullState: FullState, colId: PatientZoomState['selectedColumn']) {
	return !shouldDisplayColumn(fullState, colId);
}

export function showColumn({ setState }: FullState, colId: PatientZoomState['selectedColumn']) {
	setState(state => ({
		...state,
		selectedColumn: colId,
	}));
}

export function isColumnSelected({ state }: FullState, colId: PatientZoomState['selectedColumn']) {
	return state.selectedColumn === colId;
}


//////////////////////////////////////////////


export function keepStateAlive({ state, setState }: FullState) {
	const ePatient = getCurrentPatientId();
	const cPatient = state.currentPatient;
	if (ePatient !== cPatient) {
		setState({
			...getInitialPatientZoomState(),
			currentPatient: ePatient,
		});
	}
}

function getActionIcon(action: HumanAction): string {
	if (action.type === 'ActionBodyEffect') {
		return 'syringe';
	} else if (action.type === 'ActionBodyMeasure') {
		return 'ruler';
	}
	return '';
}

function getWheelActionFromInventory(inventory: Inventory): WheelAction[] {
	return Object.entries(inventory).flatMap(([itemId, count]) => {
		const item = getItem(itemId);
		if (item != null) {
			return Object.entries(item.actions).map(([key, action], i, entries) => {
				const iaKey = `${item.id}::${key}`;
				return {
					id: iaKey,
					label: getItemActionTranslation(item, key),
					type: 'WheelItemAction',
					actionType: action.type,
					actionCategory: action.category,
					priority: item.priority,
					itemActionId: {
						itemId: item.id,
						actionId: key,
					},
					icon: getActionIcon(action),
					disposable: item.disposable,
					counter: count,
				};
			});
		}

		return [];
	});
}

function getWheelActionFromActs(acts: ActDefinition[]): WheelAction[] {

	return acts.map(act => {
		return {
			type: 'WheelAct',
			actionType: act.action.type,
			actionCategory: act.action.category,
			priority: act.priority,
			id: act.id,
			label: getActTranslation(act),
			icon: getActionIcon(act.action),
		};
	});
}

interface ByType {
	measures: WheelAction[];
	treatments: WheelAction[];
}

function sortItems(items: WheelAction[]) {
	return items.sort((a, b) => {
		if (a.priority === b.priority) {
			return a.label.localeCompare(b.label, self.getLang(), { numeric: true });
		} else {
			return a.priority - b.priority;
		}
	});
}

function getWheelMenuItems(bag: ByType): WheelMenuItem[] {
	return [
		{
			type: 'WheelMenuItem',
			id: 'measureMenu',
			label: getTranslation('pretriage-interface', 'measures'),
			items: sortItems(bag.measures),
			icon: 'ruler',
		},
		{
			type: 'WheelMenuItem',
			id: 'treatmentMenu',
			label: getTranslation('pretriage-interface', 'treatments'),
			items: sortItems(bag.treatments),
			icon: 'syringe',
		},
	];
}

function getABCDEWheel(): Wheel {
	// Fetch all item and act action
	const itemActions = getWheelActionFromInventory(getMyInventory());
	const actActions = getWheelActionFromActs(getMyMedicalActs());

	const bag: Record<ABCDECategory, ByType> = {
		A: { measures: [], treatments: [] },
		B: { measures: [], treatments: [] },
		C: { measures: [], treatments: [] },
		D: { measures: [], treatments: [] },
		E: { measures: [], treatments: [] },
		Z: { measures: [], treatments: [] },
	};

	[...itemActions, ...actActions].forEach(action => {
		if (action.actionType === 'ActionBodyEffect') {
			bag[action.actionCategory].treatments.push({ ...action, icon: 'syringe' });
		} else if (action.actionType === 'ActionBodyMeasure') {
			bag[action.actionCategory].measures.push({ ...action, icon: 'ruler' });
		}
	});

	const categories: Record<ABCDECategory, WheelMenu> = {
		A: {
			id: 'aMenu',
			label: 'A',
			icon: 'wind',
			items: getWheelMenuItems(bag.A),
			type: 'WheelMenu',
		},
		B: {
			id: 'bMenu',
			label: 'B',
			icon: 'lungs',
			items: getWheelMenuItems(bag.B),
			type: 'WheelMenu',
		},
		C: {
			id: 'cMenu',
			label: 'C',
			icon: 'heartbeat',
			items: getWheelMenuItems(bag.C),
			type: 'WheelMenu',
		},
		D: {
			id: 'dMenu',
			label: 'D',
			icon: 'dizzy',
			items: getWheelMenuItems(bag.D),
			type: 'WheelMenu',
		},
		E: {
			id: 'eMenu',
			label: 'E',
			icon: 'stethoscope',
			items: getWheelMenuItems(bag.E),
			type: 'WheelMenu',
		},
		Z: {
			id: 'zMenu',
			label: '',
			icon: 'comments',
			items: getWheelMenuItems(bag.Z),
			type: 'WheelMenu',
		},
	};

	return {
		mainMenu: Object.values(categories),
		shortcuts: [
			{
				type: 'ExtraPanel',
				label: 'Triage',
				icon: 'sort-numeric-down',
				id: 'triage',
			},
		],
	};
}

export function getWheel(): Wheel {
	return getABCDEWheel();
}

/**
 * According to its skills, get all medical act available to current character and gameplay mode
 */
export function getMyMedicalActs(): ActDefinition[] {
	const skill = getMySkillDefinition();

	return Object.entries(skill.actions || {}).flatMap(([actionId]) => {
		if (actionId.startsWith('act::')) {
			const actId = actionId.split('::')[1];
			const act = getAct(actId);

			if (act) {
				return [act];
			} else {
				return [];
			}
		} else {
			return [];
		}
	});
}

/////////////////////////////////
// The Wheel Helpers
/////////////////////////////////

export function getButtonLabel(item: WheelItem | WheelMenu | WheelAction): string {
	switch (item.type) {
		case 'WheelItemAction':
			if (item.disposable) {
				return `${item.label} (${item.counter === 'infinity' ? '∞' : item.counter})`;
			} else {
				return item.label;
			}

		case 'WheelMenuItem':
		// falls through
		case 'WheelAct':
		// falls through
		case 'ExtraPanel':
		// falls through
		case 'WheelMenu':
			return item.label;
	}
}

export function getSubWheelTitle(state: PatientZoomState): string {
	const wheel = getWheel();
	const menu = wheel.mainMenu.find(item => item.id === state.selectedMenu);
	if (menu != null) {
		return menu.label;
	}
	return '';
}

export function getSubWheelMenu(state: PatientZoomState): WheelMenuItem[] {
	const wheel = getWheel();
	const menu = wheel.mainMenu.find(item => item.id === state.selectedMenu);
	if (menu != null) {
		//preselect first non empty thumb
		//wlog(menu.items[0].items)
		/*const toSelect = menu.items.find((it) => it.items.length > 0);
		if(toSelect){
			selectWheelItem(toSelect, Context.patientConsole.setState);

		}*/

		return menu.items;
	}
	return [];
}

export function getWheelSubmenuTitle(state: PatientZoomState): string {
	const wheel = getWheel();
	const subWheel = wheel.mainMenu.find(sub => sub.id === state.selectedMenu);
	if (subWheel != null) {
		const menu = subWheel.items.find(
			item => item.type === 'WheelMenuItem' && item.id === state.selectedSubMenu,
		);

		if (menu != null) {
			return (menu as WheelMenuItem).label;
		}
	}

	return '';
}

export function getSubWheelSubmenu(state: PatientZoomState): WheelAction[] {
	const wheel = getWheel();
	const subWheel = wheel.mainMenu.find(sub => sub.id === state.selectedMenu);

	if (subWheel == null) {
		return [];
	}

	const menu = subWheel.items.find(
		item => item.type === 'WheelMenuItem' && item.id === state.selectedSubMenu,
	);

	if (menu != null) {
		return (menu as WheelMenuItem).items;
	}
	return [];
}

/////////////////////////////////
// The Wheel Selectors
/////////////////////////////////


/**
 * compute state to reflect action selection
 */
function internalSelectAction(state: PatientZoomState, action?: WheelAction): PatientZoomState {
	if (action?.actionType === 'ActionBodyEffect') {
		const rAction = resolveAction<ActionBodyEffect>(action, 'ActionBodyEffect');

		const blocks = rAction?.blocks || [];
		const block = blocks.length === 1 ? blocks[0] : undefined;

		return {
			...state,
			selectedAction: action,
			selectedBlock: block,
			availableBlocks: blocks,
		};
	} else {
		return {
			...state,
			selectedAction: action,
			selectedBlock: undefined,
			availableBlocks: [],
		};
	}
}


export function selectWheelMainMenu(menuId: string, setState: SetZoomState) {

	const wheel = getWheel();
	const selectedMenu = wheel.mainMenu.find(sub => sub.id === menuId);

	// select first non-empty subMenu automatically
	const subMenu = selectedMenu?.items.find(item => {
		return item.items.length > 0;
	});

	// select first action if any
	const action = subMenu?.items[0];

	setState(state => {
		return internalSelectAction({
			...state,
			selectedPanel: undefined,
			selectedMenu: menuId,
			selectedSubMenu: subMenu?.id,
			selectedAction: action,
		}, action);
	});
}

export function selectSubMenu(subMenuId: string, setState: SetZoomState) {

	setState(state => {

		const wheel = getWheel();
		const selectedMenu = wheel.mainMenu.find(sub => sub.id === state.selectedMenu);

		// get items of subMenu to select
		const subMenu = selectedMenu?.items.find(item => {
			return item.id === subMenuId;
		});

		// select first action if any
		const action = subMenu?.items[0];

		return internalSelectAction({
			...state,
			selectedPanel: undefined,
			selectedSubMenu: subMenuId,
			selectedAction: action,
		}, action);
	});
}

export function selectPanel(item: WheelExtraPanel, setState: SetZoomState) {
	setState(state => {
		return {
			...state,
			selectedMenu: undefined,
			selectedSubMenu: undefined,
			selectedPanel: item.id,
		};
	});
}

export function selectWheelAction(action: WheelAction | undefined, setState: SetZoomState) {
	setState(state => internalSelectAction(state, action));
}

export function selectWheelItem(item: WheelItem, setState: SetZoomState) {
	if (item.type === 'WheelMenuItem') {
		selectSubMenu(item.id, setState);
	} else if (item.type === 'ExtraPanel') {
		selectPanel(item, setState);
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

function resolveAction<T extends HumanAction>(
	wheelAction: WheelAction,
	aType: T['type'],
): T | undefined {
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

export function doWheelMeasure(measure: WheelAction, setState: SetZoomState): Promise<IManagedResponse> | undefined {
	const action = resolveAction<ActionBodyMeasure>(measure, 'ActionBodyMeasure');

	if (action != null) {
		const source =
			measure.type === 'WheelAct'
				? {
					type: 'act' as const,
					actId: measure.id,
				}
				: {
					type: 'itemAction' as const,
					...measure.itemActionId,
				};
		return sendEvent({
			...initEmitterIds(),
			type: 'HumanMeasure',
			targetType: 'Human',
			targetId: Context.patientConsole.state.currentPatient,
			source: source,
		});
	}
}

export function doWheelTreatment(treatment: WheelAction, block: BlockName, setState: SetZoomState) {
	const action = resolveAction<ActionBodyEffect>(treatment, 'ActionBodyEffect');

	if (action != null) {
		const source =
			treatment.type === 'WheelAct'
				? {
					type: 'act' as const,
					actId: treatment.id,
				}
				: {
					type: 'itemAction' as const,
					...treatment.itemActionId,
				};
		sendEvent({
			...initEmitterIds(),
			type: 'HumanTreatment',
			targetType: 'Human',
			targetId: Context.patientConsole.state.currentPatient,
			source: source,
			blocks: block ? [block] : [],
		});
	}
}


function formatBlockTitle(titleArg: string, translationVar?: keyof VariableClasses): string {
	let title = titleArg;
	if (translationVar) {
		title = getTranslation(translationVar, title, true);
	}
	return `<div class='block-title'>${title}</div>`;
}

function formatBlockSubTitle(title: string, translationVar: keyof VariableClasses): string {
	return `<div class='block-subtitle'>${getTranslation(translationVar, title)}</div>`;
}

function formatBlockEntry(titleArg: string, translationVar?: keyof VariableClasses, value?: string): string {
	let title = titleArg;
	if (translationVar) {
		title = getTranslation(translationVar, title);
	}
	return `<div class='block-entry'>
		<span class='block-entry-title'>${title}${value ? ':' : ''}</span>
		<span class='block-entry-value'>${value || ''}</span>
	</div>`;
}

//TODO translations
function getBlockDetails(block: Block | undefined, bodyState: BodyState, fullDetails: boolean = false): string[] {
	const output: string[] = [];
	if (block) {
		output.push(formatBlockTitle(block.name, 'human-blocks'));
		logger.info('Block: ', block.params);

		if (fullDetails && block.params.pain) {
			output.push(formatBlockEntry('pain', 'human-general', '' + block.params.pain));
		}

		if (block.params.totalExtLosses_ml ?? 0 > 0) {
			output.push(formatBlockSubTitle('Hemorrhage', 'human-pathology'));


			if (block.params.extLossesFlow_mlPerMin ?? 0 > 0) {

				if (block.params.arterialLosses_mlPerMin ?? 0 > 0) {
					output.push(formatBlockEntry('bleedsArterial', 'human-general'));
				}
				const venousFlow = block.params.venousLosses_mlPerMin ?? 0;

				if (venousFlow > 0) {
					if (venousFlow > 50) {
						output.push(formatBlockEntry('bleedsVenous', 'human-general'));
					} else {
						output.push(formatBlockEntry('bleedsMinor', 'human-general'));
					}
				}
				if (fullDetails) {
					output.push(
						formatBlockEntry(
							'current flow',
							'human-pathology',
							`${block.params.extLossesFlow_mlPerMin!.toFixed(2)} mL/min`
						),
					);
				}
			} else {
				output.push(formatBlockEntry('bleedsNoLonger', 'human-general'));
			}
			if (fullDetails) {
				output.push(formatBlockEntry('Total', 'human-pathology', `${block.params.totalExtLosses_ml!.toFixed(2)} mL`));
			}
		}

		if (block.params.salineSolutionInput_mLperMin || block.params.bloodInput_mLperMin) {
			output.push(formatBlockSubTitle('Venous Catheter', 'human-pathology'));
			if (block.params.salineSolutionInput_mLperMin! > 0) {
				output.push(formatBlockEntry('NaCl', undefined, `${block.params.salineSolutionInput_mLperMin!.toFixed(2)} mL/min`));
			}

			if (block.params.bloodInput_mLperMin! > 0) {
				output.push(formatBlockEntry('Blood', 'human-pathology', `${block.params.bloodInput_mLperMin!.toFixed(2)} mL/min`));
			}
		}

		if (block.params.broken) {
			output.push(formatBlockSubTitle('Fracture', 'human-pathology'));
			output.push(formatBlockEntry("fracture-" + block.params.broken, 'human-pathology'));
		}

		if (fullDetails && block.params.nervousSystemBroken) {
			output.push(formatBlockSubTitle('nervousSystem', 'human-pathology'));
		}

		if (block.params.hematoma) {
			output.push(formatBlockSubTitle('hematoma', 'human-pathology'));
		}

		if (block.params.burnedPercent! > 0) {
			output.push(formatBlockSubTitle('Burn', 'human-pathology'));
			output.push(formatBlockEntry('Degree', 'human-pathology', block.params.burnLevel || '1'));
			output.push(formatBlockEntry('Surface', 'human-pathology', percentFormatter(block.params.burnedPercent)));
		}

		if (block.params.internalPressure === 'DRAIN') {
			output.push(formatBlockSubTitle('Drained', 'human-pathology'));
		}

		if (block.name === 'HEAD' || block.name === 'NECK') {
			let title = false;
			const printTitle = () => {
				if (!title) {
					title = true;
					output.push(formatBlockSubTitle('Upper Airways', 'human-pathology'));
				}
			}
			if ((block.params.airResistance ?? 0) > 0) {
				printTitle();
				output.push(formatBlockEntry("Obstruction", 'human-pathology', `${percentFormatter(block.params.airResistance!)}`));
			}

			if (block.params.intubated) {
				printTitle();
				output.push(formatBlockSubTitle('Intubated', 'human-pathology'));
			}


			if (block.params.fiO2 != null && block.params.fiO2 !== 'freshAir') {
				printTitle();
				output.push(formatBlockEntry("FiO2", undefined, `${percentFormatter(block.params.fiO2)}`));
			}

			if (block.name === 'HEAD' && bodyState.variables.positivePressure) {
				printTitle();
				let posP = getTranslation('human-general', 'Positive Pressure');

				if (bodyState.variables.positivePressure === 'aborted') {
					posP += ": " + getTranslation('human-general', 'aborted');
				}
				output.push(formatBlockEntry(posP));

			}
		}
	}

	return output;
}

export function getBlockDetail(observedBlock: string, fullDetails: boolean = false) {
	const id = getCurrentPatientId();

	const human = getHuman(id);
	const health = getHealth(id);
	const currentTime = getCurrentSimulationTime();

	const output: string[] = [''];

	if (human != null && observedBlock) {
		const data: {
			pathologies: {
				pDef: PathologyDefinition;
				pMod: ModuleDefinition;
			}[];
			effects: BodyEffect[];
		} = {
			effects: [],
			pathologies: [],
		};

		const pathologies = health.pathologies.filter(p => p.time < currentTime);
		const effects = health.effects.filter(p => p.time < currentTime);
		//logger.warn("Spy: ", { health, currentTime });
		pathologies.forEach(p => {
			const pathology = getPathology(p.pathologyId);
			if (pathology != null) {
				if (fullDetails || p.modules.find(mod => mod.visible) != null) {
					p.modules.forEach((mod, i) => {
						if (mod.block === observedBlock) {
							data.pathologies.push({
								pDef: pathology,
								pMod: pathology.modules[i]!,
							});
						}
					});
				}
			}
		});
		effects.forEach(effect => {
			if (fullDetails || effect.action.visible) {
				if (effect.afflictedBlocks.includes(observedBlock)) {
					data.effects.push(effect);
				}
			}
		});
		if (data.pathologies.length > 0 || data.effects.length > 0) {
			const block = human.state.blocks.get(observedBlock);

			output.push(...getBlockDetails(block, human.state, fullDetails));

			if (data.effects.length > 0) {
				output.push(formatBlockSubTitle("Treatments", 'pretriage-interface'));
				output.push(
					...data.effects.map(e => {
						if (e.source.type === 'act') {
							return getActTranslation(e.source);
						} else {
							return getItemActionTranslation(e.source, e.actionId);
						}
					}).map(e => formatBlockEntry(e))
				);
			}
		} else {
			output.push('<em>nothing visible</em>');
		}
	}

	return output.join('');
}

function percentFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return (value * 100).toFixed() + ' %';
	} else {
		//wlog('Value is not a number (PERCENT formatter)');
		return getTranslation('pretriage-interface', "unmeasurable");
	}
}

function intFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed();
	} else {
		//wlog('Value is not a number (int formatter)');
		return getTranslation('pretriage-interface', "unmeasurable");
	}
}

function twoDecimalFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed(2);
	} else {
		//wlog('Value is not a number (.2 formatter)');
		return getTranslation('pretriage-interface', "unmeasurable");
	}
}

function oneDecimalFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed(1);
	} else {
		//wlog('Value is not a number (.1 formatter)');
		return getTranslation('pretriage-interface', "unmeasurable");
	}
}

function motricityFormatter(value: unknown): string {
	switch (value) {
		case 'move':
		case 'do_not_move':
		case 'no_response':
			return getTranslation("human-general", value, true)
	}
	return getTranslation('pretriage-interface', "unmeasurable");
}


function canWalkFormatter(value: unknown): string {
	switch (value) {
		case 'no_response':
			return getTranslation("human-general", 'no_response', true)
		case true:
			return getTranslation("human-general", "yes", true)
		case false:
			return getTranslation("human-general", "no", true)
	}
	return getTranslation('pretriage-interface', "unmeasurable");
}


function painFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return intFormatter(value) + " / 10";
	} else {
		return getTranslation("human-general", 'no_response', true);
	}
}

export function formatMetric(metric: BodyStateKeys, value: unknown): [string, string] {
	const metricName = getTranslation("human-general", metric, true);
	switch (metric) {
		case 'vitals.motricity.leftArm':
			return [metricName, motricityFormatter(value)];
		case 'vitals.motricity.rightArm':
			return [metricName, motricityFormatter(value)];
		case 'vitals.motricity.leftLeg':
			return [metricName, motricityFormatter(value)];
		case 'vitals.motricity.rightLeg':
			return [metricName, motricityFormatter(value)];
		case 'vitals.glasgow.motor':
			return [metricName, String(value)];
		case 'vitals.glasgow.verbal':
			return [metricName, String(value)];
		case 'vitals.glasgow.eye':
			return [metricName, String(value)];
		case 'vitals.glasgow.total':
			return [metricName, String(value)];
		case 'vitals.canWalk':
			return [metricName, canWalkFormatter(value)];
		case 'vitals.visiblePain':
			return [metricName, painFormatter(value)];
		case 'vitals.cardiacArrest':
			return [metricName, value || 0 > 0 ? getTranslation("human-general", "yes", true) : getTranslation("human-general", "no", true)];
		case 'vitals.cardio.MAP':
			return [metricName, intFormatter(value) + " mmHg"];
		case 'vitals.cardio.hr':
			return [metricName, intFormatter(value) + "/min"];
		case 'vitals.respiration.SaO2':
			return [metricName, percentFormatter(value)];
		case 'vitals.respiration.SpO2':
			return [metricName, percentFormatter(value)];
		case 'vitals.respiration.rr':
			return [metricName, intFormatter(value) + "/min"];
		case 'vitals.capillaryRefillTime_s':
			return [metricName, twoDecimalFormatter(value)];
		case 'vitals.respiration.PaO2':
			return [metricName, oneDecimalFormatter(value) + " mmHg"];
		case 'vitals.respiration.PaCO2':
			return [metricName, oneDecimalFormatter(value) + " mmHg"];
		case 'vitals.respiration.tidalVolume_L':
			return [metricName, intFormatter((value as number) * 1000) + " mL"];
		case 'vitals.respiration.alveolarVolume_L':
			return [metricName, intFormatter((value as number) * 1000) + " mL"];
		case 'vitals.cardio.totalVolume_mL':
			return [metricName, twoDecimalFormatter((value as number) / 1000) + " L"];
		case 'vitals.cardio.endSystolicVolume_mL':
			return [metricName, intFormatter(value) + " mL"];
		case 'vitals.cardio.strokeVolume_mL':
			return [metricName, intFormatter(value) + " mL"];
		case 'variables.ICP_mmHg':
			return [metricName, intFormatter(value) + " mmHg"];
	}

	return [String(metric), String(value)];
}


export function getMainVitals(): { label: string, value: string, id: string }[] {

	const human = getCurrentPatientBody();
	if (human) {
		const bodyState: BodyState = human.state;

		const keys: BodyStateKeys[] = [
			'vitals.cardio.hr',
			'vitals.respiration.rr',
			'vitals.respiration.tidalVolume_L',
			'vitals.canWalk',
		];

		const vitals = keys.map(vital => {
			const value = readKey(bodyState, vital);
			const data = formatMetric(vital, value);
			return {
				id: vital as string,
				label: data[0],
				value: data[1],
			}
		});

		vitals.push({
			id: 'gcs',
			label: getTranslation('human-general', 'vitals.glasgow.total'),
			value: `${human.state.vitals.glasgow.total}<br />
			${human.state.vitals.glasgow.motor}M-${human.state.vitals.glasgow.verbal}V-${human.state.vitals.glasgow.eye}E`,
		});

		return vitals;
	}
	return [];
}

export function shortMotricityFormatter(value: MotricityValue) : string {
	switch (value){
		case 'move':
			return getTranslation("human-general", 'yes');
		case'do_not_move':
		default:
			return getTranslation("human-general", 'no');
	}
}

export function getSecondaryVitals(): { label: string, value: string, id: string }[] {

	const human = getCurrentPatientBody();
	if (human) {
		const bodyState: BodyState = human.state;

		const keys: BodyStateKeys[] = [
			'vitals.cardio.MAP',
			'vitals.respiration.SpO2',
		];

		const vitals = keys.map(vital => {
			const value = readKey(bodyState, vital);
			const data = formatMetric(vital, value);
			return {
				id: vital as string,
				label: data[0],
				value: data[1],
			}
		});

		vitals.push({
			id: 'bloodVolume',
			label: getTranslation('human-general', 'bloodVolumeRatio'),
			value: percentFormatter(getBloodRatio(human)),
		});

		vitals.push({
			id: 'motricity',
			label: getTranslation('human-general', 'motricity'),
			value: `
			${getTranslation('human-general', 'motricity.arms')}: ${shortMotricityFormatter(human.state.vitals.motricity.leftArm)}/${shortMotricityFormatter(human.state.vitals.motricity.rightArm)}<br />
			${getTranslation('human-general', 'motricity.legs')}: ${shortMotricityFormatter(human.state.vitals.motricity.leftLeg)}/${shortMotricityFormatter(human.state.vitals.motricity.rightLeg)}`,
		});

		return vitals;
	}
	return [];
}

export function getPains(): { label: string, value: string }[] {

	const human = getCurrentPatientBody();
	if (human) {
		const bodyState: BodyState = human.state;

		const output: { label: string, value: number }[] = [];

		bodyState.blocks.forEach(block => {
			if ((block.params.pain ?? 0) > 0) {
				output.push({
					label: getTranslation('human-blocks', block.name),
					value: block.params.pain!,
				})
			}
		});
		return output.sort((a, b) => {
			return b.value - a.value;
		}).map(entry => ({
			id: entry.label,
			label: entry.label,
			value: `${entry.value}/10`,
		}))
	}
	return [];
}

export function getPain(): string {

	const human = getCurrentPatientBody();

	if (human) {
		const [label, value] = formatMetric('vitals.visiblePain', human.state.vitals.pain);
		return `${label}: ${value}`;
	}

	return '';
}


export function getMainIndication(): string {

	const human = getCurrentPatientBody();
	if (human) {
		if (human.state.vitals.cardiacArrest) {
			return getTranslation("human-general", 'you-are-dead');
		}
		const gcs = human.state.vitals.glasgow.total;
		if (gcs < 11) {
			return getTranslation("human-general", 'you-are-unconscious');
		} else if (gcs < 14) {
			return getTranslation("human-general", 'you-are-dizzy');
		} else {
			return getTranslation("human-general", 'you-are-conscious');
		}
	}
	return 'N/A';
}




function formatLog(log: ConsoleLog): string {

	const formattedTime = toHourMinutesSeconds(log.time);
	const time = `<span class='time'>${formattedTime}</span>`;
	if (log.type === 'MessageLog') {
		return `<div class='log_container'>${time} <span class='message'>${log.message}</span></div>`;
	} else if (log.type === 'MeasureLog') {
		const lines = log.metrics.map(metric => {
			const r = formatMetric(metric.metric, metric.value);
			return `<div><span class='msr_label'>${r[0]}:</span><span class='msr_value'>${r[1]}</span></div>`;
		});
		return `<div class='log_container'>${time} <div class='msr_list'>${lines.join("")}</div></div>`;
	} else if (log.type === 'TreatmentLog') {
		return `<div class='log_container'>${time} <div class='msr_list'>${log.message}</div></div>`;
	}
	return `<div class='log_container'>${time}: UNKWOWN LOG TYPE: ${(log as any).type}</div>`;
}

export function getPatientConsole(): string {
	const id = getCurrentPatientId();

	const console = getHumanConsole(id);
	return console.reverse().map(formatLog).join('');
}


export function getPatientMostRecentConsoleLog(): string {
	const id = getCurrentPatientId();

	const console = getHumanConsole(id);
	const log = console.reverse()[0];
	if (log) {
		return formatLog(log);
	} else {
		return '';
	}
}

export function selectCategory(category: string, setState: SetZoomState) {
	setState(s => ({
		...s,
		selectedCategory: category,
	}));
}

export async function validateCategory(state: PatientZoomState): Promise<unknown> {
	const system = getTagSystem();
	const resolved = getCategory(state.selectedCategory);
	const autoTriage = doAutomaticTriage()!;
	logger.log("Resolved category: ", resolved);
	logger.log("CurrentPatient: ", state.currentPatient);
	if (resolved != null && state.currentPatient) {
		return sendEvent({
			...initEmitterIds(),
			type: 'Categorize',
			targetType: 'Human',
			targetId: state.currentPatient,
			category: resolved.category.id,
			system: system,
			autoTriage: autoTriage,
			severity: resolved.severity,
		});
	}
	return undefined;
}

function getRoundedAge(human: HumanBody) {
	const age = human.meta.age;
	if (age < 18) {
		// child and teenager => quite easy to guess effective age
		return age;
	} else {
		// adugle => round to 20, 25, 30, 35, and so on
		return Math.round(age / 5) * 5;
	}
}

export function getCurrentPatientTitle(exact: boolean = false): string {
	const id = getCurrentPatientId();
	const human = getHuman(id);
	if (human != null) {
		const age = exact ? human.meta.age : `~${getRoundedAge(human)}`;
		const sex = getTranslation('human-general', human!.meta.sex, false);
		const years = getTranslation('human-general', 'years', false);
		return `<span class='human-id'>${id}</span>,
		 <span class='human-sex'>${sex}</span>,
		  <span class='human-age'>${age} ${years}</span>`;
	}
	return '';
}

export function getCurrentPatientDescription(): string {
	const id = getCurrentPatientId();
	const human = getHuman(id);
	if (human != null) {
		return human.meta.description || '';
	}
	return '';
}

// @ts-ignore
function getAlertness(overview: HumanOverview): string {
	let alertness = 'closed eyes';
	if (overview.looksDead) {
		alertness = 'looks dead';
	} else if (overview.gcs.eye === 4) {
		alertness = 'lively';
	} else if (overview.gcs.eye === 3) {
		alertness = 'apathetic';
	} else {
		alertness = 'closed eyes';
	}
	return getTranslation('human-general', alertness, false);
}

function getBreathingOverview(overview: HumanOverview): string {
	let breathing = 'respiration looks normal';
	if (overview.rr === 0 || overview.gcs.total < 10 && overview.tidalVolume_L < 0.6 && overview.rr < 15) {
		// coma + low respiration
		breathing = 'no apparent breathing';
	} else if (overview.tidalVolume_L > 1 && overview.rr > 25) {
		breathing = 'deep and rapid breathing';
	} else if (overview.tidalVolume_L > 1) {
		breathing = 'deep breathing';
	} else if (overview.rr > 25) {
		breathing = 'rapid breathing';
	} else {
		breathing = 'respiration looks normal';
	}

	return getTranslation('human-general', breathing);
}

function addBleedingDescription(output: string[], ho: HumanOverview): void {

	let minor = ho.arterialBloodLosses_mlPerMin > 0 || ho.venousBloodLosses_mlPerMin > 0;

	if (ho.arterialBloodLosses_mlPerMin) {
		output.push(getTranslation('human-general', 'bleedsArterial', false));
		minor = false;
	}

	if (ho.venousBloodLosses_mlPerMin > 50) {
		output.push(getTranslation('human-general', 'bleedsVenous', false));
		minor = false;
	}

	if (minor) {
		output.push(getTranslation('human-general', 'bleedsMinor', false));
	}


}

export function getHumanVisualInfos(): string {
	const human = getCurrentPatientBody();
	const output: string[] = [''];
	if (human != null) {
		const overview = getOverview(human);
		if (overview) {
			//output.push(getTranslation('human-general', overview.position));
			//output.push(getAlertness(overview));
			output.push(getBreathingOverview(overview));
			addBleedingDescription(output, overview);
		}
	} else {
		output.push('<em>Loading...</em>');
		//output.push('<em>Error [patient not found]</em>');
	}

	// join non-empty cells
	return output.filter(o => o).join('<br /> ');
}

export function getAfflictedBlocks(fullDetails: boolean = false): string[] {
	const id = getCurrentPatientId();

	const human = getHuman(id);
	const health = getHealth(id);
	const currentTime = getCurrentSimulationTime();

	const output: Record<string, true> = {};

	if (human != null) {
		const pathologies = health.pathologies.filter(p => p.time < currentTime);
		const effects = health.effects.filter(p => p.time < currentTime);
		pathologies.forEach(p => {
			//const pathology = getPathology(p.pathologyId);
			p.modules.forEach(m => {
				if (fullDetails || m.visible) {
					output[m.block] = true;
				}
			});
		});
		effects.forEach(effect => {
			if (effect.action.visible || fullDetails) {
				effect.afflictedBlocks.forEach(blockName => {
					if (effect != null) {
						output[blockName] = true;
					}
				});
			}
		});
	}

	return Object.keys(output);
}

export function getAfflictedBlocksDetails() {
	const blocks = getAfflictedBlocks(true);

	const result = blocks.map(block => getBlockDetail(block, true));
	return result;
}

export function observeBlock(block: string | undefined, setState: SetZoomState) {
	setState(state => {
		return { ...state, observedBlock: block };
	});
}
// const acts = getMyMedicalActs();

export function getCurrentPatientAutoTriage() {
	const id = getCurrentPatientId();
	const human = getHuman(id);

	if (human == null) {
		return null;
	}

	if (human.category == null) {
		return null;
	}

	return {
		autoTriage: resultToHtmlObject(human.category.autoTriage),
		givenAnswer: categoryToHtml(human.category.category)
	};
}
