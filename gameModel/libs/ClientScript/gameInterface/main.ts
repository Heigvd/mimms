import { ActionTemplateBase, AssignTaskToResourcesActionTemplate, CasuMessageTemplate, DefineMapObjectTemplate, ReleaseResourcesFromTaskActionTemplate, SelectMapObjectTemplate, SendResourcesToActorActionTemplate } from "../game/common/actions/actionTemplateBase";
import { endMapAction, startMapAction, startMapSelect } from "../gameMap/main";
import { cancelAction, getActionTemplate, getAllActions, isSelectMapObjectTemplate, planAction } from "../UIfacade/actionFacade";
import { getSimTime } from "../UIfacade/timeFacade";


type gameStateStatus = "NOT_INITIATED" | "RUNNING" | "PAUSED";

/**
 * Get the current gameStateStatus
 */
export function getGameStateStatus(): gameStateStatus {
	return Variable.find(gameModel, 'gameState').getValue(self) as gameStateStatus;
}


export interface InterfaceState {
	currentActorUid: number;
	currentActionUid: number;
}

/**
 * Get the current interface state
 */
export function getInterfaceState(): InterfaceState {
	return Context.interfaceState.state;
}

/**
 * Can the current actor plan an action ?
 * @returns boolean
 */
export function canPlanAction(): boolean {
	const currentTime = getSimTime();
	const actorUid = Context.interfaceState.state.currentActorUid;
	const actions = getAllActions();

	if (actions[actorUid] === undefined) return true;

	for (const action of actions[actorUid]!) {
		// Is a future action planned ?
		if (action.startTime === currentTime) return false;
		// Is a previous action finished ?
		if (action.startTime + action.duration() > currentTime) return false;
	}

	return true;
}

export function isPlannedAction(id: number) {
	const actorUid = Context.interfaceState.state.currentActorUid;
	const actions = getAllActions()[actorUid];

	if (actorUid && actions) {
		const action = actions.find(a => a.startTime === getSimTime());
		if (action) {
			return id == action.getTemplateId();
		}
	}

	return false;
}

/**
 * Handle when an action is planned
 */
export function actionClickHandler(id: number, params: any): void {

	const template = getActionTemplate(id)!;
	const uid = Context.interfaceState.state.currentActorUid;

	if (canPlanAction()) {
		if (template instanceof DefineMapObjectTemplate) {
			startMapAction(params);
		} else if (template instanceof CasuMessageTemplate) {
			const newState = Helpers.cloneDeep(Context.interfaceState.state)
			newState.showMethaneModal = true;
			Context.interfaceState.setState(newState);
		} else {
			planAction(template.getTemplateRef(), uid, params);
		}
	} else if (isPlannedAction(id)) {
		cancelAction(uid, id);
	}
}

/**
 * Update state whenever user changes action, check if action is SelectMapObject
 */
export function actionChangeHandler() {
	Context.interfaceState.setState({
		...Context.interfaceState.state,
		currentActionUid: Context.action.Uid,
	})
	endMapAction();
	if (isSelectMapObjectTemplate(Context.action.Uid) && canPlanAction()) {
		startMapSelect();
	}
}

export function planMapAction() {
	const actorUid = Context.interfaceState.state.currentActorUid;
	const template = getActionTemplate(Context.interfaceState.state.currentActionUid);
	const tmpFeature = Context.mapState.state.tmpFeature;

	planAction(template!.getTemplateRef(), actorUid, tmpFeature);
	endMapAction();
}

/**
 * Return Date object with start time
 */
export function getStartTime(): Date {
	// const hours = Variable.find(gameModel, 'startHours').getValue(self);
	// const minutes = Variable.find(gameModel, 'startMinutes').getValue(self);
	// Hardcoded in demo
	const hours = 16;
	const minutes = 0;

	const dateTime = new Date();
	dateTime.setHours(hours);
	dateTime.setMinutes(minutes);

	return dateTime;
}

/**
 * Get notification time in HH:MM format
 */
export function getNotificationTime(notificationTime: number) {
	const startTime = getStartTime();
	startTime.setSeconds(notificationTime + startTime.getSeconds());

	return formatTime(startTime);
}

/**
 * Return given time in HH:MM format
 */
export function formatTime(dateTime: Date) {
	let splitted = dateTime.toLocaleString().split(' ')[1]!.split(':').splice(0, 2);
	let result = splitted.join(':');

	return result;
}

export function showActionParamsPanel(actionTemplate: ActionTemplateBase) {
	if (Context.action instanceof SendResourcesToActorActionTemplate) {
		return "54";
	} else if (Context.action instanceof AssignTaskToResourcesActionTemplate) {
		return "55";
	} else if (Context.action instanceof ReleaseResourcesFromTaskActionTemplate) {
		return "56";
	} else if (Context.action instanceof SelectMapObjectTemplate) {
		return "48";
	}

	return "";
}

export function getModalPageNumber(): string {
	if (Context.interfaceState.state.showMethaneModal) {
		return "42";
	}
	return "";
}

