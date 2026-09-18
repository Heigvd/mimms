import { InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';

export type LocationAccessibilityKind = 'Actors' | 'Resources' | 'Patients';
export type LocationAccessibilityFilter = LocationAccessibilityKind | 'AnyKind';

/** Is it a place that can contain actors / resources / patients */
export type LocationAccessibility = Record<LocationAccessibilityKind, boolean>;


export interface LocationEnumConfig {
  id: LOCATION_ENUM;
  name: TranslationKey;
  leaderRoles: InterventionRole[];
  accessibility: LocationAccessibility;
  icon?: string;
}

export const locationEnumConfig: Record<LOCATION_ENUM, LocationEnumConfig> = {
  chantier: {
    id: LOCATION_ENUM.chantier,
    name: 'location-chantier',
    leaderRoles: [],
    accessibility: { Actors: false, Resources: true, Patients: true },
    icon: 'mainAccident',
  },
  entreeChantier: {
    id: LOCATION_ENUM.entreeChantier,
    name: 'location-entreechantier',
    leaderRoles: [],
    accessibility: { Actors: true, Resources: true, Patients: false },
    icon: 'entreeChantier',
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
    leaderRoles: [],
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

/**
 *
 * @param kind filter by accessibility, anykind means at least some kind can access
 * @returns the filtered locations by accessiblity
 */
export function locationsByAccessibility(kind: LocationAccessibilityFilter): LocationEnumConfig[] {
  if(kind === 'AnyKind'){
    return Object.values(locationEnumConfig).filter(l => Object.values(l.accessibility).some(a => a));
  }
  return Object.values(locationEnumConfig).filter(l => l.accessibility[kind])
}