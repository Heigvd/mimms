import {
  MainSimulationState,
  MainStateObject,
} from '../game/common/simulationState/mainSimulationState';
import { PatientState } from '../game/common/simulationState/patientState';
import { buildStartingMainState } from '../game/mainSimulationLogic';
import { dashboardLogger } from '../tools/logger';

type PatientReducedState = Omit<PatientState, 'humanBody'>;

export function makeReducedState(patient: PatientState): PatientReducedState {
  const { humanBody, ...reduced } = patient;
  return reduced;
}

export type DashboardTeamGameState = Omit<MainStateObject, 'patients'> & {
  simulationTime: number;
  patients: PatientReducedState[];
};

let localStateCount = -1;
/**
 * Stores the current state of a game in a 'per team' variable
 * Called by player
 */
export async function updateLastState(
  computedState: Readonly<MainSimulationState>
): Promise<IManagedResponse | undefined> {
  try {
    const varCount = Variable.find(gameModel, 'currentStateCount').getInstance(self).getValue();
    const count = Math.max(varCount, localStateCount);
    dashboardLogger.debug(
      'state values (var, local, new)',
      varCount,
      localStateCount,
      computedState.stateCount
    );
    localStateCount = count;
    if (localStateCount < computedState.stateCount) {
      localStateCount = computedState.stateCount;

      let script = `Variable.find(gameModel, 'currentStateCount').getInstance(self).setValue(${localStateCount});`;
      script += `Variable.find(gameModel, 'currentState').getInstance(self).setProperty('state', 
      ${JSON.stringify(JSON.stringify(computedState.getReducedState()))});`;

      return await APIMethods.runScript(script, {});
    }
  } catch (e) {
    dashboardLogger.error('Could not update team state', computedState, e);
  }
}

/**************************************
 * Dashboard fetch functions
 **************************************/

export type DashboardGameState = Record<number, DashboardTeamGameState>;

let loadedFirstTime = false;
let stateCache: DashboardGameState = {};
// dummy state without event => same for all teams
let initialState: DashboardTeamGameState;

async function fetchAllTeamsState(safety: boolean): Promise<DashboardGameState> {
  if (safety && loadedFirstTime) {
    dashboardLogger.debug('Loaded already, returning cached result');
    return stateCache;
  }
  loadedFirstTime = true;
  dashboardLogger.debug('Loading per team state...');

  const response = await APIMethods.runScript('CustomDashboard.getStoredStatesByTeam();', {});
  const states = response.updatedEntities as any[];
  const result: Record<number, DashboardTeamGameState> = {};
  Object.entries(states[0]).forEach(([teamId, instance]) => {
    const tid = teamId as unknown as number;
    try {
      const state = JSON.parse((instance as any).properties.state) as DashboardTeamGameState;
      result[tid] = state;
    } catch (e) {
      // Assumption : happens when the initial state has not been uploaded yet by any player
      if (!initialState) {
        initialState = buildStartingMainState().getReducedState();
      }
      result[tid] = initialState;
    }
  });
  stateCache = result;
  return result;
}

export async function fetchAndUpdateTeamsGameState(
  updateFunc: (stateByTeam: DashboardGameState) => void,
  safety: boolean
): Promise<void> {
  if (safety && loadedFirstTime) {
    return;
  }

  const currentStates = await fetchAllTeamsState(safety);
  dashboardLogger.debug('Calling update function...');
  updateFunc(currentStates);
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
