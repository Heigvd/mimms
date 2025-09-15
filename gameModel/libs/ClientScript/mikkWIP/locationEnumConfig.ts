import { InterventionRole } from '../game/common/actors/actor';
import { TranslationKey } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

// TODO Duplicata
type LocationAccessibilityKind = 'Actors' | 'Resources' | 'Patients';
/** Is it a place that can contain actors / resources / patients */
type LocationAccessibility = Record<LocationAccessibilityKind, boolean>;


// XGO moved to common/mapEntities
export interface LocationEnumConfig {
  id: LOCATION_ENUM;
  name: TranslationKey;
  leaderRoles: InterventionRole[];
  accessibility: LocationAccessibility;
  icon?: string; // TODO Do we need this or is it only for overlayed locations ?
}

export const locationEnumConfig: Record<LOCATION_ENUM, LocationEnumConfig> = {
  chantier: {
    id: LOCATION_ENUM.chantier,
    name: 'location-pcFront',
    leaderRoles: ['AL'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  nidDeBlesses: {
    id: LOCATION_ENUM.nidDeBlesses,
    name: 'location-niddeblesses',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  PMA: {
    id: LOCATION_ENUM.PMA,
    name: 'location-pma-short',
    leaderRoles: ['LEADPMA'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  pcFront: {
    id: LOCATION_ENUM.pcFront,
    name: 'location-pcFront',
    leaderRoles: ['AL'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  PC: {
    id: LOCATION_ENUM.PC,
    name: 'location-pc-short',
    leaderRoles: ['ACS', 'MCS'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  ambulancePark: {
    id: LOCATION_ENUM.ambulancePark,
    name: 'location-ambulancePark',
    leaderRoles: ['EVASAN'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  helicopterPark: {
    id: LOCATION_ENUM.helicopterPark,
    name: 'location-helicopterPark',
    leaderRoles: ['EVASAN'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  remote: {
    id: LOCATION_ENUM.remote,
    name: 'location-pcFront',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  AccReg: {
    id: LOCATION_ENUM.AccReg,
    name: 'Accreg',
    leaderRoles: [],
    accessibility: { Actors: false, Resources: false, Patients: false },
  },
  custom: {
    id: LOCATION_ENUM.custom,
    name: 'location-pcFront',
    leaderRoles: [],
    accessibility: { Actors: false, Resources: false, Patients: false },
  },
};
