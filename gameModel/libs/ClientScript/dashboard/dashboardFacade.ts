/**
 * All UX interactions related to trainer dashboard should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { SimFlag } from '../game/common/actions/actionTemplateBase';
import { InterventionRole } from '../game/common/actors/actor';
import { getRoleLongTranslation, getRoleShortTranslation } from '../game/common/actors/actorLogic';
import {
  getIndexOfSelectedChoice,
  getLocationLongTranslation,
  getLocationShortTranslation,
} from '../game/common/location/locationLogic';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { formatTime, getStartTime } from '../gameInterface/main';
import { getLetterRepresentationOfIndex } from '../tools/helper';
import { DashboardGameState, getTypedState } from './dashboardState';
import { CasuMessageAction } from '../game/common/actions/actionBase';
import { getRadioTranslation, getRadioChannels } from '../game/common/radio/radioLogic';
import { getTranslation } from '../tools/translation';
import { dashboardLogger } from '../tools/logger';

// -------------------------------------------------------------------------------------------------
// state part
// -------------------------------------------------------------------------------------------------

export function getTime(state: DashboardGameState, teamId: number): string {
  const teamState = getTypedState(state, teamId);

  // TODO a global condition on a line
  if (!teamState) {
    return 'loading...';
  }

  const currentDateTime = getStartTime();
  currentDateTime.setTime(currentDateTime.getTime() + teamState.simulationTime * 1000);

  return formatTime(currentDateTime);
}

/**
 * TODO define what information is needed
 * and possibly raise flags to change state
 */
export function getMethaneStatus(state: DashboardGameState, teamId: number): boolean {
  const teamState = getTypedState(state, teamId);
  if (teamState) {
    // TODO make it clean when decided what we want
    return (
      teamState.actions.find(
        act =>
          'casuMessagePayload' in act &&
          (act as CasuMessageAction)['casuMessagePayload'].messageType !== 'R'
      ) != undefined
    );
  }
  return false;
}

// -------------------------------------------------------------------------------------------------
// roles part
// -------------------------------------------------------------------------------------------------

/**
 * Ordered list of roles to be displayed
 */
export function getRolesArray(): InterventionRole[] {
  return ['AL', 'ACS', 'MCS', 'LEADPMA', 'EVASAN'];
}

export function getRolesContext(): {
  id: InterventionRole;
  role: InterventionRole;
  shortName: string;
  longName: string;
}[] {
  return getRolesArray().map(r => ({
    id: r,
    role: r,
    shortName: getRoleShortTranslation(r),
    longName: getRoleLongTranslation(r),
  }));
}

export function getActorsLocation(
  state: DashboardGameState,
  teamId: number,
  role: InterventionRole
): string {
  const teamState = getTypedState(state, teamId);
  if (teamState) {
    // for the moment, we do not deal with multiple actors with same role
    const location = teamState.actors.find(act => act.Role === role)?.Location;
    if (location) {
      return getLocationShortTranslation(location);
    }
  }
  return '';
}

// -------------------------------------------------------------------------------------------------
// locations part
// -------------------------------------------------------------------------------------------------

/**
 * Ordered list of locations to be displayed
 */
export function getLocationsArray(): LOCATION_ENUM[] {
  return [
    LOCATION_ENUM.pcFront,
    LOCATION_ENUM.PC,
    LOCATION_ENUM.nidDeBlesses,
    LOCATION_ENUM.PMA,
    LOCATION_ENUM.AccReg,
    LOCATION_ENUM.ambulancePark,
    LOCATION_ENUM.helicopterPark,
  ];
}

export function getLocationsContext(): {
  id: LOCATION_ENUM;
  location: LOCATION_ENUM;
  shortName: string;
  longName: string;
}[] {
  return getLocationsArray().map(loc => ({
    id: loc,
    location: loc,
    shortName: getLocationShortTranslation(loc),
    longName: getLocationLongTranslation(loc),
  }));
}

export function getLocationChoice(
  state: DashboardGameState,
  teamId: number,
  location: LOCATION_ENUM
): string {
  const teamState = getTypedState(state, teamId);

  if (teamState) {
    const mapLocation = teamState.mapLocations.find(mapLoc => mapLoc.id === location);

    if (mapLocation) {
      const index = getIndexOfSelectedChoice(mapLocation);

      if (index !== undefined) {
        return getLetterRepresentationOfIndex(index);
      }
    }
  }

  return '';
}

export function showAsOpened(
  state: DashboardGameState,
  teamId: number,
  location: LOCATION_ENUM
): boolean {
  const teamState = getTypedState(state, teamId);
  return !!(teamState && location === LOCATION_ENUM.PMA && teamState.flags[SimFlag.PMA_OPEN]);
}

// -------------------------------------------------------------------------------------------------
// impacts part
// -------------------------------------------------------------------------------------------------

export function getRadioChannelChoices(): { label: string; value: string }[] {
  return Object.values(getRadioChannels()).map(radio => {
    return { label: getRadioTranslation(radio.translationKey), value: radio.type };
  });
}

export function getRadioModeChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'Radio message',
      value: 'radio',
    },
    {
      label: 'Notification',
      value: 'notif',
    },
  ];
}

export function getTimeChoices(): { label: string; value: string }[] {
  return [
    {
      label: getTranslation('mainSim-dashboard', 'add-time'),
      value: 'add',
    },
    {
      label: getTranslation('mainSim-dashboard', 'set-time'),
      value: 'set',
    },
  ];
}

export enum GameState {
  NOT_INITIATED = 'NOT_INITIATED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
}

export interface TeamGameStateStatus {
  id: number;
  gameState: GameState;
}

export let teamsGameStateStatuses: TeamGameStateStatus[] = [];

/**
 * Get the gameState values for all teams
 */
export async function getAllTeamGameStateStatus(): Promise<TeamGameStateStatus[]> {
  const script = 'CustomDashboard.getGameStateByTeam()';
  let response: IManagedResponse;

  try {
    response = await APIMethods.runScript(script, {});
  } catch (error) {
    dashboardLogger.error(error);
  }

  teamsGameStateStatuses = response!.updatedEntities as TeamGameStateStatus[];

  return teamsGameStateStatuses;
}

/**
 * Get the gameState value for the given teamId
 *
 * @params {number} teamId - Id of given team
 */
export function getGameStateStatus(teamId: number): GameState | undefined {
  if (teamsGameStateStatuses.length === 0) {
    return undefined;
  } else {
    return teamsGameStateStatuses.find(team => team.id === teamId)!.gameState;
  }
}

/**
 * Set the gameState value for the given teamId
 *
 * @params {number} teamId - Id of given team
 * @params {GameState} gameState - Target gameState
 */
export async function setGameStateStatus(teamId: number, gameState: GameState) {
  const script = `CustomDashboard.setGameState(${teamId}, "${gameState}")`;

  try {
    await APIMethods.runScript(script, {});
  } catch (error) {
    dashboardLogger.error(error);
  }
}

/**
 * Toggle the gameState of given team
 *
 * @params {number} teamId - Id of given team
 */
export async function togglePlay(teamId: number) {
  try {
    const gameState = await getGameStateStatus(teamId);
    switch (gameState) {
      case GameState.NOT_INITIATED:
        return;
      case GameState.RUNNING:
        await setGameStateStatus(teamId, GameState.PAUSED);
        break;
      case GameState.PAUSED:
        await setGameStateStatus(teamId, GameState.RUNNING);
        break;
    }
  } catch (error) {
    dashboardLogger.error(error);
  }
}

/**
 * Set the gameState for all teams
 *
 * @params {GameState} gameState - Target gameState
 */
export async function setAllTeamsGameState(gameState: GameState) {
  if (gameState === GameState.NOT_INITIATED) return;

  const teamIds = teams.map(team => team.getEntity().id);
  const scripts = [];

  for (const teamId of teamIds) {
    scripts.push(`CustomDashboard.setGameState(${teamId}, "${gameState}")`);
  }

  try {
    await APIMethods.runScript(scripts.join(','), {});
    await getAllTeamGameStateStatus();
  } catch (error) {
    dashboardLogger.error(error);
  }
}

// -------------------------------------------------------------------------------------------------
// spy part
// -------------------------------------------------------------------------------------------------
