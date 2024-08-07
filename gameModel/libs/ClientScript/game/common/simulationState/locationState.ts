import { BuildingStatus, FixedMapEntity } from '../events/defineMapObjectEvent';
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
 * All defined and ready places
 */
export function getAvailableMapLocations(state: Readonly<MainSimulationState>): FixedMapEntity[] {
  return state
    .getInternalStateObject()
    .mapLocations.filter((mapLocation: FixedMapEntity) => isBuiltAndAccessible(mapLocation));
}

/**
 * All places where an actor can be, regarding the state
 */
export function getAvailableMapLocationsForActors(
  state: Readonly<MainSimulationState>
): FixedMapEntity[] {
  return getAvailableMapLocations(state).filter((mapLocation: FixedMapEntity) =>
    isSpecificallyAccessibleToActors(mapLocation)
  );
}

/**
 * Check if a resource / patient can go to the given place (aka if the place is ready to welcome people).
 */
export function canMoveToLocation(
  state: Readonly<MainSimulationState>,
  targetLocation: LOCATION_ENUM
): boolean {
  // Someone can always be at remote location
  if (targetLocation === LOCATION_ENUM.remote) return true;

  // Other locations must be ready to have people
  const targetLocationEntity: FixedMapEntity | undefined = getMapLocationById(
    state,
    targetLocation
  );
  return targetLocationEntity != undefined && isBuiltAndAccessible(targetLocationEntity);
}

/**
 Check if an actor can go to the given place (aka if the place is ready to welcome people).
 */
export function canActorMoveToLocation(
  state: Readonly<MainSimulationState>,
  targetLocation: LOCATION_ENUM
): boolean {
  const targetLocationEntity: FixedMapEntity | undefined = getMapLocationById(
    state,
    targetLocation
  );

  return (
    canMoveToLocation(state, targetLocation) &&
    targetLocationEntity != undefined &&
    isSpecificallyAccessibleToActors(targetLocationEntity)
  );
}

function isBuiltAndAccessible(mapLocation: FixedMapEntity): boolean {
  return mapLocation.buildingStatus === BuildingStatus.ready && mapLocation.accessibility.toAll;
}

function isSpecificallyAccessibleToActors(mapLocation: FixedMapEntity): boolean {
  return mapLocation.accessibility.toActors;
}
