/**
 * All UX interactions related to actions should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

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
  StartEndTemplate,
} from '../game/common/actions/actionTemplateBase';
import { ActorId, TemplateId, TemplateRef } from '../game/common/baseTypes';
import { ActionCreationEvent } from '../game/common/events/eventTypes';
import {
  buildAndLaunchActionCancellation,
  buildAndLaunchActionFromTemplate,
  fetchAvailableActions,
  getCurrentState,
} from '../game/mainSimulationLogic';
import { ActionType } from '../game/common/actionType';
import { getTranslation } from '../tools/translation';
import { canPlanAction, isPlannedAction } from '../gameInterface/main';
import { runActionButton } from '../gameInterface/actionsButtonLogic';
import { getTypedInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { endMapAction, startMapSelect } from '../gameMap/main';

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------

/**
 * Typed action template context
 */
export function getActionTemplateContext(): ActionTemplateBase {
  return Context.actionTemplate as ActionTemplateBase;
}

export function getAvailableActionTemplates(
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (currentActorUid) {
    return fetchAvailableActions(currentActorUid, actionType);
  }

  return [];
}

export function getPlanActionButtonLabel(actionTemplate: ActionTemplateBase): string {
  if (canCancelAction(actionTemplate)) {
    return getTranslation('mainSim-interface', 'cancel');
  }

  return getTranslation('mainSim-interface', 'send');
}

export function isNotPlanned(actionTemplate: ActionTemplateBase): boolean {
  return !canPlanAction() && !isPlannedAction(actionTemplate.Uid);
}

export function isActiveAction(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate.Uid === getTypedInterfaceState().currentActionUid;
}

export function canCancelAction(actionTemplate: ActionTemplateBase): boolean {
  return isPlannedAction(actionTemplate.Uid);
}

export function isPlanActionButtonHidden(actionTemplate: ActionTemplateBase): boolean {
  return isNotPlanned(actionTemplate);
}

export function runPlanAction(actionTemplate: ActionTemplateBase): void {
  return runActionButton(actionTemplate);
}

export function getActionParamsPanel(actionTemplate: ActionTemplateBase): string {
  if (actionTemplate instanceof SelectionFixedMapEntityTemplate) {
    return '48';
  } else if (actionTemplate instanceof MoveActorActionTemplate) {
    return '66';
  }

  return '';
}

/**
 * Update state whenever user changes action
 */
export function actionChangeHandler(actionTemplate: ActionTemplateBase) {
  setInterfaceState({ currentActionUid: actionTemplate.Uid });

  endMapAction();
  // If action is SelectMapObject we begin routine
  if (isFixedMapEntityTemplate(actionTemplate.Uid) && canPlanAction()) {
    startMapSelect();
  }
}

export function getDurationInfo(actionTemplate: ActionTemplateBase): string {
  if (actionTemplate instanceof StartEndTemplate) {
    const duration: number = actionTemplate.duration / 60;
    return duration + ' ' + getTranslation('mainSim-resources', 'minutes', false);
  }

  return '';
}

// NO Context action !!!

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------

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
 * @param actorId
 * @returns a list of actions that the current actor can undertake
 */
export function getAvailableActions(
  actorId: ActorId,
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  return fetchAvailableActions(actorId, actionType);
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
export function getActionTemplate(
  id: number,
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase<ActionBase, ActionCreationEvent, unknown> | undefined {
  return getAvailableActions(Context.interfaceState.state.currentActorUid, actionType).find(
    t => t.Uid === id
  );
}

/**
 * @param id Uid of given action
 */

export function isFixedMapEntityTemplate(id: number): boolean {
  const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(
    t => t.Uid === id
  );
  return template instanceof SelectionFixedMapEntityTemplate;
}

/**
 * @param id Uid of given action
 */
export function isCasuMessageActionTemplate(id: number): boolean {
  const template = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.CASU_RADIO
  ).find(t => t.Uid === id);
  return template instanceof CasuMessageTemplate;
}

/**
 * @param id Uid of given action
 */
export function isRadioActionTemplate(id: number): boolean {
  const template = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.ACTORS_RADIO
  ).find(t => t.Uid === id);
  return template instanceof SendRadioMessageTemplate;
}

/**
 * @param id Uid of given action template
 */
export function isMoveResourcesAssignTaskActionTemplate(id: number): boolean {
  const template = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.ALLOCATE_RESOURCES
  ).find(t => t.Uid === id);
  return template instanceof MoveResourcesAssignTaskActionTemplate;
}

/**
 * @param id Uid of given action template
 */
export function isMoveActorActionTemplate(id: number): boolean {
  const template = getAvailableActions(Context.interfaceState.state.currentActorUid).find(
    t => t.Uid === id
  );
  return template instanceof MoveActorActionTemplate;
}

export function isEvacuationActionTemplate(id: number): boolean {
  const template = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.EVASAN_RADIO
  ).find(t => t.Uid === id);
  return template instanceof EvacuationActionTemplate;
}

export function isPretriageReportTemplate(id: number): boolean {
  const template = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.PRETRIAGE_REPORT
  ).find(t => t.Uid === id);
  return template instanceof PretriageReportTemplate;
}

/**
 * Check if pcFront is already built
 */
export function isPCFrontBuilt(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.PCFRONT_BUILT);
}
