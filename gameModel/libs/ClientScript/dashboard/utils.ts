import { EventPayload } from '../game/common/events/eventTypes';
import { getSendEventServerScript } from '../game/common/events/eventUtils';

// TODO for now we just pick the first player of the team
// but we might want a per player choice

export function buildSpyUrl(teamId: number): string {
  const team = getTeam(teamId);
  if (team) {
    const p1 = team.getPlayers().pop();
    if (p1) {
      return 'player.html?id=' + p1.getId();
    }
  }
  return 'not_found'; // TODO
}

export function getDashboardTeams(): STeam[] {
  return teams.filter(
    t => t.getId() !== undefined && (t.getName() !== 'Test team' || APP_CONTEXT === 'Editor')
  );
}

export function getTeamsContext(): { id: number; name: string }[] {
  return getDashboardTeams().map(t => ({ id: t.getId()!, name: t.getName() || '' }));
}

export function getTeam(teamId: number): STeam | undefined {
  return teams.find(t => t.getId() === teamId);
}

export function getSelectedTeamName(): string {
  return getTeam(Context.dashboardState.state.selectedTeam)?.getName() || 'Team not found.';
}

/**
 * Send events for multiple teams
 * Each payload matches one team
 */
export function sendEventPerTeam(
  payloads: EventPayload[],
  teamIds: number[]
): Promise<IManagedResponse> {
  if (payloads.length !== teamIds.length) {
    throw new RangeError('The payloads count has to match the count of the team ids');
  }
  const script = payloads
    .map((payload, i) => getSendEventServerScript(payload, teamIds[i]))
    .join('');
  return APIMethods.runScript(script, {});
}

/**
 * Send a single event for all teams
 */
export function sendEventAllTeams(payload: EventPayload): Promise<IManagedResponse> {
  const script = getDashboardTeams()
    .map(team => getSendEventServerScript(payload, team.getId()))
    .join('');
  return APIMethods.runScript(script, {});
}
