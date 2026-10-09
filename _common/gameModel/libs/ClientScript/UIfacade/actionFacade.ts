/**
 * All UX interactions related to actions should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { IUniqueActionTemplates } from '../game/actionTemplatesData';
import { ActionBase, ActionClass, ChoiceAction } from '../game/common/actions/actionBase';
import * as ActionLogic from '../game/common/actions/actionLogic';
import {
  ActionTemplateBase,
  ChoiceTemplate,
  SimFlag,
  StartEndTemplate,
} from '../game/common/actions/actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from '../game/common/actions/choiceDescriptor/choiceDescriptor';
import { ActionType } from '../game/common/actionType';
import { Actor } from '../game/common/actors/actor';
import { ActionTemplateUid, ActorId } from '../game/common/baseTypes';
import { Uid } from '../game/common/interfaces';
import { RadioType } from '../game/common/radio/communicationType';
import { isOngoingAndStartedAction } from '../game/common/simulationState/actionStateAccess';
import {
  buildAndLaunchActionFromTemplate,
  fetchAvailableActionTemplates,
  getCurrentState,
  getUniqueActionTemplates,
} from '../game/mainSimulationLogic';
import { getTypedInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { refreshSelectionLayer } from '../gameMap/main';
import { getCurrentPlayerActors } from './actorFacade';
import {
  CasuMessageTemplate,
  SendRadioMessageTemplate,
} from '../game/common/actions/actionTemplate/radioTemplates';
import {
  CustomDurationActionTemplate,
  CustomDurationActionTemplateType,
  MoveActorActionTemplate,
} from '../game/common/actions/actionTemplate/actorTemplates';
import {
  EvacuationActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
} from '../game/common/actions/actionTemplate/patientResourceTemplates';
import { OneMinuteDuration } from '../game/common/constants';
import { getTranslation } from '../tools/translation';

// used in page 45 (actionStandardList)
export function getAvailableActionTemplates(
  actionType: ActionType = ActionType.ACTION
): ActionTemplateBase[] {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (currentActorUid) {
    return fetchAvailableActionTemplates(currentActorUid, actionType);
  }

  return [];
}

// used for choice actions in page 31
export function getAvailableActionTemplateById(templateId: ActionTemplateUid) {
  return getAvailableActionTemplates().find(t => t.uid === templateId);
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

export function getAvailableChoices(template: ChoiceTemplate): ChoiceDescriptor[] {
  return ActionLogic.getAvailableChoices(getCurrentState(), template);
}

// used in page 31 to know whether a single choice is worth displaying on its own
export function choiceHasContent(choice: ChoiceDescriptor): boolean {
  return !!I18n.translate(choice.title)?.trim() || !!I18n.translate(choice.description)?.trim();
}

export function uniqueActionTemplates(): IUniqueActionTemplates | undefined {
  return getUniqueActionTemplates();
}

// TODO there might be specific local UI state to add in there (like a selected position or geometry)
/**
 *
 * @param actionTemplate The template to instantiate
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

/**
 * @returns All the actions that have been planned
 */
export function getAllActions(): Record<ActorId, Readonly<ActionBase>[]> {
  return getCurrentState().getActionsByActorIds();
}

/**
 * Duration to display with the action description.
 * Empty when the action has no duration, or when it is a choice action
 * (the duration is already displayed on each choice).
 */
export function getActionDurationText(template: StartEndTemplate): string {
  if (isChoiceTemplate(template) || !template.duration) {
    return '';
  }
  return `${template.duration / 60} ${getTranslation('mainSim-resources', 'minutes', false)}`;
}

export function areAllActorsDoing<T extends ActionBase>(actionClass: ActionClass<T>): boolean {
  const state = getCurrentState();
  const playerActors: Readonly<Actor[]> = getCurrentPlayerActors();

  return playerActors.every((actor: Actor) =>
    isOngoingAndStartedAction(state, actor.Uid, actionClass)
  );
}

export function isChoiceTemplate(
  template: Readonly<ActionTemplateBase> | undefined
): template is ChoiceTemplate {
  return template instanceof ChoiceTemplate;
}

export function isChoiceAction(action: ActionBase | undefined): action is ChoiceAction {
  return action instanceof ChoiceAction;
}

export function hasMapChoices(choiceTemplate: ChoiceTemplate): boolean {
  return choiceTemplate.choices.some(choice => choice.displayedMapEntity);
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

export function isCustomDurationActionTemplate(
  template: ActionTemplateBase | undefined
): template is CustomDurationActionTemplateType {
  return template instanceof CustomDurationActionTemplate;
}

export function isEvacuationActionTemplate(template: ActionTemplateBase | undefined): boolean {
  return template instanceof EvacuationActionTemplate;
}

/**
 * Check if pcFront is already built
 */
export function isPCFrontBuilt(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.PCFRONT_BUILT);
}

export function isMethaneSendDisabled(): boolean {
  const { casuMessage, hospitalInfoChosenProximity } = getTypedInterfaceState();
  return casuMessage.messageType === 'R' && hospitalInfoChosenProximity === undefined;
}

export function updateChoice(choiceUid: Uid): void {
  setInterfaceState({ selectedActionChoiceUid: choiceUid });
  refreshSelectionLayer();
}

export function updateCustomDurationsState(uid: number, newValue: number) {
  const updatedCustomDurations = { ...getTypedInterfaceState().customDurations };

  updatedCustomDurations[uid] = newValue;
  setInterfaceState({ customDurations: updatedCustomDurations });
}

/**
 * formats display of a duration range
 * @param min duration in seconds
 * @param max duration in seconds if applicable
 */
export function formatDurationMinMax(min: number, max: number | undefined = undefined): string {
  const minMinutes = (min || 0) / OneMinuteDuration;
  if (max !== undefined && min < max) {
    return `${minMinutes} - ${max / OneMinuteDuration}'`;
  }
  return minMinutes + "'";
}

/**
 * @returns formats display of a choice duration
 */
export function formatChoiceDuration(template: StartEndTemplate, choice: ChoiceDescriptor): string {
  return formatDurationMinMax(Math.max(0, template.duration + (choice.durationDeltaSec || 0)));
}

/**
 * formats the duration of an action template.
 * For choice templates, displays the range of durations among the available choices
 */
export function formatActionDuration(template: ActionTemplateBase): string {
  if (template instanceof ChoiceTemplate) {
    const durations = getAvailableChoices(template).map(c => template.getChoiceDuration(c));
    if (durations.length > 0) {
      return formatDurationMinMax(Math.min(...durations), Math.max(...durations));
    }
  } else if (template instanceof StartEndTemplate) {
    return formatDurationMinMax(template.duration);
  }
  return formatDurationMinMax(0);
}
