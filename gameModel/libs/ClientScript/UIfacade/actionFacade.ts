/**
 * All UX interactions related to actions should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActionBase } from "../game/common/actions/actionBase";
import { ActionTemplateBase, DefineMapObjectTemplate, MethaneTemplate } from "../game/common/actions/actionTemplateBase";
import { ActorId, TemplateRef } from "../game/common/baseTypes";
import { ActionCreationEvent } from "../game/common/events/eventTypes";
import { buildAndLaunchActionFromTemplate, fetchAvailableActions, getCurrentState } from "../game/mainSimulationLogic";
import { getCurrentActorUid } from "../gameInterface/main";
import { getMapState } from "../gameMap/main";
import { getAllActionTemplates } from "../UIfacade/debugFacade";

const logger = Helpers.getLogger('mainSim-interface');

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 * 
 * @param actionTemplateId The template to instanciate
 * @param selectedActor The actor the plans the action and will be its owner
 * @returns a promise
 */
export async function planAction(actionTemplateId: TemplateRef, selectedActor: ActorId): Promise<IManagedResponse | undefined>{
  const tmpFeature = getMapState().tmpFeature;
  return await buildAndLaunchActionFromTemplate(actionTemplateId, selectedActor, tmpFeature);
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

/**
 * @returns Template of given action Uid
 */
export function getActionTemplate(id: number): ActionTemplateBase<ActionBase, ActionCreationEvent, unknown> | undefined {
	return getAvailableActions(getCurrentActorUid()).find(t => t.Uid === id);
}

/**
 * @param id Uid of given action
 */
export function isDefineMapObjectTemplate(id: number) {
	logger.info('isDefined id: ', id)
	const template = getAllActionTemplates().find(t => t.Uid === id);
	logger.info(template);
	logger.info('return: ', template instanceof DefineMapObjectTemplate);
	return template instanceof DefineMapObjectTemplate;
}

/**
 * @param id Uid of given action
 */
export function isMethaneActionTemplate(id: number) {
	const template = getAvailableActions(getCurrentActorUid()).find(t => t.Uid === id);
	return template instanceof MethaneTemplate;
}