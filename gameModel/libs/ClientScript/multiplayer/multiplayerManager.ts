import { InterventionRole } from '../game/common/actors/actor';
import { mainSimLogger } from '../tools/logger';

interface MultiplayerMatrix extends Array<PlayerMatrix> {}

interface PlayerMatrix {
  id: number;
  roles: PlayerRoles;
}

type PlayerRoles = Partial<Record<InterventionRole, boolean>>;

export async function clearMultiplayerMatrix() {
  await APIMethods.runScript(`Variable.find(gameModel, 'multiplayerMatrix').clearProperties()`, {});
}

// Register current player (self) in matrix
export async function registerSelf(): Promise<void> {
  const statements: string[] = [];
  const currentPlayerId = self.getId();
  const playableRoles: PlayerRoles = {
    AL: true,
    ACS: true,
    MCS: true,
    EVASAN: true,
    LEADPMA: true,
  };

  if (currentPlayerId) {
    statements.push(
      `Variable.find(gameModel, 'multiplayerMatrix').setProperty(${currentPlayerId.toString()}, ${JSON.stringify(
        JSON.stringify(playableRoles)
      )})`
    );
  }

  const script = statements.join(';');
  await APIMethods.runScript(script, {});
}

/**
 * Unregister current (self) player from matrix
 */
export async function unregisterSelf(): Promise<void> {
  const currentPlayerId = self.getId();
  const currentPlayers = Variable.find(gameModel, 'multiplayerMatrix').getProperties();

  if (currentPlayerId && currentPlayers[String(currentPlayerId)]) {
    const script = `Variable.find(gameModel, 'multiplayerMatrix').removeProperty(${String(
      currentPlayerId
    )})`;
    APIMethods.runScript(script, {});
  }
}

/**
 * Update role of given player
 */
export async function updateRole(playerId: number, role: InterventionRole): Promise<void> {
  const currentPlayerId = self.getId();

  // Will be unlocked for trainer
  if (playerId !== currentPlayerId) return;

  const playerRoles = getPlayersAndRoles().find(p => p.id === currentPlayerId)!.roles;
  playerRoles[role] = !playerRoles[role];

  const script = `Variable.find(gameModel, 'multiplayerMatrix').setProperty(${currentPlayerId.toString()}, ${JSON.stringify(
    JSON.stringify(playerRoles)
  )})`;
  await APIMethods.runScript(script, {});
}

/**
 * Get and convert multiplayerMatrix to workable format
 */
export function getPlayersAndRoles(): MultiplayerMatrix {
  return Object.entries(Variable.find(gameModel, 'multiplayerMatrix').getProperties()).map(
    ([id, roles]) => ({
      id: parseInt(id),
      roles: JSON.parse(roles),
    })
  );
}

/**
 * Get the available roles for the current player
 */
export function getRolesSelf(): PlayerMatrix | void {
  const currentPlayerId = self.getId();
  const playerRoles = getPlayersAndRoles().find(m => m.id === currentPlayerId);
  if (playerRoles === undefined) {
    // Throw some error unregistered
    mainSimLogger.error(`Player with id: ${currentPlayerId} has not registered roles`);
  }
  return playerRoles;
}

/**
 * Check if all playable roles are currently filled by a player
 */
export function checkAllRolesPlayed(): boolean {
  const playersRoles = getPlayersAndRoles().map(p => Object.values(p.roles));
  const playableRoles = new Array(5).fill(false);

  for (const player of playersRoles) {
    for (const [i, role] of Object.entries(player)) {
      if (role) playableRoles[Number(i)] = role;
    }
  }
  if (playableRoles.every(r => r === true)) return true;
  return false;
}
