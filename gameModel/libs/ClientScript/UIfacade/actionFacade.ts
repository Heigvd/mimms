/**
 * All UX interactions related to actions should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { IUniqueActionTemplates } from '../game/actionTemplatesData';
import { ActionType, RadioType } from '../game/common/actionType';
import { ActionBase, SituationUpdateAction } from '../game/common/actions/actionBase';
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
  SituationUpdateActionTemplate,
} from '../game/common/actions/actionTemplateBase';
import { ActorId, TemplateId } from '../game/common/baseTypes';
import {
  buildAndLaunchActionCancellation,
  buildAndLaunchActionFromTemplate,
  fetchAvailableActions,
  getCurrentState,
  getUniqueActionTemplates,
} from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { canPlanAction, isPlannedAction } from '../gameInterface/main';
import { getTranslation } from '../tools/translation';
import { TimeSliceDuration } from '../game/common/constants';
import { situationUpdateDurations } from '../game/common/situationUpdate/situationUpdate';
import { isOngoingAndStartedAction } from '../game/common/simulationState/actionStateAccess';
import { Actor } from '../game/common/actors/actor';
import { getCurrentPlayerActors } from '../UIfacade/actorFacade';

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

export function isAvailable(template: ActionTemplateBase): boolean {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (template && currentActorUid) {
    const state = getCurrentState();
    const actor = state.getActorById(currentActorUid);
    if (actor) {
      return template.isAvailable(state, actor);
    }
  }
  return false;
}

/**
 * @param template
 * @returns true if the action can be played or is currently planned, thus can be cancelled
 */
export function canCancel(template: ActionTemplateBase): boolean {
  return isAvailable(template) && isPlannedAction(template.Uid);
}

/**
 * @param template
 * @returns true if an action can be planned by the current actor
 * or that the current actor can cancel an action based on this template
 */
export function canPlanOrCancel(template: ActionTemplateBase): boolean {
  return canPlanAction() || canCancel(template);
}

export function uniqueActionTemplates(): IUniqueActionTemplates {
  return getUniqueActionTemplates();
}

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 *
 * @param actionTemplate The template to instanciate
 * @param selectedActor The actor the plans the action and will be its owner
 * @param params The additional optional parameters, related to the chosen action template
 * @returns a promise
 */
export async function planAction(
  actionTemplate: ActionTemplateBase,
  selectedActor: ActorId,
  params?: any
): Promise<IManagedResponse | undefined> {
  return await buildAndLaunchActionFromTemplate(actionTemplate, selectedActor, params);
}

// TODO Maybe ensure only owning actor can cancel actions
/**
 *
 * @param selectedActor The actor that cancels the action
 * @param templateId The template of the action to cancel
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

export function getDefaultSituationUpdateDuration(): number {
  return TimeSliceDuration * situationUpdateDurations[0]!;
}

export function getDurationChoicesForSituationUpdateAction(): { label: string; value: string }[] {
  return situationUpdateDurations.map((nbMinutes: number) => {
    return {
      label: `${nbMinutes} ${getTranslation('mainSim-resources', 'minutes', false)}`,
      value: `${TimeSliceDuration * nbMinutes}`,
    };
  });
}

export function isCurrentActorCurrentlyInSituationUpdate(): boolean {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  const state = getCurrentState();

  if (currentActorUid) {
    return isOngoingAndStartedAction(state, currentActorUid, SituationUpdateAction);
  }

  return false;
}

export function getPlayerActorsCurrentlyNotInSituationUpdate(): Actor[] {
  const state = getCurrentState();
  const playerActors: Readonly<Actor[]> = getCurrentPlayerActors();

  return playerActors.filter(
    (actor: Actor) => !isOngoingAndStartedAction(state, actor.Uid, SituationUpdateAction)
  );
}

export function areAllPlayerActorsCurrentlyInSituationUpdate(): boolean {
  const state = getCurrentState();
  const playerActors: Readonly<Actor[]> = getCurrentPlayerActors();

  return playerActors.every((actor: Actor) =>
    isOngoingAndStartedAction(state, actor.Uid, SituationUpdateAction)
  );
}

export function isFixedMapEntityTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof SelectionFixedMapEntityTemplate;
}

export function isCasuMessageActionTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof CasuMessageTemplate;
}

export function isRadioActionTemplate(
  template: ActionTemplateBase | undefined,
  radioChannel: RadioType
): boolean {
  return template instanceof SendRadioMessageTemplate && template.radioChannel === radioChannel;
}

export function isMoveResourcesAssignTaskActionTemplate(
  template: ActionTemplateBase | undefined
): boolean {
  return template instanceof MoveResourcesAssignTaskActionTemplate;
}

export function isMoveActorActionTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof MoveActorActionTemplate;
}

export function isSituationUpdateActionTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof SituationUpdateActionTemplate;
}

export function isEvacuationActionTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof EvacuationActionTemplate;
}

export function isPretriageReportTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof PretriageReportTemplate;
}

/**
 * Check if pcFront is already built
 */
export function isPCFrontBuilt(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.PCFRONT_BUILT);
}
