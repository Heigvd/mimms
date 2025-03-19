import { gameExecLogger } from '../tools/logger';
import { getStartingMainState } from './common/simulationState/loaders/mainStateLoader';
import { GameExecutionContext, TeamId, UidGenerator } from './gameExecutionContext';

let lockedTeamId: TeamId | undefined;

let executionContexts: Record<TeamId, GameExecutionContext> = {};

/**
 * Locks the game execution context to a given team id
 * This should only be used on dashboard side when updating the state of a team
 * @param teamId
 */
export function lockTeamId(teamId: TeamId): void {
  if (lockedTeamId) {
    gameExecLogger.warn('The context is already locked by ', lockedTeamId);
  }
  gameExecLogger.info('**** Locking ctx to teamId', teamId);
  lockedTeamId = teamId;
}

/**
 * unlocksthe game execution context to a given team id
 * This should only be used dashboard side when updating the state of a team
 * @param teamId
 */
export function unlockTeamId(): void {
  gameExecLogger.info('---- Unlocking ctx, was locked by', lockTeamId);
  lockedTeamId = undefined;
}

export function createNewContext(teamId: TeamId, eventBoxId: number): void {
  if (executionContexts[teamId]) {
    throw new Error('Context with id ' + teamId + ' is already created');
  }
  const state = getStartingMainState();
  const uidProvider = mainStateDefaultUidGenerator.clone();
  executionContexts[teamId] = new GameExecutionContext(teamId, eventBoxId, state, uidProvider);
}

export function createPlayerContext(): void {
  const teamId = getPlayerTeamId();
  if (executionContexts[teamId]) {
    return;
  }
  const eventBoxId = Variable.find(gameModel, 'newEvents').getInstance(self).getId()!;
  createNewContext(teamId, eventBoxId);
}

function getPlayerTeamId(): number {
  return self.getParentId()!;
}

function getCurrentTeamId(): TeamId {
  // when loading/updating the dashboard states
  if (lockedTeamId) {
    return lockedTeamId;
  }
  // reading values from the dashboard
  if (Context.team?.id) {
    return Context.team.id;
  }
  // current player's team id
  return getPlayerTeamId();
}

export function getCurrentExecutionContext(): GameExecutionContext {
  const teamId = getCurrentTeamId();
  let ctx = executionContexts[teamId];
  if (ctx) {
    return ctx;
  }
  //return ctx!;
  throw new Error('No context has been initalized for team id ' + teamId);
}

// ========== UID GENERATOR ==========
let mainStateInitializationComplete = false;
let mainStateDefaultUidGenerator: UidGenerator;

export function getContextUidGenerator(): UidGenerator {
  if (mainStateInitializationComplete) {
    return getCurrentExecutionContext().getUidProvider();
  } else if (!mainStateDefaultUidGenerator) {
    mainStateDefaultUidGenerator = new UidGenerator();
  }
  return mainStateDefaultUidGenerator;
}

export function notifyMainStateInitializationComplete(): void {
  if (mainStateInitializationComplete) {
    throw new Error('Main state initialization completion has been called already');
  }
  mainStateInitializationComplete = true;
}

// ========== DEBUG ===========
export function debugRemovePlayerContext(): void {
  gameExecLogger.warn('DEBUG ONLY, removing player context');
  delete executionContexts[getPlayerTeamId()];
}
