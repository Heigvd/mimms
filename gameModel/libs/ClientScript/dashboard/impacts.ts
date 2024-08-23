import { ActionType } from '../game/common/actionType';
import { TimeSliceDuration, TRAINER_NAME } from '../game/common/constants';
import { DashboardRadioMessageEvent, TimeForwardEvent } from '../game/common/events/eventTypes';
import { sendEvent } from '../game/common/events/eventUtils';
import { dashboardLogger } from '../tools/logger';

export async function triggerDashboardTimeForward(
  minutes: number,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const min = Math.round(minutes);
  const team = teams.find(t => t.getId() === teamId);
  if (team) {
    const tf: TimeForwardEvent = {
      type: 'TimeForwardEvent',
      emitterCharacterId: TRAINER_NAME,
      emitterPlayerId: String(self.getId()),
      triggerTime: 0, // will be ignored
      timeJump: min * TimeSliceDuration,
      involvedActors: [], // will be automatically filled when processed by player
      dashboardForced: true,
    };
    dashboardLogger.debug('Sending time forward event to team', tf, teamId);
    return await sendEvent(tf, teamId);
  }
}

export async function sendRadioMessage(
  message: string,
  canal: ActionType,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const team = teams.find(t => t.getId() === teamId);
  if (team) {
    const radioMsgEvent: DashboardRadioMessageEvent = {
      type: 'DashboardRadioMessageEvent',
      emitterCharacterId: TRAINER_NAME,
      emitterPlayerId: String(self.getId()), // TODO ok ?
      triggerTime: 0, // will be ignored
      canal: canal,
      message: message,
      dashboardForced: true,
    };
    dashboardLogger.debug('Sending radio message event to team', teamId, radioMsgEvent);
    return await sendEvent(radioMsgEvent, teamId);
  }
}

// TODO same for notifications
