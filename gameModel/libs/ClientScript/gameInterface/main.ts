import { ActionTemplateBase, AssignTaskToResourcesActionTemplate, MethaneTemplate, ReleaseResourcesFromTaskActionTemplate, RequestResourcesFromActorActionTemplate, SendResourcesToActorActionTemplate } from "../game/common/actions/actionTemplateBase";
import { GeometryType } from "../game/common/events/defineMapObjectEvent";
import { startMapAction } from "../gameMap/main";
import { cancelAction, getActionTemplate, getAllActions, isDefineMapObjectTemplate, isMethaneActionTemplate, isRequestResourcesFromActorActionTemplate, planAction } from "../UIfacade/actionFacade";
import { getAllActors } from "../UIfacade/actorFacade";
import { getSimTime } from "../UIfacade/timeFacade";

const logger = Helpers.getLogger('mainSim-interface')

/**
 * 
 */
type gameStateStatus = "NOT_INITIATED" | "RUNNING" | "PAUSED";

/**
 * Get the current gameStateStatus
 */
export function getGameStateStatus(): gameStateStatus {
	return Variable.find(gameModel, 'gameState').getValue(self) as gameStateStatus;
}

/**
 * Initialise interface with default values
 */
export function initInterface(): void {
	// Set the currentActorUid vegas variable to first actor available
	const actors = getAllActors();
	setCurrentActorUid(actors[0].Uid);
	// Reset any map action and tmpFeature
}

/**
 * Get current selected Actor Uid
 * @returns Uid
 */
export function getCurrentActorUid() {
	return Variable.find(gameModel, 'currentActorUid').getValue(self);
}

/**
 * Set the currently selected actor Uid
 */
export function setCurrentActorUid(id: number): void {
	APIMethods.runScript(
		`Variable.find(gameModel, 'currentActorUid').setValue(self, ${id});`,
		{},
	);
}

/**
 * Get currently selected Action Uid
 * @returns Uid
 */
export function getCurrentActionUid() {
	return Variable.find(gameModel, 'currentActionUid').getValue(self);
}

/**
 * Show the mainSim modal
 */
export function showModal() {
	APIMethods.runScript(
		`Variable.find(gameModel, 'showModal').setValue(self, true)`,
		{},
	);
}

// TODO Add validation for actions taking place over more than 60 seconds

/**
 * Can the current actor plan an action ?
 * @returns boolean
 */
export function canPlanAction(): boolean {
	const currentTime = getSimTime();
	const actorUid = getCurrentActorUid();
	const actions = getAllActions();

	if (actions[actorUid] === undefined) return true;

	for (const action of actions[actorUid]) {
		// Is a future action planned ?
		if (action.startTime === currentTime) return false;
		// Is a previous action finished ?
		if (action.startTime + action.duration() > currentTime) return false;
	}

	return true;
}

export function isPlannedAction(id: number) {
	const actorUid = getCurrentActorUid();
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
 * 
 */
export function actionClickHandler (id: number, params: any) : void {

	const template = getActionTemplate(id)!;
	const uid = getCurrentActorUid();

	if (canPlanAction()) {
		// TODO hardcoded for demo
		if (isDefineMapObjectTemplate(id) && template.featureDescription.geometryType === 'Point') {
			startMapAction(params);
		} else if (isMethaneActionTemplate(id)){
			APIMethods.runScript(`Variable.find(gameModel, 'showMethaneModal').setValue(self, true)`, {});
		} else {
			planAction(template.getTemplateRef(), uid, params);
		}
	} else if (isPlannedAction(id)) {
		cancelAction(uid, id);
	} else {
		// Error handling modal
		showModal()
	}
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
	let splitted = dateTime.toLocaleString().split(' ')[1].split(':').splice(0, 2);
	let result = splitted.join(':');

	return result;
}

export function showActionParamsPanel(actionTemplate : ActionTemplateBase) {
	if (Context.action instanceof RequestResourcesFromActorActionTemplate) {
		return "53";
	} else if (Context.action instanceof SendResourcesToActorActionTemplate) {
		return "54";
	} else if (Context.action instanceof AssignTaskToResourcesActionTemplate) {
		return "55";
	} else if (Context.action instanceof ReleaseResourcesFromTaskActionTemplate) {
		return "56";
	}	else if (Context.action instanceof MethaneTemplate) {
		return "42";
	}

	return "57";
}




