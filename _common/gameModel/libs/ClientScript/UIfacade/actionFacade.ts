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
import { ActionId, ActionTemplateUid, ActorId } from '../game/common/baseTypes';
import { Uid } from '../game/common/interfaces';
import { RadioType } from '../game/common/radio/communicationType';
import { isOngoingAndStartedAction } from '../game/common/simulationState/actionStateAccess';
import {
  buildAndLaunchActionFromTemplate,
  fetchAvailableActionTemplates,
  getActionTemplates,
  getCurrentState,
  getUniqueActionTemplates,
} from '../game/mainSimulationLogic';
import { getTypedInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { refreshSelectionLayer } from '../gameMap/main';
import { getCurrentPlayerActors } from './actorFacade';
import {
  CasuMessageTemplate,
  PretriageReportTemplate,
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

export interface ActionFeedbackEntry {
  uid: number;
  actionId: ActionId;
  message: string;
}

// used in page 64 (notificationPageloader), to display feedbacks given by the actor's actions
export function getActionFeedbacks(actorId: ActorId): ActionFeedbackEntry[] {
  const actions = getAllActions()[actorId] ?? [];

  return actions
    .flatMap(action =>
      action.getFeedbacks().map(feedback => ({
        actionId: action.Uid,
        message: I18n.translate(feedback),
      }))
    )
    .map((entry, index) => ({ ...entry, uid: index }));
}

export interface CompletedActionEntry {
  uid: ActionId;
  title: string;
  duration: number;
  description: string;
  choiceTitle: string | undefined;
  choiceDescription: string | undefined;
  feedbacks: string[];
}

// used in page 45 (actionStandardList), to display actions already completed by the current actor
export function getCompletedActions(): CompletedActionEntry[] {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (!currentActorUid) {
    return [];
  }

  const templates = getActionTemplates();

  return (getAllActions()[currentActorUid] ?? [])
    .filter(action => action.getStatus() === 'Completed')
    .map(action => {
      const template = templates[action.getTemplateId()];
      const choice = action instanceof ChoiceAction ? action.choice : undefined;

      return {
        uid: action.Uid,
        title: template?.getTitle() ?? '',
        duration: action.duration() / 60,
        description: template?.getDescription() ?? '',
        choiceTitle: choice ? I18n.translate(choice.title) : undefined,
        choiceDescription: choice ? I18n.translate(choice.description) : undefined,
        feedbacks: action.getFeedbacks().map(feedback => I18n.translate(feedback)),
      };
    });
}

/**
 * Whether the given completed action's card should be displayed expanded.
 * Defaults to the most recently completed action as long as none has been explicitly clicked.
 */
export function isActiveCompletedAction(actionUid: ActionId): boolean {
  const current = getTypedInterfaceState().currentCompletedActionUid;
  if (current !== undefined) {
    return current === actionUid;
  }

  const completedActions = getCompletedActions();
  return completedActions[completedActions.length - 1]?.uid === actionUid;
}

// used in page 45, expands the clicked completed action card, collapsing any other
export function toggleCompletedAction(actionUid: ActionId): void {
  setInterfaceState({ currentCompletedActionUid: actionUid });
}

// used in page 45, to know whether the feedback list of the expanded completed action is shown
export function isCompletedActionFeedbackVisible(): boolean {
  return getTypedInterfaceState().showCompletedActionFeedback;
}

// used in page 45, on the arrow next to the completed action's title
export function toggleCompletedActionFeedback(): void {
  setInterfaceState({
    showCompletedActionFeedback: !getTypedInterfaceState().showCompletedActionFeedback,
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

export function isCustomDurationActionTemplate(
  template: ActionTemplateBase | undefined
): template is CustomDurationActionTemplateType {
  return template instanceof CustomDurationActionTemplate;
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

export function updateCustomDurationsState(uid: number, newValue: number) {
  const updatedCustomDurations = { ...getTypedInterfaceState().customDurations };

  updatedCustomDurations[uid] = newValue;
  setInterfaceState({ customDurations: updatedCustomDurations });
}
