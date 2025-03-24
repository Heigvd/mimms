import { InterventionRole } from '../game/common/actors/actor';
import { TimeSliceDuration, TRAINER_NAME } from '../game/common/constants';
import {
  DashboardNotificationMessageEvent,
  DashboardRadioMessageEvent,
  GameOptionsEvent,
  TimeForwardEvent,
} from '../game/common/events/eventTypes';
import { sendEvent } from '../game/common/events/eventUtils';
import { GameOptions, getCurrentGameOptions } from '../game/common/gameOptions';
import { RadioType } from '../game/common/radio/communicationType';
import { dashboardLogger } from '../tools/logger';
import { getRawTime } from './dashboardFacade';
import {
  DashboardGameState,
  fetchAllTeamsState,
  updateStateAfterImpact,
  UpdateStateFunc,
} from './dashboardState';
import { sendEventAllTeams, sendEventPerTeam } from './utils';

/***************
 * TIME FORWARD
 ***************/
function buildTimeForwardEvent(seconds: number): TimeForwardEvent {
  const sec = Math.round(seconds);
  if (sec % TimeSliceDuration !== 0) {
    dashboardLogger.error(
      'Unexpected value for time forward, should be a multiple of ' + TimeSliceDuration,
      sec
    );
    throw new Error(
      `Invalid value for TimeForwardEvent : ${sec}, has to be a multiple of ${TimeSliceDuration}`
    );
  }
  const tf: TimeForwardEvent = {
    type: 'TimeForwardEvent',
    emitterCharacterId: TRAINER_NAME,
    emitterPlayerId: String(self.getId()),
    triggerTime: 0, // will be ignored
    timeJump: sec,
    involvedActors: [], // will be automatically filled when processed by player
    dashboardForced: true,
  };
  return tf;
}

export async function triggerDashboardTimeForward(
  seconds: number,
  teamId: number,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const tf: TimeForwardEvent = buildTimeForwardEvent(seconds);
  dashboardLogger.debug('Sending time forward event to team', tf, teamId);
  const response = await sendEvent(tf, 0, teamId);
  updateStateAfterImpact(response, updateFunc);
}

/**
 * Time forward of a given amount of time for all teams
 */
export async function triggerDashboardTimeForwardGame(
  seconds: number,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const response = await sendEventAllTeams(buildTimeForwardEvent(seconds));
  updateStateAfterImpact(response, updateFunc);
}

/**
 * Time forward a given team to a given time
 * @param targetTime
 */
export async function triggerAbsoluteTimeForward(
  targetTime: Date,
  teamId: number,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const dstate = await fetchAllTeamsState(false);
  const delta = computeForwardDeltaSeconds(dstate, targetTime, teamId);

  if (delta > 0) {
    await triggerDashboardTimeForward(delta, teamId, updateFunc);
  }
}

function computeForwardDeltaSeconds(
  state: DashboardGameState,
  targetTime: Date,
  teamId: number
): number {
  const teamTime = getRawTime(state, teamId);
  const delta = Math.ceil(targetTime.getTime() - teamTime.getTime());
  if (delta < 0) {
    dashboardLogger.error(
      'Invalid time forward for team ' + teamId + ' current time : ' + teamTime
    );
  }
  return delta / 1000;
}

export async function triggerAbsoluteTimeForwardGame(
  targetTime: Date,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const dstate = await fetchAllTeamsState(false);
  const events: TimeForwardEvent[] = [];
  const teams: number[] = [];
  Object.keys(dstate).map((tid: string) => {
    const teamId = Number(tid);
    const delta = computeForwardDeltaSeconds(dstate, targetTime, teamId);
    if (delta > 0) {
      events.push(buildTimeForwardEvent(delta));
      teams.push(teamId);
    } else if (delta < 0) {
      // some team is already in the future
      // TODO see if we want to cancel the whole operation or just ignore this team
    }
  });

  const response = await sendEventPerTeam(events, teams);
  if (response) {
    updateStateAfterImpact(response, updateFunc);
  }
}

/*****************
 * RADIO MESSAGES
 *****************/
function buildRadioMessageEvent(message: string, canal: RadioType): DashboardRadioMessageEvent {
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
  canal: RadioType,
  teamId: number,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const radioMsgEvent = buildRadioMessageEvent(message, canal);
  dashboardLogger.debug('Sending radio message event to team', teamId, radioMsgEvent);
  const response = await sendEvent(radioMsgEvent, 0, teamId);
  updateStateAfterImpact(response, updateFunc);
}

/**
 * Send radio message to all teams
 */
export async function sendRadioMessageGame(
  message: string,
  canal: RadioType,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const rme = buildRadioMessageEvent(message, canal);
  const response = await sendEventAllTeams(rme);
  updateStateAfterImpact(response, updateFunc);
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
  teamId: number,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const notifEvent = buildNotificationMessageEvent(message, roles);
  dashboardLogger.debug('Sending notification message event to team', teamId, notifEvent);
  const response = await sendEvent(notifEvent, 0, teamId);
  updateStateAfterImpact(response, updateFunc);
}

export async function sendNotificationGame(
  message: string,
  roles: Partial<Record<InterventionRole, boolean>>,
  updateFunc: UpdateStateFunc
): Promise<void> {
  const notifEvent = buildNotificationMessageEvent(message, roles);
  const response = await sendEventAllTeams(notifEvent);
  updateStateAfterImpact(response, updateFunc);
}

/***************
 * GAME OPTIONS
 ***************/

function buildGameOptionsEvent(options: GameOptions): GameOptionsEvent {
  // Any validation needed ?
  const event: GameOptionsEvent = {
    type: 'GameOptionsEvent',
    emitterCharacterId: TRAINER_NAME,
    emitterPlayerId: String(self.getId()),
    triggerTime: 0, // will be ignored
    dashboardForced: true,
    options: options,
  };

  return event;
}

export function updateRespectHierarchyOption() {
  const options = getCurrentGameOptions();
  options.respectHierarchy = !options.respectHierarchy;

  const script = `Variable.find(gameModel, "respectHierarchy").setValue(self, ${options.respectHierarchy});`;
  const event: GameOptionsEvent = buildGameOptionsEvent(options);

  APIMethods.runScript(script, {})
    .then(_r => sendEventAllTeams(event))
    .catch(error => {
      dashboardLogger.error(`Could not respect hierarchy options, ${error}`);
    });
}
