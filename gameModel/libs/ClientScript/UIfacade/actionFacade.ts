/**
 * All UX interactions related to actions should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActionTemplateBase } from "../game/common/actions/actionTemplateBase";
import { InterventionRole } from "../game/common/actors/interventionRole";
import { TemplateRef } from "../game/common/baseTypes";
import { buildAndLaunchActionFromTemplate, fetchAvailableActions } from "../game/mainSimulationLogic";

export async function planAction(actionTemplateId: TemplateRef): Promise<IManagedResponse | undefined>{
  return await buildAndLaunchActionFromTemplate(actionTemplateId);
}

export function getAvailableActions(role : InterventionRole): ActionTemplateBase[] {
  return fetchAvailableActions(role);
}