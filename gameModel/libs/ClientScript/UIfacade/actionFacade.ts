/**
 * All UX interactions related to actions should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { fetchCasuMessageRequestValues } from "../gameInterface/actionsButtonLogic";
import { ActionBase } from "../game/common/actions/actionBase";
import {
	ActionTemplateBase,
	AssignTaskToResourcesActionTemplate,
	CasuMessageTemplate,
	DefineMapObjectTemplate,
	ReleaseResourcesFromTaskActionTemplate,
	SelectMapObjectTemplate,
	SendResourcesToActorActionTemplate,
} from '../game/common/actions/actionTemplateBase';
import { ActorId, TemplateId, TemplateRef } from '../game/common/baseTypes';
import { ActionCreationEvent } from '../game/common/events/eventTypes';
import {
	buildAndLaunchActionCancellation,
	buildAndLaunchActionFromTemplate,
	fetchAvailableActions,
	getCurrentState,
} from '../game/mainSimulationLogic';
import { getEmptyResourceRequest } from "../gameInterface/interfaceState";

const logger = Helpers.getLogger('mainSim-interface');

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 * 
 * @param actionTemplateId The template to instanciate
 * @param selectedActor The actor the plans the action and will be its owner
 * @param params The additional optional parameters, related to the chosen action template
 * @returns a promise
 */
export async function planAction(actionTemplateId: TemplateRef, selectedActor: ActorId, params?: any): Promise<IManagedResponse | undefined>{
  return await buildAndLaunchActionFromTemplate(actionTemplateId, selectedActor, params);
}

// TODO Maybe ensure only owning actor can cancel actions
/**
 *
 * @param actionId The action to cancel
 * @param selectedActor The actor that cancels the action
 * @returns
 */
export async function cancelAction(selectedActor: ActorId, templateId: TemplateId): Promise<IManagedResponse | undefined> {
	return await buildAndLaunchActionCancellation(selectedActor, templateId);
}

/**
 * @param actorId
 * @returns a list of actions that the current actor can undertake
 */
export function getAvailableActions(actorId : ActorId): ActionTemplateBase[] {
  return fetchAvailableActions(actorId);
}

/**
 * @returns All the actions that have been planned
 */
export function getAllActions(): Record<ActorId, Readonly<ActionBase>[]> {
  return getCurrentState().getActionsByActorIds();
}

export function getAllCancelledActions(): Readonly<ActionBase[]> {
	return getCurrentState().getAllCancelledActions();
}

/**
 * @returns Template of given action Uid
 */
export function getActionTemplate(id: number): ActionTemplateBase<ActionBase, ActionCreationEvent, unknown> | undefined {
	return getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
}

/**
 * @param id Uid of given action
 */
export function isDefineMapObjectTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof DefineMapObjectTemplate;
}

export function isSelectMapObjectTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof SelectMapObjectTemplate;
}

/**
 * @param id Uid of given action
 */
export function isCasuMessageActionTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof CasuMessageTemplate;
}

/**
 * @param id Uid of given action template
 */
export function isSendResourcesToActorActionTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof SendResourcesToActorActionTemplate;
}

/**
 * @param id Uid of given action template
 */
export function isAssignResourcesToTaskActionTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof AssignTaskToResourcesActionTemplate;
}

export async function planCasuMessageAction() {
	const actor = Context.interfaceState.state.currentActorUid;
	const actTpl = getActionTemplate(Context.interfaceState.state.currentActionUid);
	const params = fetchCasuMessageRequestValues();
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.showMethaneModal = false;
	newState.resources.requestedResources = getEmptyResourceRequest();
	Context.interfaceState.setState(newState);
	return await planAction(actTpl!.getTemplateRef(), actor!, params);
}
/**
 * @param id Uid of given action template
 */
export function isReleaseResourcesToTaskActionTemplate(id: number) {
	const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(t => t.Uid === id);
	return template instanceof ReleaseResourcesFromTaskActionTemplate;
}

