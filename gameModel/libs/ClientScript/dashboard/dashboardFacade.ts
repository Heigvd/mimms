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
import { formatTime, buildValidSimDateTime, getSimStartDateTime } from '../gameInterface/main';
import { getLetterRepresentationOfIndex } from '../tools/helper';
import { DashboardGameState, fetchAndUpdateTeamsGameState, getTypedState } from './dashboardState';
import { CasuMessageAction } from '../game/common/actions/actionBase';
import { getRadioTranslation, getRadioChannels } from '../game/common/radio/radioLogic';
import { getTranslation } from '../tools/translation';
import { getSelectedTeamName, getTeam } from './utils';
import {
  getAllTeamsMultiplayerMatrix,
  getEmptyPlayerMatrix,
  getTeamMultiplayerMatrix,
  MultiplayerMatrix,
} from '../multiplayer/multiplayerManager';
import {
  getTypedDashboardUIState,
  hasSelectedTeam,
  ModalState,
  TimeForwardDashboardParams,
} from './dashboardUIState';
import {
  triggerAbsoluteTimeForward,
  triggerAbsoluteTimeForwardGame,
  triggerDashboardTimeForward,
  triggerDashboardTimeForwardGame,
} from './impacts';

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

  const currentDateTime = getSimStartDateTime();
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
 * time at which a given team or all the teams could time forwarded
 * @param teamId target team or among all teams if undefined
 */
export async function updateMinimumValidTimeForwardValue(
  updateFunc: (minDate: Date) => void,
  teamId: number | undefined = undefined
): Promise<void> {
  function computeMinTimeAndUpdate(dstate: DashboardGameState) {
    let min = 0;
    if (dstate) {
      if (teamId) {
        if (dstate[teamId]) {
          min = dstate[teamId]?.simulationTime || 0;
        }
      } else {
        // among all teams
        Object.keys(dstate).forEach(tid => {
          const t = dstate[Number(tid)]?.simulationTime || 0;
          if (t > min) {
            min = t;
          }
        });
      }
    }
    const minDateTime = getSimStartDateTime();
    minDateTime.setSeconds(minDateTime.getSeconds() + min);
    updateFunc(minDateTime);
  }
  await fetchAndUpdateTeamsGameState(computeMinTimeAndUpdate, false);
}

const MAXTIME_FORWARD_SECONDS = 60 * 60 * 8;

export function getMaxTimeForwardValue(minFwdTime: Date): Date {
  const absoluteMax = getSimStartDateTime();
  absoluteMax.setDate(absoluteMax.getDate() + 1);
  const maxTimeFwd = new Date((minFwdTime || getSimStartDateTime()).getTime());
  maxTimeFwd.setSeconds(maxTimeFwd.getSeconds() + MAXTIME_FORWARD_SECONDS);
  return maxTimeFwd > absoluteMax ? absoluteMax : maxTimeFwd;
}

/**
 * @return true if the currently entered time is within a valid range, defined as later
 * than minForwardTime but not more than MAXTIME_FORWARD_SECONDS later
 */
export function checkEnteredTimeValidity(): boolean {
  const state = getTypedDashboardUIState();
  const max = getMaxTimeForwardValue(state.minForwardTime);
  const enteredTime = buildValidSimDateTime(state.time?.setHour || 0, state.time?.setMinute || 0);
  return enteredTime <= max && enteredTime >= state.minForwardTime;
}

/**
 * @param params trainer filled form parameters
 * @param teamId the target team id, if 0 or undefined => all teams
 */
export async function processTimeForward(
  params: TimeForwardDashboardParams,
  teamId: number = 0
): Promise<IManagedResponse | undefined> {
  if (params.mode === 'add') {
    const seconds = (params.addMinute || 0) * 60;
    if (seconds > MAXTIME_FORWARD_SECONDS) {
      throw new Error(
        `Time forward too large, ${seconds}, max value is ${MAXTIME_FORWARD_SECONDS}`
      );
    }
    if (teamId) {
      return await triggerDashboardTimeForward(seconds, teamId);
    } else {
      return await triggerDashboardTimeForwardGame(seconds);
    }
  } else if (params.mode === 'set') {
    const hour = params.setHour || 0;
    const minute = params.setMinute || 0;
    const targetTime = buildValidSimDateTime(hour, minute);
    if (teamId) {
      return await triggerAbsoluteTimeForward(targetTime, teamId);
    } else {
      return await triggerAbsoluteTimeForwardGame(targetTime);
    }
  }
}

/**
 * Builds a multiplayer matrix that has an entry for each player in the team
 * Players that are not yet registered in the simulation get an empty matrix
 * Remark : All teams multiplayer matrices are refreshed
 */
export async function getTeamPlayersAndRolesAsync(teamId: number): Promise<MultiplayerMatrix> {
  await getAllTeamsMultiplayerMatrix();
  return getTeamPlayersAndRoles(teamId);
}

/**
 * Builds a multiplayer matrix that has an entry for each player in the team
 * Players that are not yet registered in the simulation get an empty matrix
 */
export function getTeamPlayersAndRoles(teamId: number): MultiplayerMatrix {
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

export function getModalHeaderTitle(): string {
  switch (getTypedDashboardUIState().modalState) {
    case ModalState.RadioNotifImpact:
    case ModalState.TimeImpact: {
      if (hasSelectedTeam()) {
        return getSelectedTeamName();
      } else {
        return getTranslation('mainSim-dashboard', 'all-teams');
      }
    }
    case ModalState.RolesConfiguration:
      return `${getTranslation('mainSim-dashboard', 'roles')} (${getSelectedTeamName()})`;
    default:
      return 'None';
  }
}
