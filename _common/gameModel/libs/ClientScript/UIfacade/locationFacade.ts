import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTranslation } from '../tools/translation';
import { getSelectedActorLocation } from './actorFacade';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { fetchLocationInfo, LocationInfo } from '../game/common/location/locationLogic';
import { LocationAccessibilityKind } from '../game/common/events/defineMapObjectEvent';

// used in page 66
export function getActorTargetLocationChoices(): { label: string; value: string }[] {
  const actorLocation = getSelectedActorLocation();

  const locations: MapEntityActivable[] = getAvailableMapActivables(getCurrentState(), 'Actors')
    /* filter out the current location */
    .filter((mapActivable: MapEntityActivable) => mapActivable.binding != actorLocation);

  return getLocationChoicesData(locations);
}

function getLocationChoicesData(
  mapLocations: MapEntityActivable[]
): { label: string; value: string }[] {
  return mapLocations.map((mapActivable: MapEntityActivable) => {
    return {
      label: getLocationTranslation(mapActivable.binding),
      value: mapActivable.binding,
    };
  });
}

export function getLocationTranslation(binding: LOCATION_ENUM): string {
  return getTranslation('mainSim-locations', locationEnumConfig[binding].name);
}

export function getLocationIcon(binding: LOCATION_ENUM): string {
  return locationEnumConfig[binding].icon ?? 'empty';
}

export function getLocationInfo(binding: LOCATION_ENUM): LocationInfo | undefined {
  return fetchLocationInfo(getCurrentState(), binding);
}

/**
 *
 * @param kind accessibility kind
 * @returns location informations for the selected locations
 */
export function getAccessibleLocationsInfo(
  kind: LocationAccessibilityKind | 'anyKind'
): LocationInfo[] {
  return getAvailableMapActivables(getCurrentState(), kind)
    .map(activable => getLocationInfo(activable.binding))
    .filter(info => info !== undefined) as LocationInfo[];
}
