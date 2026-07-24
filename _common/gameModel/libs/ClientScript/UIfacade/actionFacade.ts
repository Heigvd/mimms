/**
 * All UX interactions related to actions should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { IUniqueActionTemplates } from '../game/actionTemplatesData';
import { ActionBase, ChoiceAction } from '../game/common/actions/actionBase';
import * as ActionLogic from '../game/common/actions/actionLogic';
import {
  ActionTemplateBase,
  ChoiceTemplate,
  SimFlag,
} from '../game/common/actions/actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from '../game/common/actions/choiceDescriptor/choiceDescriptor';
import { ActionType } from '../game/common/actionType';
import { Actor } from '../game/common/actors/actor';
import { ActionTemplateUid, ActorId } from '../game/common/baseTypes';
import { situationUpdateDurations, TimeSliceDuration } from '../game/common/constants';
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
import { getTranslation } from '../tools/translation';
import { getCurrentPlayerActors } from './actorFacade';
import {
  CasuMessageTemplate,
  PretriageReportTemplate,
  SendRadioMessageTemplate,
} from '../game/common/actions/actionTemplate/radioTemplates';
import {
  MoveActorActionTemplate,
  SituationUpdateActionTemplate,
} from '../game/common/actions/actionTemplate/actorTemplates';
import {
  EvacuationActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
} from '../game/common/actions/actionTemplate/patientResourceTemplates';

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
export function isCurrentActorDoing<T extends ActionBase>(actionClass: {
  new (...args: any[]): T;
}): boolean {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  const state = getCurrentState();

  if (currentActorUid) {
    return isOngoingAndStartedAction(state, currentActorUid, actionClass);
  }

  return false;
}

export function areAllActorsDoing<T extends ActionBase>(actionClass: {
  new (...args: any[]): T;
}): boolean {
  const state = getCurrentState();
  const playerActors: Readonly<Actor[]> = getCurrentPlayerActors();

  return playerActors.every((actor: Actor) =>
    isOngoingAndStartedAction(state, actor.Uid, actionClass)
  );
}

export function getActorsNotDoing<T extends ActionBase>(actionClass: {
  new (...args: any[]): T;
}): Actor[] {
  const state = getCurrentState();
  const playerActors: Readonly<Actor[]> = getCurrentPlayerActors();

  return playerActors.filter(
    (actor: Actor) => !isOngoingAndStartedAction(state, actor.Uid, actionClass)
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

export function isMethaneSendDisabled(): boolean {
  const { casuMessage, hospitalInfoChosenProximity } = getTypedInterfaceState();
  return casuMessage.messageType === 'R' && hospitalInfoChosenProximity === undefined;
}

export function updateChoice(choiceUid: Uid): void {
  setInterfaceState({ selectedActionChoiceUid: choiceUid });
  refreshSelectionLayer();
}
