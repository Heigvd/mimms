/**
 * All UX interactions related to actions should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ActionType, RadioType } from '../game/common/actionType';
import { ActionBase } from '../game/common/actions/actionBase';
import {
  ActionTemplateBase,
  CasuMessageTemplate,
  EvacuationActionTemplate,
  MoveActorActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
  PretriageReportTemplate,
  SelectionFixedMapEntityTemplate,
  SendRadioMessageTemplate,
  SimFlag,
} from '../game/common/actions/actionTemplateBase';
import { ActorId, TemplateId, TemplateRef } from '../game/common/baseTypes';
import { getAvailableActionTemplate as getAvailableActionTemplateFromState } from '../game/common/simulationState/actionStateAccess';
import {
  buildAndLaunchActionCancellation,
  buildAndLaunchActionFromTemplate,
  fetchActionTemplate,
  fetchAvailableActions,
  getCurrentState,
} from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';

// used in page 45 (actionStandardList)
export function getAvailableActionTemplates(
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (currentActorUid) {
    return fetchAvailableActions(currentActorUid, actionType);
  }

  return [];
}

// used in multiple pages
export function getActionTemplate(templateRef: TemplateRef): ActionTemplateBase | undefined {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (currentActorUid) {
    return getAvailableActionTemplateFromState(getCurrentState(), currentActorUid, templateRef);
  }

  return undefined;
}

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 *
 * @param actionTemplateId The template to instanciate
 * @param selectedActor The actor the plans the action and will be its owner
 * @param params The additional optional parameters, related to the chosen action template
 * @returns a promise
 */
export async function planAction(
  actionTemplateId: TemplateRef,
  selectedActor: ActorId,
  params?: any
): Promise<IManagedResponse | undefined> {
  return await buildAndLaunchActionFromTemplate(actionTemplateId, selectedActor, params);
}

// TODO Maybe ensure only owning actor can cancel actions
/**
 *
 * @param actionId The action to cancel
 * @param selectedActor The actor that cancels the action
 * @returns
 */
export async function cancelAction(
  selectedActor: ActorId,
  templateId: TemplateId
): Promise<IManagedResponse | undefined> {
  return await buildAndLaunchActionCancellation(selectedActor, templateId);
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

export function isFixedMapEntityTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof SelectionFixedMapEntityTemplate;
}

export function isCasuMessageActionTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof CasuMessageTemplate;
}

export function isRadioActionTemplate(templateRef: TemplateRef, radioChannel: RadioType): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof SendRadioMessageTemplate && template.radioChannel === radioChannel;
}

export function isMoveResourcesAssignTaskActionTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof MoveResourcesAssignTaskActionTemplate;
}

export function isMoveActorActionTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof MoveActorActionTemplate;
}

export function isEvacuationActionTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof EvacuationActionTemplate;
}

export function isPretriageReportTemplate(templateRef: TemplateRef): boolean {
  const template = fetchActionTemplate(templateRef);
  return template instanceof PretriageReportTemplate;
}

/**
 * Check if pcFront is already built
 */
export function isPCFrontBuilt(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.PCFRONT_BUILT);
}
