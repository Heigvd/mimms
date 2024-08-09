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

export type LocationAccessibilityKind = 'Actor' | 'Resource' | 'Patient';

export function getMapLocationById(
  state: Readonly<MainSimulationState>,
  locationKey: LOCATION_ENUM
): FixedMapEntity | undefined {
  return state
    .getInternalStateObject()
    .mapLocations.find((mapLocation: FixedMapEntity): boolean => mapLocation.id === locationKey);
}

/**
 * All defined and ready places where actors / resources / patients can be
 */
export function getAvailableMapLocations(
  state: Readonly<MainSimulationState>,
  kind: LocationAccessibilityKind | undefined // undefined means that someone can be there, whatever the kind
): FixedMapEntity[] {
  return state
    .getInternalStateObject()
    .mapLocations.filter((mapLocation: FixedMapEntity) => isBuiltAndAccessible(mapLocation, kind));
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
  return mapLocationEntity != undefined && isBuiltAndAccessible(mapLocationEntity, kind);
}

function isBuiltAndAccessible(
  mapLocation: FixedMapEntity,
  kind: LocationAccessibilityKind | undefined
): boolean {
  const isBuilt: boolean = mapLocation.buildingStatus === BuildingStatus.ready;

  let isAccessible: boolean = false;
  switch (kind) {
    case 'Actor':
      isAccessible = mapLocation.accessibility.toActors;
      break;
    case 'Resource':
      isAccessible = mapLocation.accessibility.toResources;
      break;
    case 'Patient':
      isAccessible = mapLocation.accessibility.toPatients;
      break;
    default:
      // by default, at least one kind of people can be there
      isAccessible =
        mapLocation.accessibility.toActors ||
        mapLocation.accessibility.toResources ||
        mapLocation.accessibility.toPatients;
  }

  return isBuilt && isAccessible;
}
