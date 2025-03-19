import { gameExecLogger } from '../tools/logger';
import { GameExecutionContext, TeamId } from './gameExecutionContext';

let lockedTeamId: TeamId | undefined;

let executionContexts: Record<TeamId, GameExecutionContext> = {};

/**
 * Forces the game execution context to a given team id
 * This should only be used dashboard side when updating the state of a team
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
 * Forces the game execution context to a given team id
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
  executionContexts[teamId] = new GameExecutionContext(teamId, eventBoxId);
}

export function createPlayerContext(): void {
  const teamId = self.getParentId()!;
  const eventBoxId = Variable.find(gameModel, 'newEvents').getInstance(self).getId()!;
  createNewContext(teamId, eventBoxId);
}

export function getCurrentTeamId(): TeamId {
  // when loading/updating the dashboard states
  if (lockedTeamId) {
    return lockedTeamId;
  }
  // reading values from the dashboard
  if (Context.team?.id) {
    return Context.team.id;
  }
  // current player's team id
  return self.getParentId()!;
}

export function getCurrentExecutionContext(): GameExecutionContext {
  const teamId = getCurrentTeamId();
  let ctx = executionContexts[teamId];
  if (ctx) {
    return ctx;
  }
  throw new Error('No context has been initalized for team id ' + teamId);
}

/*
export function getCurrentPlayerExecutionContext(): GameExecutionContext {
  const teamId = self.getParentId()!;
  let ctx = executionContexts[teamId];
  if (!ctx) {
    const eventBoxId = Variable.find(gameModel, 'newEvents').getInstance(self).getId();
    ctx = new GameExecutionContext(teamId, eventBoxId);
    executionContexts[teamId] = ctx;
  }
  return ctx;
}
*/
