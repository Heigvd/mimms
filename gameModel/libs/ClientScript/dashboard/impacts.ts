import { TimeSliceDuration } from '../game/common/constants';
import { TimeForwardEvent } from '../game/common/events/eventTypes';
import { sendEvent } from '../game/common/events/eventUtils';
import { MainSimulationState } from '../game/common/simulationState/mainSimulationState';

export async function updateLastState(
  computedState: Readonly<MainSimulationState>
): Promise<IManagedResponse | undefined> {
  const id = Variable.find(gameModel, 'currentStateCount').getInstance(self).getValue();
  if (id > computedState.stateCount) {
    let script = `Variable.find(gameModel, 'currentState').getInstance(self).setProperty('state', 
    ${JSON.stringify(JSON.stringify(computedState))});`;
    script += `Variable.find(gameModel, 'currentStateCount').getInstance(self).setValue(${computedState.stateCount});`;
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
    const player = team.getPlayers()[0];

    wlog('PLAYER', player);
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
