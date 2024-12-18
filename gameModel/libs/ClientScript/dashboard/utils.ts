import { EventPayload } from '../game/common/events/eventTypes';
import { getSendEventServerScript } from '../game/common/events/eventUtils';

// TODO for now we just pick the first player of the team
// but we might want a per player choice

// Returns SCENARIO or PLAY
export function getGameModelType(): string {
  return (CurrentGame as any).gameModel.type;
}

export function buildSpyUrl(playerId: number): string {
  return 'player.html?id=' + playerId;
}

export function getDashboardTeams(): STeam[] {
  return teams.filter(
    t =>
      t.getId() !== undefined &&
      (t.getName() !== 'Test team' || APP_CONTEXT === 'Editor' || getGameModelType() === 'SCENARIO')
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

export function getTestTeamId(): number | undefined {
  return teams.find(t => t.getName() === 'Test team')?.getId();
}

export function getPlayer(teamId: number, playerId: number): SPlayer | undefined {
  const team = getTeam(teamId);
  return team ? team.getPlayers().find(p => p.getId() === playerId) : undefined;
}

/**
 * Send events for multiple teams
 * Each payload matches one team
 */
export async function sendEventPerTeam(
  payloads: EventPayload[],
  teamIds: number[]
): Promise<IManagedResponse | undefined> {
  if (payloads.length !== 0) {
    if (payloads.length !== teamIds.length) {
      throw new RangeError('The payloads count has to match the count of the team ids');
    }
    const script = payloads
      .map((payload, i) => getSendEventServerScript(payload, 0, teamIds[i]))
      .join('');
    return await APIMethods.runScript(script, {});
  }
  return undefined;
}

/**
 * Send a single event for all teams
 */
export function sendEventAllTeams(payload: EventPayload): Promise<IManagedResponse> {
  const script = getDashboardTeams()
    .map(team => getSendEventServerScript(payload, 0, team.getId()))
    .join('');
  return APIMethods.runScript(script, {});
}
