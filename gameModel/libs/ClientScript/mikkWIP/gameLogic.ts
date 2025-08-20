/**
 * File containing shims to ensure map related logic works as intended
 * TODO Move functions to appropriate files or remove then when done
 */

import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { LocationEnumConfig } from '../mikkWIP/locationEnumConfig';

// TODO Shouldn't be partial
// TODO How to create link with Map Entity Descriptor ?
export const locationEnumConfig: Partial<Record<LOCATION_ENUM, LocationEnumConfig>> = {
  chantier: {
    id: LOCATION_ENUM.chantier,
    leaderRoles: ['AL'],
    accessibility: { Actors: true, Resources: true, Patients: true },
  },
};
