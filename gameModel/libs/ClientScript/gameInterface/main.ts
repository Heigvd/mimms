import {
  ActionTemplateBase,
  ChoiceTemplate,
  MoveActorActionTemplate,
  SituationUpdateActionTemplate,
} from '../game/common/actions/actionTemplateBase';
import { ActionTemplateId } from '../game/common/baseTypes';
import { getOngoingActionsForActor } from '../game/common/simulationState/actionStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';
import { endMapAction, startMapChoice } from '../gameMap/main';
import {
  cancelAction,
  getAllActions,
  isChoiceTemplate,
  planAction,
} from '../UIfacade/actionFacade';
import { getSimTime } from '../UIfacade/timeFacade';

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
 * Check if player is owner of the action and can thus cancel it
 */
export function canCancelOnGoingAction(): boolean {
  const currentTime = getSimTime();
  const actorUid = Context.interfaceState.state.currentActorUid;
  const actions = getOngoingActionsForActor(getCurrentState(), actorUid);

  for (const action of actions!) {
    // Is a future action planned ?
    if (action.startTime === currentTime) return true;
    // Is a previous action finished ?
    if (action.startTime + action.duration() > currentTime) return true;
  }

  return false;
}

/**
 * Is the given actionUid the currently planned action by the current actor ?
 *
 * @params number uid of the action
 * @returns boolean whether action uid is currently planned one
 */
export function isPlannedAction(id: ActionTemplateId | undefined): boolean {
  if (!id) return false;
  const actorUid = Context.interfaceState.state.currentActorUid;
  const actions = getAllActions()[actorUid];

  if (actorUid && actions) {
    const action = actions.find(a => a.startTime === getSimTime());
    if (action) {
      return id == action.getTemplateId();
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
  const uid = Context.interfaceState.state.currentActorUid;

  if (canPlanAction()) {
    planAction(template, uid, params);
  } else if (isPlannedAction(template.Uid)) {
    cancelAction(uid, template.Uid);
  }
}

/**
 * Update state whenever user changes action
 */
export function actionChangeHandler(): void {
  if (!canPlanAction()) return;
  Context.interfaceState.setState({
    ...Context.interfaceState.state,
    currentActionUid: Context.action.Uid,
  });
  endMapAction();

  const action = Context.action as ActionTemplateBase;

  if (isChoiceTemplate(action) && canPlanAction()) {
    const choiceUid = (action as ChoiceTemplate).choices[0]!.uid;

    setInterfaceState({ currentActionUid: Context.action.Uid, selectedActionChoiceUid: choiceUid });
    startMapChoice();
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
  if (actionTemplate instanceof MoveActorActionTemplate) {
    return '66';
  } else if (actionTemplate instanceof SituationUpdateActionTemplate) {
    return 'actionSituationUpdateParam';
  } else if (actionTemplate instanceof ChoiceTemplate) {
    return '31';
  }
  return '';
}

/**
 * Returns true if the action is planned for the current actor or selected
 */
export function isActiveAction(templateUid: number): boolean {
  if (canPlanAction()) {
    return Context.interfaceState.state.currentActionUid == templateUid;
  }
  return isPlannedAction(templateUid);
}
