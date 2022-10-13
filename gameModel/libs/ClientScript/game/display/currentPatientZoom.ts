import { initEmitterIds } from "../logic/baseEvent";
import { sendEvent } from "../logic/EventManager";
import { Block, BlockName, BodyEffect, BodyState, BodyStateKeys, HumanBody } from "../../HUMAn/human";
import { logger } from "../../tools/logger";
import { ABCDECategory, ActDefinition, ActionBodyEffect, ActionBodyMeasure, HumanAction, ModuleDefinition, PathologyDefinition } from "../../HUMAn/pathology";
import { getAct, getItem, getPathology } from "../../HUMAn/registries";
import { ConsoleLog, getCurrentPatientBody, getCurrentPatientId, getHealth, getHuman, getHumanConsole, getMyInventory, getMyMedicalActs, Inventory } from "../logic/the_world";
import { getCurrentSimulationTime } from "../logic/TimeManager";
import { doAutomaticTriage, getCategory, getTagSystem, resultToHtml } from "../logic/triage";
import { getOverview, HumanOverview } from "./graphics";

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

type SubMenu = BaseItem & {
	type: 'WheelSubMenu';
	id: string;
	items: WheelAction[];
};

type SubWheelItem = SubMenu | WheelAction;

type WheelItem = SubWheelItem | WheelExtraPanel;

type SubWheel = BaseItem & {
	type: 'SubWheel';
	id: string;
	items: SubWheelItem[];
};

interface Wheel {
	mainMenu: SubWheel[];
	shortcuts: WheelItem[];
}

/////////////////////////////////
// The State
/////////////////////////////////

export interface PatientZoomState {
	//logs: string[];
	currentPatient: string | undefined;
	selectedPanel: string | undefined;
	selectedAction: WheelAction | undefined;
	selectedMenu: string | undefined;
	selectedSubMenu: string | undefined;
	selectedBlock: string | undefined;
	observedBlock: string | undefined;
	availableBlocks: string[];
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
	};
}

export type SetZoomState = (
	state: PatientZoomState | ((currentState: PatientZoomState) => PatientZoomState),
) => void;

interface FullState {
	state: PatientZoomState;
	setState: SetZoomState;
}

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
			id: act.id,
			label: act.name,
			icon: getActionIcon(act.action),
		};
	});
}

interface ByType {
	measures: WheelAction[];
	treatments: WheelAction[];
}

function getSubMenu(bag: ByType): SubMenu[] {
	return [
		{
			type: 'WheelSubMenu',
			id: 'measureMenu',
			label: 'Measures',
			items: bag.measures,
			icon: 'ruler',
		},
		{
			type: 'WheelSubMenu',
			id: 'treatmentMenu',
			label: 'Treatments',
			items: bag.treatments,
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

	const categories: Record<ABCDECategory, SubWheel> = {
		A: {
			id: 'aMenu',
			label: 'A',
			icon: 'wind',
			items: getSubMenu(bag.A),
			type: 'SubWheel',
		},
		B: {
			id: 'bMenu',
			label: 'B',
			icon: 'lungs',
			items: getSubMenu(bag.B),
			type: 'SubWheel',
		},
		C: {
			id: 'cMenu',
			label: 'C',
			icon: 'heartbeat',
			items: getSubMenu(bag.C),
			type: 'SubWheel',
		},
		D: {
			id: 'dMenu',
			label: 'D',
			icon: 'dizzy',
			items: getSubMenu(bag.D),
			type: 'SubWheel',
		},
		E: {
			id: 'eMenu',
			label: 'E',
			icon: 'stethoscope',
			items: getSubMenu(bag.E),
			type: 'SubWheel',
		},
		Z: {
			id: 'zMenu',
			label: 'Z',
			icon: 'comments',
			items: getSubMenu(bag.Z),
			type: 'SubWheel',
		},
	};

	return {
		mainMenu: Object.values(categories),
		shortcuts: [
			{
				type: 'ExtraPanel',
				label: 'Go to...',
				icon: 'shoe-prints',
				id: 'goto',
			},
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

/////////////////////////////////
// The Wheel Helpers
/////////////////////////////////

export function getButtonLabel(item: WheelItem | SubWheel): string {
	switch (item.type) {
		case 'WheelItemAction':
			if (item.disposable) {
				return `${item.label} (${item.counter === 'infinity' ? '∞' : item.counter})`;
			} else {
				return item.label;
			}

		case 'WheelSubMenu':
            // falls through
		case 'WheelAct':
            // falls through
		case 'ExtraPanel':
            // falls through
		case 'SubWheel':
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

export function getSubWheelMenu(state: PatientZoomState): SubWheelItem[] {
	const wheel = getWheel();
	const menu = wheel.mainMenu.find(item => item.id === state.selectedMenu);
	if (menu != null) {
		return menu.items;
	}
	return [];
}

export function getWheelSubmenuTitle(state: PatientZoomState): string {
	const wheel = getWheel();
	const subWheel = wheel.mainMenu.find(sub => sub.id === state.selectedMenu);
	if (subWheel != null) {
		const menu = subWheel.items.find(
			item => item.type === 'WheelSubMenu' && item.id === state.selectedSubMenu,
		);

		if (menu != null) {
			return (menu as SubMenu).label;
		}
	}

	return '';
}

export function getWheelSubmenu(state: PatientZoomState): WheelAction[] {
	const wheel = getWheel();
	const subWheel = wheel.mainMenu.find(sub => sub.id === state.selectedMenu);

	if (subWheel == null) {
		return [];
	}

	const menu = subWheel.items.find(
		item => item.type === 'WheelSubMenu' && item.id === state.selectedSubMenu,
	);

	if (menu != null) {
		return (menu as SubMenu).items;
	}
	return [];
}

/////////////////////////////////
// The Wheel Selectors
/////////////////////////////////

export function selectSubWheel(subWheelId: string, setState: SetZoomState) {
	setState(state => {
		return {
			...state,
			selectedPanel: undefined,
			selectedMenu: subWheelId,
			// selectedSubMenu: undefined,
			selectedAction: undefined,
		};
	});
}

export function selectSubMenu(subMenuId: string, setState: SetZoomState) {
	setState(state => {
		return {
			...state,
			selectedPanel: undefined,
			selectedSubMenu: subMenuId,
			selectedAction: undefined,
		};
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
	if (action?.actionType === 'ActionBodyEffect') {
		const rAction = resolveAction<ActionBodyEffect>(action, 'ActionBodyEffect');

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
				availableBlocks: [],
			};
		});
	}
}

export function selectWheelItem(item: WheelItem, setState: SetZoomState) {
	if (item.type === 'WheelSubMenu') {
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

export function doWheelMeasure(measure: WheelAction, setState: SetZoomState) {
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
		sendEvent({
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

function formatBlockTitle(title: string): string {
	return `<div class='block-title'>${title}</div>`;
}

function formatBlockSubTitle(title: string): string {
	return `<div class='block-subtitle'>${title}</div>`;
}

function formatBlockEntry(title: string, value?: string): string {
	return `<div class='block-entry'>
		<span class='block-entry-title'>${title}${value ? ':' : ''}</span>
		<span class='block-entry-value'>${value || ''}</span>
	</div>`;
}

function getBlockDetails(block: Block | undefined, bodyState: BodyState): string[] {
	const output: string[] = [];
	if (block) {
		output.push(formatBlockTitle(block.name));
		logger.info('Block: ', block.params);

		if (block.params.pain) {
			output.push(formatBlockEntry('Pain', '' + block.params.pain));
		}

		if (block.params.totalExtLosses_ml ?? 0 > 0) {
			output.push(formatBlockSubTitle('Hemorrhage'));
			if (block.params.extLossesFlow_mlPerMin ?? 0 > 0) {
				const arterialLoss =
					(block.params.arterialBleedingFactor ?? 0) -
					(block.params.arterialBleedingReductionFactor ?? 0) >
					0;
				const venousLoss =
					(block.params.venousBleedingFactor ?? 0) -
					(block.params.venousBleedingReductionFactor ?? 0) >
					0;

				if (arterialLoss) {
					output.push(formatBlockEntry('Arterial'));
				}

				if (venousLoss) {
					output.push(formatBlockEntry('Venous'));
				}

				output.push(
					formatBlockEntry(
						'current flow',
						`${block.params.extLossesFlow_mlPerMin!.toFixed(2)} mL/min`,
					),
				);
			} else {
				output.push(formatBlockEntry('Hemostasis'));
			}
			output.push(formatBlockEntry('Total', `${block.params.totalExtLosses_ml!.toFixed(2)} mL`));
		}

		if (block.params.salineSolutionInput_mLperMin || block.params.bloodInput_mLperMin) {
			output.push(formatBlockSubTitle('Venous Catheter'));
			if (block.params.salineSolutionInput_mLperMin! > 0) {
				output.push(formatBlockEntry('NaCl', `${block.params.salineSolutionInput_mLperMin!.toFixed(2)} mL/min`));
			}

			if (block.params.bloodInput_mLperMin! > 0) {
				output.push(formatBlockEntry('Blood', `${block.params.bloodInput_mLperMin!.toFixed(2)} mL/min`));
			}
		}

		if (block.params.broken) {
			output.push(formatBlockSubTitle('Fracture'));
			output.push(formatBlockEntry(block.params.broken));
		}

		if (block.params.burnedPercent! > 0) {
			output.push(formatBlockSubTitle('Burn'));
			output.push(formatBlockEntry('Degree', block.params.burnLevel || '1'));
			output.push(formatBlockEntry('Surface: ', percentFormatter(block.params.burnedPercent)));
		}

		if (block.params.internalPressure === 'DRAIN') {
			output.push(formatBlockSubTitle('Drained'));
		}

		if (block.name === 'HEAD' || block.name === 'NECK') {
			let title = false;
			const printTitle = () => {
				if (!title) {
					title = true;
					output.push(formatBlockSubTitle('Upper Airways'));
				}
			}
			if ((block.params.airResistance ?? 0) > 0) {
				printTitle();
				output.push(formatBlockEntry("Obstruction", `${percentFormatter(block.params.airResistance!)}`));
			}

			if (block.params.intubated) {
				printTitle();
				output.push(formatBlockSubTitle('Intubated'));
			}


			if (block.params.fiO2 != null && block.params.fiO2 !== 'freshAir') {
				printTitle();
				output.push(formatBlockEntry("FiO2", `${percentFormatter(block.params.fiO2)}`));
			}

			if (block.name === 'HEAD' && bodyState.variables.positivePressure) {
				printTitle();
				if (bodyState.variables.positivePressure === 'aborted') {
					output.push(formatBlockEntry('Positive Pressure: aborted'));
				} else {
					output.push(formatBlockEntry('Positive Pressure'));
				}
			}
		}
	}

	return output;
}

export function getBlockDetail(observedBlock: string) {
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
				p.modules.forEach((mod, i) => {
					if (mod.block === observedBlock) {
						data.pathologies.push({
							pDef: pathology,
							pMod: pathology.modules[i]!,
						});
					}
				});
			}
		});
		effects.forEach(effect => {
			if (effect.action.visible) {
				if (effect.afflictedBlocks.includes(observedBlock)) {
					data.effects.push(effect);
				}
			}
		});
		if (data.pathologies.length > 0 || data.effects.length > 0) {
			const block = human.state.blocks.get(observedBlock);

			output.push(...getBlockDetails(block, human.state));

			if (data.effects.length > 0) {
				output.push(formatBlockSubTitle("Treatments"));
				output.push(
					...data.effects.map(e => {
						if (e.source.type === 'item') {
							if (Object.keys(e.source.actions).length > 1) {
								return `${e.source.name}/${e.action.name}`;
							}
						}
						return e.source.name;
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
		wlog('Value is not a number (PERCENT formatter)');
		return 'unknown';
	}
}

function intFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed();
	} else {
		wlog('Value is not a number (int formatter)');
		return 'unknown';
	}
}

function twoDecimalFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed(2);
	} else {
		wlog('Value is not a number (.2 formatter)');
		return 'unknown';
	}
}

function oneDecimalFormatter(value: unknown): string {
	if (typeof value === 'number') {
		return value.toFixed(1);
	} else {
		wlog('Value is not a number (.1 formatter)');
		return 'unknown';
	}
}

export function formatMetric(metric: BodyStateKeys, value: unknown): [string, string] {
	switch (metric) {
		case 'vitals.glasgow.motor':
			return [' - Motor', String(value)];
		case 'vitals.glasgow.verbal':
			return [' - Verbal', String(value)];
		case 'vitals.glasgow.eye':
			return [' - Eye', String(value)];
		case 'vitals.glasgow.total':
			return ['GCS', String(value)];
		case 'vitals.canWalk':
			return ['Walks?', value === true || value === 'true' ? 'yes' : 'no'];
		case 'vitals.cardiacArrest':
			return ['Dead?', value || 0 > 0 ? 'yes' : 'no'];
		case 'vitals.cardio.MAP':
			return ['MAP', intFormatter(value) + " mmHg"];
		case 'vitals.cardio.hr':
			return ['Heart rate', intFormatter(value) + "/min"];
		case 'vitals.respiration.SaO2':
			return ['SaO2', percentFormatter(value)];
		case 'vitals.respiration.SpO2':
			return ['SpO2', percentFormatter(value)];
		case 'vitals.respiration.rr':
			return ['RR', intFormatter(value)  + "/min"];
		case 'vitals.capillaryRefillTime_s':
			return ['CRT', twoDecimalFormatter(value)];
		case 'vitals.respiration.PaO2':
			return ['PaO2', oneDecimalFormatter(value) + " mmHg"];
		case 'vitals.respiration.PaCO2':
			return ['PaCO2', oneDecimalFormatter(value) + " mmHg"];
		case 'vitals.respiration.tidalVolume_L':
		case 'vitals.respiration.alveolarVolume_L':
			return ['Alv. volume', intFormatter((value as number) * 1000) + " mL"];
		case 'vitals.cardio.totalVolume_mL':
			return ['Blood volume', twoDecimalFormatter((value as number) / 1000) + " L"];
		case 'vitals.cardio.endSystolicVolume_mL':
			return ['ESV', intFormatter(value) + " mL"];
		case 'vitals.cardio.strokeVolume_mL':
			return ['Stroke Vol.', intFormatter(value) + " mL"];
		case 'variables.ICP_mmHg':
			return ['ICP', intFormatter(value) + " mmHg"];
	}

	return [String(metric), String(value)];
}

function formatLog(log: ConsoleLog): string {
	const time = `<span class='time'>${log.time}</span>`;
	if (log.type === 'MessageLog') {
		return `<div class='log_container'>${time} <span class='message'>${log.message}</span></div>`;
	} else if (log.type === 'MeasureLog') {
		const lines = log.metrics.map(metric => {
			const r = formatMetric(metric.metric, metric.value);
			return `<div><span class='msr_label'>${r[0]}:</span><span class='msr_value'>${r[1]}</span></div>`;
		});
		return `<div class='log_container'>${time} <div class='msr_list'>${lines.join("")}</div></div>`;
	} else if(log.type === 'TreatmentLog'){
		return `<div class='log_container'>${time} <div class='msr_list'>${log.message}</div></div>`;
	}
	return `<div class='log_container'>${time}: UNKWOWN LOG TYPE: ${(log as any).type}</div>`;
}

export function getPatientConsole(): string {
	const id = getCurrentPatientId();

	const console = getHumanConsole(id);
	return console.map(formatLog).join('');
}

export function categorize(category: string) {
	const system = getTagSystem();
	const resolved = getCategory(category);
	const autoTriage = doAutomaticTriage()!;
	if (resolved != null) {
		sendEvent({
			...initEmitterIds(),
			type: 'Categorize',
			targetType: 'Human',
			targetId: Context.patientConsole.state.currentPatient,
			category: resolved.category.id,
			system: system,
			autoTriage: autoTriage,
			severity: resolved.severity,
		});
	}
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

export function getCurrentPatientTitle(): string {
	const id = getCurrentPatientId();
	const human = getHuman(id);
	if (human != null) {
		const age = getRoundedAge(human!);
		return `<span class='human-id'>${id}</span>,
		 <span class='human-sex'>${human!.meta.sex}</span>,
		  <span class='human-age'>~${age}y</span>`;
	}
	return '';
}

function getAlertness(overview: HumanOverview): string {
	if (overview.looksDead) {
		return 'semble mort';
	} else if (overview.gcs.eye === 4) {
		return 'alerte, vous regarde';
	} else if (overview.gcs.eye === 3) {
		return 'peu alerte, réagi à la voix';
	} else {
		return 'yeux fermés';
	}
}

function getBreathingOverview(overview: HumanOverview): string {
	if (overview.rr === 0 || overview.gcs.total < 10 && overview.tidalVolume_L < 0.6 && overview.rr < 15) {
		// coma + low respiration
		return 'no apparent breathing';
	} else if (overview.tidalVolume_L > 1 && overview.rr > 25) {
		return 'deep and rapid breathing';
	} else if (overview.tidalVolume_L > 1) {
		return 'deep breathing';
	} else if (overview.rr > 25) {
		return 'rapid breathing';
	} else {
		return 'respiration looks normal';
	}
}

export function getHumanVisualInfos(): string {
	const human = getCurrentPatientBody();
	const output: string[] = [''];
	if (human != null) {
		const overview = getOverview(human);
		if (overview) {
			output.push(overview.position.toLowerCase());
			output.push(getAlertness(overview));
			if (overview.totalExternalBloodLosses_ml > 0) {
				output.push('saigne');
			}
			output.push(getBreathingOverview(overview));
		}
	} else {
		output.push('<em>Error [patient not found]</em>');
	}

	// join non-empty cells
	return output.filter(o => o).join(', ');
}

export function getAfflictedBlocks(): string[] {
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
				output[m.block] = true;
			});
		});
		effects.forEach(effect => {
			if (effect.action.visible) {
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
		return '<em>no patient</em>';
	}

	if (human.category == null) {
		return `<em>${id} has not been categorized yet</em>`;
	}

	return resultToHtml(human.category.autoTriage);
}
