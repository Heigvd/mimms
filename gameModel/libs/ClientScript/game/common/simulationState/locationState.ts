// EVALUATION_PRIORITY 0
import { FixedMapEntity, LocationAccessibilityKind } from '../events/defineMapObjectEvent';
import { MainSimulationState } from './mainSimulationState';

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
}

export function getMapLocationById(
  state: Readonly<MainSimulationState>,
  locationKey: LOCATION_ENUM
): FixedMapEntity | undefined {
  return state
    .getInternalStateObject()
    .mapLocations.find((mapLocation: FixedMapEntity): boolean => mapLocation.id === locationKey);
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

/**
 * Is a location on the site or not ?
 */
export function isOnSite(location: LOCATION_ENUM) {
  return location !== LOCATION_ENUM.remote;
}
