import { gameExecLogger } from '../../tools/logger';
import { TimedEventPayload } from '../common/events/eventTypes';
import { FullEvent } from '../common/events/eventUtils';
import { getStartingMainState } from '../loaders/mainStateLoader';
import {
  GameExecutionContext,
  GlobalToLocalEventFunction,
  TeamId,
  UidGenerator,
} from './gameExecutionContext';

let lockedTeamId: TeamId | undefined;

let executionContexts: Record<TeamId, GameExecutionContext> = {};

Helpers.registerEffect(() => {
  // required to reset when the scenario is restarted
  executionContexts = {};
  gameExecLogger.info('***** Execution contexts reset *****');
});

/**
 * Locks the game execution context to a given team id
 * This should only be used on dashboard side when updating the state of a team
 * @param teamId
 */
function lockTeamId(teamId: TeamId): void {
  if (lockedTeamId) {
    gameExecLogger.warn('The context is already locked by ', lockedTeamId);
  }
  gameExecLogger.info('**** Locking ctx to teamId', teamId);
  lockedTeamId = teamId;
}

/**
 * unlocks the game execution context to a given team id
 * This should only be used dashboard side when updating the state of a team
 * @param teamId
 */
function unlockTeamId(): void {
  gameExecLogger.info('---- Unlocking ctx, was locked by', lockedTeamId);
  lockedTeamId = undefined;
}

function createNewContext(teamId: TeamId, eventBoxId: number): GameExecutionContext {
  if (executionContexts[teamId]) {
    throw new Error('Context with id ' + teamId + ' is already created');
  }
  const state = getStartingMainState();
  // get a clone of the starting generation state, in order to generate further ids consistently
  const uidProvider = mainStateDefaultUidGenerator.clone();
  const ctx = new GameExecutionContext(teamId, eventBoxId, state, uidProvider);
  executionContexts[teamId] = ctx;
  return ctx;
}

export function createOrUpdateExecutionContext(
  teamId: TeamId,
  eventBoxId: number,
  events: FullEvent<TimedEventPayload>[],
  convertFunc: GlobalToLocalEventFunction
): boolean {
  const ctx: GameExecutionContext =
    executionContexts[teamId] || createNewContext(teamId, eventBoxId);
  return updateExecutionContext(ctx, events, convertFunc);
}

export function updateExecutionContextFromEventBoxId(
  eventBoxId: number,
  events: FullEvent<TimedEventPayload>[],
  convertFunc: GlobalToLocalEventFunction
): boolean {
  const ctx = Object.values(executionContexts).find(ctx => ctx.eventBoxId === eventBoxId);
  if (!ctx) {
    gameExecLogger.warn(
      'Execution context with box id not found',
      eventBoxId,
      Object.values(executionContexts).map(ctx => ctx.eventBoxId)
    );
    return false;
  }
  return updateExecutionContext(ctx, events, convertFunc);
}

function updateExecutionContext(
  context: GameExecutionContext,
  events: FullEvent<TimedEventPayload>[],
  convertFunc: GlobalToLocalEventFunction
): boolean {
  try {
    lockTeamId(context.teamId); // any calls to getCurrentContext will point to the teamId's context
    return context.processEvents(events, convertFunc);
  } catch (error) {
    gameExecLogger.error('Error while updating context', context.teamId, error, events);
    return false;
  } finally {
    unlockTeamId();
  }
}

export function createPlayerContext(): void {
  const teamId = getPlayerTeamId();
  if (executionContexts[teamId]) {
    gameExecLogger.warn(
      'player context exists already. This is normal if the dashboard page and main simulation page is opened',
      teamId
    );
  } else {
    const eventBoxId = Variable.find(gameModel, 'newEvents').getInstance(self).getId()!;
    createNewContext(teamId, eventBoxId);
  }
}

function getPlayerTeamId(): number {
  return self.getParentId()!;
}

function getCurrentTeamId(): TeamId {
  // when loading/updating the dashboard states
  if (lockedTeamId) {
    return lockedTeamId;
  }

  // current player's team id
  return getPlayerTeamId();
}

export function getTargetExecutionContext(teamId: TeamId): GameExecutionContext | undefined {
  return executionContexts[teamId];
}

export function getCurrentExecutionContext(): GameExecutionContext {
  const teamId = getCurrentTeamId();
  const ctx = executionContexts[teamId];
  if (ctx) {
    return ctx;
  }
  const caller = new Error().stack;
  throw new Error('No context has been initalized for team id ' + teamId + ' caller ' + caller);
}

// ========== UID GENERATOR ==========
let mainStateInitializationComplete = false;
/**
 * The default generator is used during the starting state initialization
 * while building the initial state that is common to all teams
 */
let mainStateDefaultUidGenerator: UidGenerator;

Helpers.registerEffect(() => {
  if (!mainStateDefaultUidGenerator) {
    mainStateDefaultUidGenerator = new UidGenerator({});
  }
});

export function getContextUidGenerator(): UidGenerator {
  if (mainStateInitializationComplete) {
    return getCurrentExecutionContext().getUidProvider();
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
