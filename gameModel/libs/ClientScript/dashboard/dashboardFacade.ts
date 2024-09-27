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

// export function getTimeChoices(): { label: string; value: string }[] {
//   return Object.values(getTime()).map(time => {
//     return { label: getTimeTranslation(time.translationKey), value: time.type };
//   });
// }

// -------------------------------------------------------------------------------------------------
// spy part
// -------------------------------------------------------------------------------------------------
