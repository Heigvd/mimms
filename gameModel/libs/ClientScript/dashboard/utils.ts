// TODO for now we just pick the first player of the team

import { InterventionRole } from '../game/common/actors/actor';

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

export function getTeamsContext(): { id: number; name: string }[] {
  return teams
    .filter(
      t => t.getId() !== undefined && (t.getName() !== 'Test team' || APP_CONTEXT === 'Editor')
    )
    .map(t => ({ id: t.getId()!, name: t.getName() || '' }));
}

export function getTeam(teamId: number): STeam | undefined {
  return teams.find(t => t.getId() === teamId);
}

/**
 * Ordered list of roles to be displayed
 */
export function getRolesArray(): InterventionRole[] {
  return ['AL', 'ACS', 'MCS', 'LEADPMA', 'EVASAN'];
}

export function getRolesContext(): {
  id: InterventionRole;
  role: InterventionRole;
  name: string;
}[] {
  return getRolesArray().map(r => ({ id: r, role: r, name: r + '' }));
}
