import { ActionBase } from '../actions/actionBase';
import { ActionTemplateUid } from '../baseTypes';
import { ChoiceActivable, getChoiceActivable } from './activableState';
import { MainSimulationState } from './mainSimulationState';
import { actionLogger } from '../../../tools/logger';
import { ChoiceDescriptor } from '../actions/choiceDescriptor/choiceDescriptor';
import { Uid } from '../interfaces';
import { ANY_CHOICE } from '../constants';
import { isChoiceAction } from '../../../UIfacade/actionFacade';
import { getMapEntityDescriptor } from '../../loaders/mapEntitiesLoader';

export function isChoiceAvailable(
  state: Readonly<MainSimulationState>,
  choice: ChoiceDescriptor
): boolean {
  const choiceActivable: ChoiceActivable | undefined = getChoiceActivable(state, choice.uid);

  if (choiceActivable) {
    if (choiceActivable.active) {
      const hasMaxRepetitions: boolean = choice.repeats != undefined && choice.repeats > 0;
      if (hasMaxRepetitions && countStartedChoices(state, choice.uid) >= choice.repeats) {
        actionLogger.info(`choice '${choice.uid}' cannot be run anymore`);
        return false;
      }
      if (choice.displayedMapEntity && !getMapEntityDescriptor(choice.displayedMapEntity)) {
        actionLogger.warn(
          `choice '${choice.uid}' has a broken map entity reference ${choice.displayedMapEntity}`
        );
        return false;
      }

      return true;
    } else {
      actionLogger.info(`choice '${choice.uid}' is not active`);
      return false;
    }
  } else {
    actionLogger.error(`choice '${choice.uid}' has no activable`);
    return false;
  }
}

export function getOngoingActionsForActor(
  state: Readonly<MainSimulationState>,
  actorUid: number
): ActionBase[] {
  return getOngoingActions(state).filter((a: ActionBase) => a.ownerId === actorUid);
}

export function getOngoingActions(state: Readonly<MainSimulationState>): ActionBase[] {
  return state.getAllActions().filter((a: ActionBase) => a.getStatus() === 'OnGoing');
}

function getCompletedActions(state: Readonly<MainSimulationState>): ActionBase[] {
  return state.getAllActions().filter((a: ActionBase) => a.getStatus() === 'Completed');
}

export function getStartedActionsOfTemplate(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateUid
): ActionBase[] {
  return state
    .getAllActions()
    .filter(
      action => action.startTime < state.getSimTime() && action.getTemplateId() === actionTemplateId
    );
}

export function countStartedChoices(state: Readonly<MainSimulationState>, choiceRef: Uid): number {
  return state
    .getAllActions()
    .filter(
      action =>
        action.startTime < state.getSimTime() &&
        isChoiceAction(action) &&
        action.choice?.uid === choiceRef
    ).length;
}

export function isOngoingAndStartedAction<T extends ActionBase>(
  state: Readonly<MainSimulationState>,
  actorUid: number,
  actionClass: { new (...args: any[]): T }
): boolean {
  return (
    getOngoingActionsForActor(state, actorUid).find(
      (a: ActionBase) => a instanceof actionClass && isActionOngoingAndStarted(state, a)
    ) != undefined
  );
}

function isActionOngoingAndStarted(
  state: Readonly<MainSimulationState>,
  action: ActionBase
): boolean {
  return action.getStatus() === 'OnGoing' && action.startTime < state.getSimTime();
}

/**
 * Some action of this template has completed at least once.
 */
export function hasCompletedOnceAction(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateUid,
  choiceRef: Uid
): boolean {
  if (choiceRef === ANY_CHOICE) {
    return getCompletedActions(state).some(action => action.getTemplateId() === actionTemplateId);
  } else {
    return getCompletedActions(state).some(
      action => isChoiceAction(action) && action.choice?.uid === choiceRef
    );
  }
}

/**
 * Some action of this template is ongoing.
 */
export function hasOngoingAction(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateUid,
  choiceRef: Uid
): boolean {
  if (choiceRef === ANY_CHOICE) {
    return getOngoingActions(state).some(action => action.getTemplateId() === actionTemplateId);
  } else {
    return getOngoingActions(state).some(
      action => isChoiceAction(action) && action.choice?.uid === choiceRef
    );
  }
}

/**
 * No action of this template in timeline (with specific choice or any choice).
 */
export function hasNoActionInTimeline(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateUid,
  choiceRef: Uid
): boolean {
  // Note : no need to check future actions, an action never starts after now
  if (choiceRef === ANY_CHOICE) {
    return !state.getAllActions().some(action => action.getTemplateId() === actionTemplateId);
  } else {
    return !state
      .getAllActions()
      .some(action => isChoiceAction(action) && action.choice?.uid === choiceRef);
  }
}
