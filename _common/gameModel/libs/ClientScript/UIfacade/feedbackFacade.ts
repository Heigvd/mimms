/**
 * All UX interactions related to action feedbacks should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { ChoiceAction } from '../game/common/actions/actionBase';
import { ActionId } from '../game/common/baseTypes';
import { getActionTemplates } from '../game/mainSimulationLogic';
import { getTypedInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { getAllActions } from './actionFacade';
import { CustomDurationAction } from '../game/common/actions/actorActions';
import { addAfterUpdateCallback } from '../gameInterface/afterUpdateCallbacks';
import { AppointActorAction, MoveActorAction } from '../game/common/actions/actorActions';
import { DisplayMessageAction } from '../game/common/actions/radioActions';

export interface CompletedActionEntry {
  uid: ActionId;
  title: string;
  duration: number;
  description: string;
  choiceTitle: string | undefined;
  choiceDescription: string | undefined;
  feedbacks: string[];
}

type ActionWithFeedbacks =
  | ChoiceAction
  | CustomDurationAction
  | AppointActorAction
  | DisplayMessageAction
  | MoveActorAction;

// used in page 45 (actions list), to display actions already completed by the current actor
export function getCompletedActions(): CompletedActionEntry[] {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (!currentActorUid) {
    return [];
  }

  const templates = getActionTemplates();
  const currentActorActions = getAllActions()[currentActorUid] ?? [];

  return currentActorActions
    .filter((action): action is ActionWithFeedbacks => {
      // only actions that can actually carry a feedback (choice-driven, eg. "Examiner", or "Attendre");
      // this excludes automatic actions such as the radio messages
      const wantedType =
        action instanceof ChoiceAction ||
        action instanceof CustomDurationAction ||
        action instanceof AppointActorAction ||
        action instanceof DisplayMessageAction ||
        action instanceof MoveActorAction;
      const hasFeedback = action.getStatus() === 'OnGoing' || action.getStatus() === 'Completed';

      return hasFeedback && wantedType;
    })
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

export function setLastFeedbackAsCurrent() {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  const feedbacks = getCompletedActions();

  if (currentActorUid && feedbacks.length > 0) {
    setInterfaceState({
      showAction: false,
      currentFeedbackUid: { [currentActorUid]: feedbacks[feedbacks.length - 1]?.uid },
    });
  }
}

/** After the next state update (once the just-played action has landed), open its feedback. */
export function registerOpenLastFeedbackAfterUpdate(): void {
  addAfterUpdateCallback(() => setLastFeedbackAsCurrent());
}

export function showFeedback(actionUid: ActionId): boolean {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  const showAction = getTypedInterfaceState().showAction;

  if (!currentActorUid || showAction) {
    // o-oh
    return false;
  }

  /* Show if it's the current completed action or the last completed action */
  const currentFeedback = getTypedInterfaceState().currentFeedbackUid[currentActorUid];
  if (currentFeedback !== undefined) {
    return currentFeedback === actionUid;
  }

  const completedActions = getCompletedActions();
  return completedActions[completedActions.length - 1]?.uid === actionUid;
}

// used in page 45, expands the clicked feedback card for the current actor, collapses the currently opened
export function toggleFeedback(actionUid: ActionId): void {
  const currentActorUid = getTypedInterfaceState().currentActorUid;
  if (!currentActorUid) {
    return;
  }

  setInterfaceState({
    currentFeedbackUid: { [currentActorUid]: actionUid },
    showAction: false,
  });
}

// used in page 45, to know whether the feedback list is shown
export function showFeedbackSection(): boolean {
  return getTypedInterfaceState().showFeedbackSection;
}

// used in page 45, on the arrow next to the feedbacks' title
export function toggleFeedbackSectionVisibility(): void {
  setInterfaceState({
    showFeedbackSection: !getTypedInterfaceState().showFeedbackSection,
  });
}
