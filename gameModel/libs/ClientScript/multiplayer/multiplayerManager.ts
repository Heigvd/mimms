import { InterventionRole } from '../game/common/actors/actor';
import { mainSimLogger } from '../tools/logger';

interface MultiplayerMatrix extends Array<PlayerMatrix> {}

interface PlayerMatrix {
  id: number;
  name: string;
  ready: boolean;
  roles: PlayerRoles;
}

type PlayerRoles = Partial<Record<InterventionRole, boolean>>;

export async function clearMultiplayerMatrix() {
  await APIMethods.runScript(
    `Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).clearProperties()`,
    {}
  );
}

// `Variable.find(gameModel, "readRadioMessagesByChannel").getInstance(self).setProperty('${channel}','${amount}');`,

// Register current player (self) in matrix
export async function registerSelf(): Promise<void> {
  const currentPlayerId = self.getId();
  const currentPlayerName = self.getName();
  const playableRoles: PlayerRoles = {
    AL: true,
    ACS: true,
    MCS: true,
    EVASAN: true,
    LEADPMA: true,
  };

  if (currentPlayerId) {
    const playerMatrix: PlayerMatrix = {
      id: currentPlayerId,
      name: currentPlayerName,
      ready: false,
      roles: playableRoles,
    };

    const script = `Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).setProperty(${currentPlayerId.toString()}, ${JSON.stringify(
      JSON.stringify(playerMatrix)
    )})`;
    try {
      await APIMethods.runScript(script, {});
    } catch (error) {
      mainSimLogger.error(error);
    }
  }
}

/**
 * Unregister current (self) player from matrix
 */
export async function unregisterSelf(): Promise<void> {
  const currentPlayerId = self.getId();
  const currentPlayers = Variable.find(gameModel, 'multiplayerMatrix')
    .getInstance(self)
    .getProperties();

  if (currentPlayerId && currentPlayers[String(currentPlayerId)]) {
    const script = `Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).removeProperty(${String(
      currentPlayerId
    )})`;

    try {
      await APIMethods.runScript(script, {});
    } catch (error) {
      mainSimLogger.error(error);
    }
  }
}

function canUpdateRole(targetPlayerId: number): boolean {
  const currentPlayerId = self.getId();
  // return APP_CONTEXT === 'Player' && (currentPlayerId === undefined || targetPlayerId !== currentPlayerId);
  return (
    APP_CONTEXT !== 'Player' ||
    (currentPlayerId !== undefined && targetPlayerId === currentPlayerId)
  );
}

/**
 * Update role of given player
 */
export async function updateRole(playerId: number, role: InterventionRole): Promise<void> {
  if (!canUpdateRole(playerId)) return;

  const playerMatrix = getPlayersAndRoles().find(p => p.id === playerId)!;
  playerMatrix.roles[role] = !playerMatrix.roles[role];

  const script = `Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).setProperty(${playerId!.toString()}, ${JSON.stringify(
    JSON.stringify(playerMatrix)
  )})`;

  try {
    await APIMethods.runScript(script, {});
  } catch (error) {
    mainSimLogger.error(error);
  }
}

/**
 * Update ready status of given player
 */
export async function updateReady(playerId: number) {
  if (!canUpdateRole(playerId)) return;

  const playerMatrix = getPlayersAndRoles().find(p => p.id === playerId)!;
  playerMatrix.ready = !playerMatrix.ready;

  const script = `Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).setProperty(${playerId.toString()}, ${JSON.stringify(
    JSON.stringify(playerMatrix)
  )})`;

  try {
    await APIMethods.runScript(script, {});
  } catch (error) {
    mainSimLogger.error(error);
  }
}

/**
 * Get and convert multiplayerMatrix to workable format
 */
export function getPlayersAndRoles(): MultiplayerMatrix {
  return Object.entries(
    Variable.find(gameModel, 'multiplayerMatrix').getInstance(self).getProperties()
  ).map(([id, playerMatrix]) => ({
    id: parseInt(id),
    name: JSON.parse(playerMatrix).name,
    ready: JSON.parse(playerMatrix).ready,
    roles: JSON.parse(playerMatrix).roles,
  }));
}

/**
 * Get the available roles for the current player
 */
export function getPlayerRolesSelf(): PlayerRoles {
  const currentPlayerId = self.getId();
  if (currentPlayerId === undefined) {
    mainSimLogger.error(`Your a currently not registered as a player`);
    return {};
  }

  const playerRoles = getPlayersAndRoles().find(m => m.id === currentPlayerId);
  if (playerRoles === undefined) {
    // Throw some error unregistered
    mainSimLogger.error(`Player with id: ${currentPlayerId} has not registered roles`);
    return {};
  }
  return playerRoles!.roles;
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
  return playableRoles.every(r => r);
}

/**
 * Check if all players are marked as ready
 */
export function checkAllPlayersReady(): boolean {
  return getPlayersAndRoles()
    .flatMap(p => p.ready)
    .every(r => r);
}
