// EVALUATION_PRIORITY 0
import { LocationAccessibilityKind } from '../events/defineMapObjectEvent';
import { locationEnumConfig } from '../mapEntities/locationEnumConfig';
import { MapEntityActivable } from './activableState';
import { MainSimulationState } from './mainSimulationState';

// TODO English naming
/**
 * Rough indication of locations
 */
export enum LOCATION_ENUM {
  chantier = 'chantier',
  entreeChantier = 'entreeChantier',
  nidDeBlesses = 'nidDeBlesses',
  PMA = 'PMA',
  pcFront = 'pcFront', // Temporary initial "Poste de commandement"
  PC = 'PC', // "Poste de commandement sanitaire"
  ambulancePark = 'ambulancePark',
  helicopterPark = 'helicopterPark',
  remote = 'remote',
  AccReg = 'AccReg', // ways to access and leave the site
  custom = 'custom', // non logical bindings
}

/**
 * Get all MapEntityActivables
 *
 * @returns MapEntityActivable[]
 */
function getMapEntityActivables(state: Readonly<MainSimulationState>): MapEntityActivable[] {
  const activables = state.getInternalStateObject().activables;

  return Object.values(activables).filter(
    a => a.activableType === 'mapEntity'
  ) as MapEntityActivable[];
}

/**
 * Get active MapEntityActivables
 *
 * @returns MapEntityActivable[]
 */
function getActiveMapEntities(state: Readonly<MainSimulationState>): MapEntityActivable[] {
  return getMapEntityActivables(state).filter(a => a.active);
}

/**
 * Get built and active MapEntityActivables
 *
 * @returns MapEntityActivable[]
 */
function getBuiltActiveMapEntities(state: Readonly<MainSimulationState>): MapEntityActivable[] {
  return getActiveMapEntities(state).filter(a => a.buildStatus === 'built');
}

export function getActiveMapEntityFromBinding(
  state: Readonly<MainSimulationState>,
  bindingKey: LOCATION_ENUM
): MapEntityActivable | undefined {
  return getActiveMapEntities(state).find(
    mapLoc => (mapLoc as MapEntityActivable).binding === bindingKey
  );
}

// Used to check if the binding (LOCATION_ENUM) is accessible to actor / ressource / patients
// The map entities must also be active and built
export function getAvailableMapActivables(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind | 'anyKind'
): MapEntityActivable[] {
  const mapActivables = getBuiltActiveMapEntities(state);

  if (kind === 'anyKind') {
    return mapActivables;
  }

  const bindings = Object.values(locationEnumConfig)
    .filter(le => le.accessibility[kind])
    .map(le => le.id);
  return mapActivables.filter(ma => bindings.includes(ma.binding));
}

export function canMoveToLocation(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind,
  location: LOCATION_ENUM
): boolean {
  // Someone can always be at remote location
  if (location === LOCATION_ENUM.remote) {
    return true;
  }

  const mapActivable: MapEntityActivable | undefined = getActiveMapEntityFromBinding(
    state,
    location
  );
  return mapActivable != undefined && locationEnumConfig[location].accessibility[kind];
}

/**
 * Is a location on the site or not ?
 */
export function isOnSite(location: LOCATION_ENUM) {
  return location !== LOCATION_ENUM.remote;
}
