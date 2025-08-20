import { InterventionRole } from '../game/common/actors/actor';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

// TODO Duplicata
type LocationAccessibilityKind = 'Actors' | 'Resources' | 'Patients';
/** Is it a place that can contain actors / resources / patients */
type LocationAccessibility = Record<LocationAccessibilityKind, boolean>;

export interface LocationEnumConfig {
  id: LOCATION_ENUM;
  leaderRoles: InterventionRole[];
  accessibility: LocationAccessibility;
  icon?: string; // TODO Do we need this or is it only for overlayed locations ?
}
