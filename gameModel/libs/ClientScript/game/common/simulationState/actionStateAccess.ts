import { ActionBase } from '../actions/actionBase';
import { MainSimulationState } from './mainSimulationState';
import { ActionTemplateId } from '../baseTypes';

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
  actionTemplateId: ActionTemplateId
): boolean {
  return getCompletedActions(state)
    .some(action => action.getTemplateId() === actionTemplateId);
}

/**
 * Some action of this template is ongoing.
 */
export function hasOngoingAction(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateId
): boolean {
  return getOngoingActions(state)
    .some(action => action.getTemplateId() === actionTemplateId);
}

/**
 * No action of this template in timeline.
 */
export function hasNoActionInTimeline(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateId
): boolean {
  // Note : no need to check future actions, an action never starts after now
  return !(state.getAllActions().some(action => action.getTemplateId() === actionTemplateId));
}
