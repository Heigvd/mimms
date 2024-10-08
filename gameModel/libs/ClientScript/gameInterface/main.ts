import {
  ActionTemplateBase,
  MoveActorActionTemplate,
  SelectionFixedMapEntityTemplate,
} from '../game/common/actions/actionTemplateBase';
import { ActionType } from '../game/common/actionType';
import { getOngoingActionsForActor } from '../game/common/simulationState/actionStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { endMapAction, startMapSelect } from '../gameMap/main';
import {
  cancelAction,
  getActionTemplate,
  getAllActions,
  isFixedMapEntityTemplate,
  planAction,
} from '../UIfacade/actionFacade';
import { getSimTime } from '../UIfacade/timeFacade';

type gameStateStatus = 'NOT_INITIATED' | 'RUNNING' | 'PAUSED';

/**
 * Get the current gameStateStatus
 */
export function getGameStateStatus(): gameStateStatus {
  return Variable.find(gameModel, 'gameState').getValue(self) as gameStateStatus;
}

/**
 * Can current actor plan a new action
 *
 * @returns boolean whether an action can be planned by current actor
 */
export function canPlanAction(): boolean {
  const currentTime = getSimTime();
  const actorUid = Context.interfaceState.state.currentActorUid;
  const actions = getAllActions();

  if (actions[actorUid] === undefined) return true;

  for (const action of actions[actorUid]!) {
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
export function canCancelOnGoingAction() {
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
export function isPlannedAction(id: number) {
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
 * @params number uid of the action
 * @params ActionType actionType of the action
 * @params any payload the action creation
 */
export function actionClickHandler(id: number, actionType: ActionType, params: any): void {
  const template = getActionTemplate(id, actionType)!;
  const uid = Context.interfaceState.state.currentActorUid;

  if (canPlanAction()) {
    planAction(template.getTemplateRef(), uid, params);
  } else if (isPlannedAction(id)) {
    cancelAction(uid, id);
  }
}

/**
 * Update state whenever user changes action
 */
export function actionChangeHandler() {
  Context.interfaceState.setState({
    ...Context.interfaceState.state,
    currentActionUid: Context.action.Uid,
  });
  endMapAction();
  // If action is SelectMapObject we begin routine
  if (isFixedMapEntityTemplate(Context.action.Uid) && canPlanAction()) {
    startMapSelect();
  }
}

/**
 * Return Date object with start time
 *
 * @return Date timeStamp for simulation start time
 */
export function getStartTime(): Date {
  // const hours = Variable.find(gameModel, 'startHours').getValue(self);
  // const minutes = Variable.find(gameModel, 'startMinutes').getValue(self);
  // Hardcoded in demo
  const hours = 16;
  const minutes = 0;

  const dateTime = new Date();
  dateTime.setHours(hours);
  dateTime.setMinutes(minutes);

  return dateTime;
}

/**
 * Get notification time in HH:MM format
 *
 * @params notificationTime number
 * @returns string Notification time adjusted to sim time
 */
export function getNotificationTime(notificationTime: number): string {
  const startTime = getStartTime();
  startTime.setSeconds(notificationTime + startTime.getSeconds());

  return formatTime(startTime);
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
  if (Context.action instanceof SelectionFixedMapEntityTemplate) {
    return '48';
  } else if (Context.action instanceof MoveActorActionTemplate) {
    return '66';
  }
  return '';
}

/**
 * Return modal associated with current state
 *
 * @returns string Page number to be displayed in page loader
 */
export function getModalPageNumber(): string {
  if (Context.interfaceState.state.showCasuMessageModal) {
    return '42';
  }
  if (Context.interfaceState.state.showPatientModal) {
    return '57';
  }
  return '';
}
