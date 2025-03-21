import { TimedEventPayload } from '../game/common/events/eventTypes';
import { parseSingleEvent } from '../game/common/events/eventUtils';
import { getStartingMainState } from '../game/common/simulationState/loaders/mainStateLoader';
import { MainStateObject } from '../game/common/simulationState/mainSimulationState';
import {
  createOrUpdateExecutionContext,
  getTargetExectionContext,
} from '../game/gameExecutionContextController';
import { convertToLocalEvent } from '../game/mainSimulationLogic';
import { dashboardLogger } from '../tools/logger';
import { getDashboardTeams } from './utils';

export type DashboardTeamGameState = MainStateObject & {
  simulationTime: number;
};

export type UpdateStateFunc = (newState: DashboardGameState) => void;

/**************************************
 * Dashboard fetch functions
 **************************************/

interface RawEventBoxContent {
  events: {
    id: number;
    parentId: number;
    payload: string;
  }[];
  eventBoxId: number;
}

/**
 * Fetches all events for each team and updates their state
 */
async function updateAllTeamsState(): Promise<void> {
  dashboardLogger.debug('Building per team state...');

  const response = await APIMethods.runScript('CustomDashboard.getEventsByTeam();', {});
  const events = response.updatedEntities as any[];
  Object.entries(events[0]).forEach(([teamId, raw]) => {
    const tid = teamId as unknown as number;
    const box = raw as RawEventBoxContent;
    const parsedEvents = box.events.map((rawEv: any) => parseSingleEvent<TimedEventPayload>(rawEv));
    createOrUpdateExecutionContext(tid, box.eventBoxId, parsedEvents, convertToLocalEvent);
  });
}

export type DashboardGameState = Record<number, DashboardTeamGameState>;

let loadedFirstTime = false;
let stateCache: DashboardGameState = {};
function cacheUpdate(freshState: DashboardGameState): void {
  stateCache = freshState;
}

/**
 * Builds all the game contexts and maps them DashboardGameStates
 */
export async function fetchAllTeamsState(safety: boolean): Promise<DashboardGameState> {
  if (safety && loadedFirstTime) {
    dashboardLogger.debug('Loaded already, returning cached result');
    return stateCache;
  }
  loadedFirstTime = true;
  dashboardLogger.debug('Loading per team state...');

  await updateAllTeamsState();

  const currentStates: DashboardGameState = {};
  getDashboardTeams().forEach(t => {
    const tid = t.getId()!;
    const state = getTargetExectionContext(tid)?.getCurrentState() || getStartingMainState();
    const dstate: DashboardTeamGameState = {
      ...state.getInternalStateObject(),
      simulationTime: state.getSimTime(),
    };
    currentStates[tid] = dstate;
  });
  cacheUpdate(currentStates);
  return currentStates;
}

export async function fetchAndUpdateTeamsGameState(
  updateFunc: (stateByTeam: DashboardGameState) => void,
  safety: boolean
): Promise<DashboardGameState | undefined> {
  if (safety && loadedFirstTime) {
    return undefined;
  }

  const currentStates = await fetchAllTeamsState(safety);
  if (updateFunc) {
    dashboardLogger.debug('Calling update function...');
    updateFunc(currentStates);
  }
  return currentStates;
}

const INTERVAL_DURATION: number = 2000;
const MAX_RETRIES: number = 3;
let retries: number = 0;

/**
 * Fetch teams game state and update after a game state impact (do not call on page load!)
 *
 * @params {(DashboardGameState) => void} - setState function for dashboard game state
 * @params {boolean} poll - Should the function poll for updates after impact
 */
export async function fetchAndUpdateTeamsGameStateAfterImpact(
  poll: boolean = false,
  updateFunc: (stateByTeam: DashboardGameState) => void = _ => {}
): Promise<void> {
  if (retries > 0) {
    dashboardLogger.warn('Polling already ongoing, remaining tries: ', retries);
    return;
  }

  const pollFunc = async () => {
    if (retries > 0) {
      retries--;

      try {
        const currenStates = await fetchAllTeamsState(false);
        cacheUpdate(currenStates);
        updateFunc(currenStates);
        setTimeout(pollFunc, INTERVAL_DURATION);
      } catch (error) {
        dashboardLogger.error(error);
        retries = 0;
      }
    }
  };

  try {
    if (poll) {
      retries = MAX_RETRIES;
      await pollFunc();
    } else {
      const currenStates = await fetchAllTeamsState(false);
      cacheUpdate(currenStates);
      updateFunc(currenStates);
    }
  } catch (error) {
    dashboardLogger.error(error);
    retries = 0;
  }
}

/**
 * Just to type the context properly
 */
export function getTypedState(
  state: DashboardGameState,
  teamId: number
): DashboardTeamGameState | undefined {
  return state[teamId];
}
