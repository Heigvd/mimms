import { ActionTemplateBase } from '../game/common/actions/actionTemplate/actionTemplateBase';
import { ActionTemplateUid } from '../game/common/baseTypes';
import { endMapAction, startMapChoice } from '../gameMap/main';
import { actionLogger } from '../tools/logger';
import {
  getAllActions,
  getAvailableChoices,
  hasMapChoices,
  isChoiceTemplate,
  isMoveActorActionTemplate,
  isCustomDurationActionTemplate,
  planAction,
  isOngoingActionShownAsFeedback,
} from '../UIfacade/actionFacade';
import { getSimTime } from '../UIfacade/timeFacade';
import { setInterfaceState } from './interfaceState';

export enum GameState {
  NOT_INITIATED = 'NOT_INITIATED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
}

/**
 * Get the current gameStateStatus
 */
export function getGameStateStatus(): GameState {
  return Variable.find(gameModel, 'gameState').getValue(self) as GameState;
}

/**
 * Is the game currently paused ?
 */
export function isGameRunning(): boolean {
  return getGameStateStatus() !== GameState.PAUSED;
}

/**
 * Can current actor plan a new action
 *
 * @returns boolean whether an action can be planned by current actor
 */
export function canPlanAction(): boolean {
  const actorUid = Context.interfaceState.state.currentActorUid;
  return canActorPlanAction(actorUid);
}

export function canActorPlanAction(actorId: number): boolean {
  const currentTime = getSimTime();
  const actions = getAllActions();

  if (actions[actorId] === undefined) return true;

  for (const action of actions[actorId]!) {
    // Is a future action planned ?
    if (action.startTime === currentTime) return false;
    // Is a previous action finished ?
    if (action.startTime + action.duration() > currentTime) return false;
  }

  return true;
}

/**
 * Is the given actionUid the currently planned action by the current actor ?
 *
 * @params number uid of the action
 * @returns boolean whether action uid is currently planned one
 */
export function isPlannedAction(actTemplateId: ActionTemplateUid | undefined): boolean {
  if (!actTemplateId) return false;
  const actorUid = Context.interfaceState.state.currentActorUid;
  const actions = getAllActions()[actorUid];

  if (actorUid && actions) {
    const action = actions.find(a => a.startTime === getSimTime());
    if (action) {
      return actTemplateId == action.getTemplateId();
    }
  }

  return false;
}

/**
 * Handle when an action is planned
 *
 * @params template of action
 * @params any payload the action creation
 */
export function actionClickHandler(template: ActionTemplateBase, params: any): void {
  const actorId = Context.interfaceState.state.currentActorUid;

  if (canPlanAction()) {
    planAction(template, actorId, params);
  }
}

/**
 * Update state whenever user changes action
 */
export function actionChangeHandler(): void {
  // TODO Could we set Context.action.Uid as param ?
  const actTemplate = Context.action as ActionTemplateBase;

  if (!canPlanAction()) return;

  Context.interfaceState.setState({
    ...Context.interfaceState.state,
    currentActionUid: actTemplate.uid,
  });

  endMapAction();

  if (isChoiceTemplate(actTemplate) && canPlanAction()) {
    const choiceUid = getAvailableChoices(actTemplate)[0]?.uid;

    if (choiceUid) {
      setInterfaceState({
        currentActionUid: actTemplate.uid,
        selectedActionChoiceUid: choiceUid,
      });
      if (hasMapChoices(actTemplate)) {
        startMapChoice();
      }
    } else {
      actionLogger.error(`The choice template ${actTemplate.uid} as no available choice`);
    }
  }
}

function getDayZero(): Date {
  return new Date(2000, 0, 1);
}
/**
 * Return Date object representing the start time of the simulation
 * @return Date timeStamp for simulation start time
 */
export function getSimStartDateTime(): Date {
  const hours = Variable.find(gameModel, 'startHours').getValue(self);
  const minutes = Variable.find(gameModel, 'startMinutes').getValue(self);
  const delay = Variable.find(gameModel, 'patients-elapsed-minutes').getValue(self);

  const startDateTime = getDayZero();
  startDateTime.setHours(hours, minutes + delay);
  return startDateTime;
}

/**
 * Builds a DateTime object with the given hour an minutes
 * Valid is defined as being in the future with regard to the start time of the simulation
 * Assumption : the simulation will not go beyond 24 hours
 */
export function buildValidSimDateTime(hours: number, minutes: number): Date {
  if (hours < 0 || minutes < 0 || hours > 23 || minutes > 59) {
    throw new Error(`Unexpected time value ${hours}:${minutes} is not a valid hour`);
  }
  const simStart = getSimStartDateTime();
  const result = getDayZero();
  result.setHours(hours, minutes);
  if (simStart > result) {
    // if before sim start, add a day
    // add one day (yes it works)
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Return given dateTime in HH:MM format
 *
 * @params dateTime Date
 * @returns string dateTime in HH:MM format
 */
export function formatTime(dateTime: Date): string {
  const splitted = dateTime.toLocaleString().split(' ')[1]!.split(':').splice(0, 2);
  return splitted.join(':');
}

/**
 * Return action params panel associated with currently selected template
 *
 * @params ActionTemplateBase
 * @returns string Page number to be displayed in page loader
 */
export function showActionParamsPanel(actionTemplate: ActionTemplateBase) {
  if (isMoveActorActionTemplate(actionTemplate)) {
    return '66';
  } else if (isCustomDurationActionTemplate(actionTemplate)) {
    return 'customDurationActionParam';
  } else if (isChoiceTemplate(actionTemplate)) {
    return '31';
  }
  return '';
}

/**
 * Returns true if the action is planned for the current actor or selected
 */
export function isActiveAction(templateUid: ActionTemplateUid): boolean {
  if (canPlanAction()) {
    return Context.interfaceState.state.currentActionUid == templateUid;
  }
  // once the ongoing action has its own feedback card below, collapse this row instead of
  // keeping both open at the same time
  if (isOngoingActionShownAsFeedback(templateUid)) {
    return false;
  }
  return isPlannedAction(templateUid);
}
