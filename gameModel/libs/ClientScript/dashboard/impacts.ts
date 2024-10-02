import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';
import { TimeSliceDuration, TRAINER_NAME } from '../game/common/constants';
import {
  DashboardNotificationMessageEvent,
  DashboardRadioMessageEvent,
  TimeForwardEvent,
} from '../game/common/events/eventTypes';
import { sendEvent } from '../game/common/events/eventUtils';
import { dashboardLogger } from '../tools/logger';
import { sendEventAllTeams } from './utils';

/***************
 * TIME FORWARD
 ***************/
function buildTimeForwardEvent(minutes: number): TimeForwardEvent {
  const min = Math.round(minutes);
  const tf: TimeForwardEvent = {
    type: 'TimeForwardEvent',
    emitterCharacterId: TRAINER_NAME,
    emitterPlayerId: String(self.getId()),
    triggerTime: 0, // will be ignored
    timeJump: min * TimeSliceDuration,
    involvedActors: [], // will be automatically filled when processed by player
    dashboardForced: true,
  };
  return tf;
}

export async function triggerDashboardTimeForward(
  minutes: number,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const tf: TimeForwardEvent = buildTimeForwardEvent(minutes);
  dashboardLogger.debug('Sending time forward event to team', tf, teamId);
  return await sendEvent(tf, teamId);
}

/**
 * Time forward of a given amount of time for all teams
 */
export async function triggerDashboardTimeForwardGame(
  minutes: number
): Promise<IManagedResponse | undefined> {
  return sendEventAllTeams(buildTimeForwardEvent(minutes));
}

/*****************
 * RADIO MESSAGES
 *****************/
function buildRadioMessageEvent(message: string, canal: ActionType): DashboardRadioMessageEvent {
  return {
    type: 'DashboardRadioMessageEvent',
    emitterCharacterId: TRAINER_NAME,
    emitterPlayerId: String(self.getId()), // TODO ok ?
    triggerTime: 0, // will be ignored
    canal: canal,
    message: message,
    dashboardForced: true,
  };
}

/**
 * Send radio message to a single team
 */
export async function sendRadioMessage(
  message: string,
  canal: ActionType,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const radioMsgEvent = buildRadioMessageEvent(message, canal);
  dashboardLogger.debug('Sending radio message event to team', teamId, radioMsgEvent);
  return sendEvent(radioMsgEvent, teamId);
}

/**
 * Send radio message to all teams
 */
export async function sendRadioMessageGame(
  message: string,
  canal: ActionType
): Promise<IManagedResponse | undefined> {
  const rme = buildRadioMessageEvent(message, canal);
  return sendEventAllTeams(rme);
}

/****************
 * NOTIFICATIONS
 ****************/
function buildNotificationMessageEvent(
  message: string,
  roles: Partial<Record<InterventionRole, boolean>>
): DashboardNotificationMessageEvent {
  const rolesArray = Object.entries(roles)
    .filter(([_, value]) => value === true)
    .map(([k, _]) => k as InterventionRole);
  return {
    type: 'DashboardNotificationMessageEvent',
    emitterCharacterId: TRAINER_NAME,
    emitterPlayerId: String(self.getId()), // TODO ok ?
    triggerTime: 0, // will be ignored
    roles: rolesArray,
    message: message,
    dashboardForced: true,
  };
}

export async function sendNotification(
  message: string,
  roles: Partial<Record<InterventionRole, boolean>>,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const notifEvent = buildNotificationMessageEvent(message, roles);
  dashboardLogger.debug('Sending notification message event to team', teamId, notifEvent);
  return sendEvent(notifEvent, teamId);
}

export async function sendNotificationGame(
  message: string,
  roles: Partial<Record<InterventionRole, boolean>>
): Promise<IManagedResponse | undefined> {
  const notifEvent = buildNotificationMessageEvent(message, roles);
  return sendEventAllTeams(notifEvent);
}

// TODO implement
// seems reasonable to use a Wegas variable here
/*
export async function togglePause(pause: boolean, teamId: number): Promise<IManagedResponse | undefined> {
  //
}
*/

/*
export async function togglePauseGame(pause: boolean, teamId: number): Promise<IManagedResponse | undefined> {
  //
}
*/
