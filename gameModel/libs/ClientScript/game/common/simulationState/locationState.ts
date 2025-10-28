import { getMapEntityDescriptorUid } from '../../loaders/mapEntitiesLoader';
import { FixedMapEntity, LocationAccessibilityKind } from '../events/defineMapObjectEvent';
import { locationEnumConfig } from '../mapEntities/locationEnumConfig';
import { MapEntityActivable } from '../simulationState/activableState';
import { MainSimulationState } from './mainSimulationState';

// TODO English naming
/**
 * Rough indication of locations
 */
export enum LOCATION_ENUM {
  chantier = 'chantier',
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

export function getMapLocationById(
  state: Readonly<MainSimulationState>,
  locationKey: LOCATION_ENUM
): FixedMapEntity | undefined {
  return state
    .getInternalStateObject()
    .mapLocations.find((mapLocation: FixedMapEntity): boolean => mapLocation.id === locationKey);
}

// Replacement function based on descriptors/activables
// Often used to check if location is in state
// locationEnumConfig used as replacement in resources/resourceLogic.ts
export function getMapLocationById2(
  state: Readonly<MainSimulationState>,
  locationKey: LOCATION_ENUM
): MapEntityActivable | undefined {
  const descriptorUid = getMapEntityDescriptorUid(locationKey)?.uid;

  if (descriptorUid) {
    // TODO Avoid assertion ?
    return state.getInternalStateObject().activables[descriptorUid] as MapEntityActivable;
  }

  return undefined;
}

/**
 * All defined and ready places where actors / resources / patients can be.
 * <p>
 * Ordered like LOCATION_ENUM
 */
export function getAvailableMapLocations(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind | 'anyKind'
): FixedMapEntity[] {
  return (
    Object.values(LOCATION_ENUM)
      .map((location: LOCATION_ENUM) => getMapLocationById(state, location))
      .filter(mapLocation => mapLocation != null) as FixedMapEntity[]
  ).filter((mapLocation: FixedMapEntity) => mapLocation.isBuiltAndAccessible(kind));
}

// Replacement function based on descriptors/activables
// Used to check if the binding (LOCATION_ENUM) is accessible to actor / ressource / patients
export function getAvailableMapActivables(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind | 'anyKind'
): MapEntityActivable[] {
  // TODO Avoid assertation ?
  const mapActivables = Object.values(state.getInternalStateObject().activables).filter(
    a => a.active && a.activableType === 'mapEntity' && a.buildStatus === 'built'
  ) as MapEntityActivable[];

  if (kind === 'anyKind') {
    return mapActivables;
  }

  const bindings = Object.values(locationEnumConfig)
    .filter(le => le.accessibility[kind])
    .map(le => le.id);
  return mapActivables.filter(ma => bindings.includes(ma.binding));
}

/**
 * Check if an actor / resource / patient can go to the given place
 * (aka if the place is ready to welcome them).
 */
export function canMoveToLocation(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind,
  location: LOCATION_ENUM
): boolean {
  // Someone can always be at remote location
  if (location === LOCATION_ENUM.remote) {
    return true;
  }

  // Other locations must be ready and allow to contain people
  const mapLocationEntity: FixedMapEntity | undefined = getMapLocationById(state, location);
  return mapLocationEntity != undefined && mapLocationEntity.isBuiltAndAccessible(kind);
}

// Replacement function based on descriptors/activables
export function canMoveToLocation2(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind,
  location: LOCATION_ENUM
): boolean {
  // Someone can always be at remote location
  if (location === LOCATION_ENUM.remote) {
    return true;
  }

  const mapActivable: MapEntityActivable | undefined = getMapLocationById2(state, location);
  return mapActivable != undefined && locationEnumConfig[location].accessibility[kind];
}

/**
 * Is a location on the site or not ?
 */
export function isOnSite(location: LOCATION_ENUM) {
  return location !== LOCATION_ENUM.remote;
}
