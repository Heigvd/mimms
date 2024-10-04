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
import { DashboardGameState, fetchAndUpdateTeamsGameState, getTypedState } from './dashboardState';
import { CasuMessageAction } from '../game/common/actions/actionBase';
import { getRadioTranslation, getRadioChannels } from '../game/common/radio/radioLogic';
import { getTranslation } from '../tools/translation';
import { getTeam } from './utils';
import {
  getAllTeamsMultiplayerMatrix,
  getEmptyPlayerMatrix,
  getTeamMultiplayerMatrix,
  MultiplayerMatrix,
} from '../multiplayer/multiplayerManager';

// -------------------------------------------------------------------------------------------------
// state part
// -------------------------------------------------------------------------------------------------

export function getTime(state: DashboardGameState, teamId: number): string {
  // TODO a global condition on a line
  if (state) {
    return formatTime(getRawTime(state, teamId));
  } else {
    return '...loading';
  }
}

export function getRawTime(state: DashboardGameState, teamId: number): Date {
  const teamState = getTypedState(state, teamId);

  const currentDateTime = getStartTime();
  if (teamState) {
    currentDateTime.setTime(currentDateTime.getTime() + teamState.simulationTime * 1000);
  }
  return currentDateTime;
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
          (act as unknown as CasuMessageAction)['casuMessagePayload'].messageType !== 'R'
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
      label: getTranslation('mainSim-dashboard', 'radio-message'),
      value: 'radio',
    },
    {
      label: getTranslation('mainSim-interface', 'notifications'),
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

/**
 * Fetches fresh time values and computes the earliest absolute
 * time at which all the teams could forwarded
 * that is, the time of the team that is the latest in the game
 */
export async function getMinimumValidTimeForwardValue(
  updateFunc: (stateByTeam: DashboardGameState) => void
): Promise<Date> {
  const dstate = await fetchAndUpdateTeamsGameState(updateFunc, false);
  let min = getStartTime();
  if (dstate) {
    Object.keys(dstate).forEach(tid => {
      const t = getRawTime(dstate, Number(tid));
      if (t > min) {
        min = t;
      }
    });
  }
  return min;
}

/**
 * Builds a multiplayer matrix that has an entry for each player in the team
 * Players that are not yet registered in the simulation get an empty matrix
 */
export async function getTeamPlayersAndRoles(
  teamId: number,
  refresh?: boolean
): Promise<MultiplayerMatrix> {
  if (refresh) {
    await getAllTeamsMultiplayerMatrix();
  }
  const multiMatrix: MultiplayerMatrix = [];
  const team = getTeam(teamId);

  if (team) {
    const players = team.getPlayers();
    const teamMatrix = getTeamMultiplayerMatrix(teamId);
    if (teamMatrix) {
      players.forEach(p => {
        const pm = teamMatrix.find(m => m.id === p.getId());
        multiMatrix.push(pm || getEmptyPlayerMatrix(p));
      });
    }
  }
  return multiMatrix;
}
