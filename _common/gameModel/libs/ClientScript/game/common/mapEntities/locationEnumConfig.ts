import { InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { LocationAccessibilityKind } from '../events/defineMapObjectEvent';
import { LOCATION_ENUM } from '../simulationState/locationState';

/** Is it a place that can contain actors / resources / patients */
type LocationAccessibility = Record<LocationAccessibilityKind, boolean>;

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
    name: 'location-chantier',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: true },
    icon: 'mainAccident',
  },
  nidDeBlesses: {
    id: LOCATION_ENUM.nidDeBlesses,
    name: 'location-niddeblesses',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: true },
    icon: 'Nest',
  },
  PMA: {
    id: LOCATION_ENUM.PMA,
    name: 'location-pma',
    leaderRoles: ['LEADPMA'],
    accessibility: { Actors: true, Resources: true, Patients: true },
    icon: 'PMA',
  },
  pcFront: {
    id: LOCATION_ENUM.pcFront,
    name: 'location-pcFront',
    leaderRoles: ['AL'],
    accessibility: { Actors: true, Resources: true, Patients: true },
    icon: 'pcFront',
  },
  PC: {
    id: LOCATION_ENUM.PC,
    name: 'location-pc',
    leaderRoles: ['ACS', 'MCS'],
    accessibility: { Actors: true, Resources: true, Patients: true },
    icon: 'PC',
  },
  ambulancePark: {
    id: LOCATION_ENUM.ambulancePark,
    name: 'location-ambulancePark',
    leaderRoles: ['EVASAN'],
    accessibility: { Actors: false, Resources: true, Patients: true },
    icon: 'ambulance-park',
  },
  helicopterPark: {
    id: LOCATION_ENUM.helicopterPark,
    name: 'location-helicopterPark',
    leaderRoles: ['EVASAN'],
    accessibility: { Actors: false, Resources: true, Patients: true },
    icon: 'helicopter-park',
  },
  remote: {
    id: LOCATION_ENUM.remote,
    name: 'location-remote',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
  AccReg: {
    id: LOCATION_ENUM.AccReg,
    name: 'location-accreg',
    leaderRoles: [],
    accessibility: { Actors: false, Resources: false, Patients: false },
  },
  // XGO TODO adaptation, it seems ok to have this custom for now,
  //we will likely go for a fully dynamic string record in the some distant future
  custom: {
    id: LOCATION_ENUM.custom,
    name: 'location-custom',
    leaderRoles: [],
    accessibility: { Actors: false, Resources: false, Patients: false },
  },
};
