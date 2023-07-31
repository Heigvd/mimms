/**
 * All UX interactions related to actions should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActionBase } from "../game/common/actions/actionBase";
import { ActionTemplateBase } from "../game/common/actions/actionTemplateBase";
import { Actor } from "../game/common/actors/actor";
import { ActorId, TemplateRef } from "../game/common/baseTypes";
import { buildAndLaunchActionFromTemplate, fetchAvailableActions, getCurrentState } from "../game/mainSimulationLogic";

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 * 
 * @param actionTemplateId The template to instanciate
 * @param selectedActor The actor the plans the action and will be its owner
 * @returns a promise
 */
export async function planAction(actionTemplateId: TemplateRef, selectedActor: Actor): Promise<IManagedResponse | undefined>{
  return await buildAndLaunchActionFromTemplate(actionTemplateId, selectedActor);
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
