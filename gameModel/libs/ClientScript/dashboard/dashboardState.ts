import { TimedEventPayload } from '../game/common/events/eventTypes';
import { FullEvent, parseSingleEvent } from '../game/common/events/eventUtils';
import { getStartingMainState } from '../game/common/simulationState/loaders/mainStateLoader';
import { MainStateObject } from '../game/common/simulationState/mainSimulationState';
import {
  createOrUpdateExecutionContext,
  getTargetExecutionContext,
  updateExecutionContextFromEventBoxId,
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

interface RawEvent {
  '@class': 'Event';
  id: number;
  // the event box id
  parentId: number;
  previousEventId: number;
  payload: string;
}

interface RawEventBox {
  '@class': 'EventInboxInstance';
  id: number;
  lastEventId: number;
}

interface RawEventBoxContent {
  events: RawEvent[];
  eventBoxId: number;
}

/**
 * Fetches all events for each team and updates their state
 */
async function refreshAllTeamsState(): Promise<void> {
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

/**
 * Rereshes all the game contexts and builds a teamId -> state map
 */
export async function fetchAllTeamsState(safety: boolean): Promise<DashboardGameState> {
  if (!(safety && loadedFirstTime)) {
    await refreshAllTeamsState();
    loadedFirstTime = true;
    dashboardLogger.debug('Loading per team state...');
  }

  return getDashboardStateMap();
}

function getDashboardStateMap(): DashboardGameState {
  const currentStates: DashboardGameState = {};
  getDashboardTeams().forEach(team => {
    const tid = team.getId()!;
    const state = getTargetExecutionContext(tid)?.getCurrentState() || getStartingMainState();
    const dstate: DashboardTeamGameState = {
      ...state.getInternalStateObject(),
      simulationTime: state.getSimTime(),
    };
    currentStates[tid] = dstate;
  });
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

export function updateStateAfterImpact(
  response: IManagedResponse,
  updateFunc: UpdateStateFunc
): void {
  dashboardLogger.debug('Applying events after impact');
  const entities = response.updatedEntities as (RawEvent | RawEventBox)[];
  const eventMap: Record<number, FullEvent<TimedEventPayload>[]> = {};
  // filter event and map them by eventBoxId
  entities.forEach(entity => {
    if (entity['@class'] == 'Event') {
      const evt = parseSingleEvent<TimedEventPayload>(entity);
      const events = eventMap[evt.eventBoxId] || [];
      events.push(evt);
      eventMap[evt.eventBoxId] = events;
    }
  });
  // apply events to contexts
  Object.entries(eventMap).forEach(([boxId, events]) => {
    updateExecutionContextFromEventBoxId(Number(boxId), events, convertToLocalEvent);
  });
  updateFunc(getDashboardStateMap());
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
