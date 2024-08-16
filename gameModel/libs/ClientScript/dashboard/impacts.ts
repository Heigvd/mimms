import { TimeSliceDuration } from '../game/common/constants';
import { DashboardRadioMessageEvent, TimeForwardEvent } from '../game/common/events/eventTypes';
import { sendEvent } from '../game/common/events/eventUtils';
import { MainSimulationState } from '../game/common/simulationState/mainSimulationState';

let currentStateId = 0;

export async function updateLastState(
  computedState: Readonly<MainSimulationState>
): Promise<IManagedResponse | undefined> {
  const id = Variable.find(gameModel, 'currentStateCount').getInstance(self).getValue();
  const currentId = Math.max(id, currentStateId);
  wlog('state values (var, local, new)', id, currentStateId, computedState.stateCount);
  if (currentId < computedState.stateCount) {
    currentStateId = computedState.stateCount;
    const reducedState = Helpers.cloneDeep(computedState.getInternalStateObject());
    reducedState.patients = [];
    reducedState.radioMessages = [];
    wlog('STATE NEEDS UPDATE');

    let script = `Variable.find(gameModel, 'currentState').getInstance(self).setProperty('state', 
    ${JSON.stringify(JSON.stringify(reducedState))});`;
    script += `Variable.find(gameModel, 'currentStateCount').getInstance(self).setValue(${currentStateId});`;
    wlog('total state length', JSON.stringify(computedState).length);
    wlog(script.length);

    //wlog(script);
    return await APIMethods.runScript(script, {});
  }
}

export async function triggerDashboardTimeForward(
  minutes: number,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const min = Math.round(minutes);
  const team = teams.find(t => t.getId() === teamId);
  if (team) {
    const tf: TimeForwardEvent = {
      type: 'TimeForwardEvent',
      emitterCharacterId: 'Game Master',
      emitterPlayerId: String(self.getId()), // String(player.getId()),
      triggerTime: 0,
      timeJump: min * TimeSliceDuration,
      involvedActors: [],
      forced: true,
      bypassTriggerTime: true,
    };
    return await sendEvent(tf, 0, teamId);
  }
}

export async function sendRadioMessage(
  message: string,
  canal: string,
  teamId: number
): Promise<IManagedResponse | undefined> {
  const team = teams.find(t => t.getId() === teamId);
  if (team) {
    const radioMsgEvent: DashboardRadioMessageEvent = {
      type: 'DashboardRadioMessageEvent',
      emitterCharacterId: 'Game Master',
      emitterPlayerId: String(self.getId()), // String(player.getId()),
      triggerTime: 0,
      bypassTriggerTime: true,
      canal: canal,
      message: message,
    };
    return await sendEvent(radioMsgEvent, 0, teamId);
  }
}

export interface DashboardState {
  teamsForms: Record<number, TeamForms>;
}

export interface TeamForms {
  timeFwdValue: number;
  radioMessage: {
    canal: string;
    message: string;
  };
}
