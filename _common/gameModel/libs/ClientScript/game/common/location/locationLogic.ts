import { getTranslation } from '../../../tools/translation';
import { getActorsByLocation } from '../../../UIfacade/actorFacade';
import { Actor } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { locationEnumConfig } from '../mapEntities/locationEnumConfig';
import { Resource } from '../resources/resource';
import { getActiveMapEntityFromBinding, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as ResourceState from '../simulationState/resourceStateAccess';

// -------------------------------------------------------------------------------------------------
// translations
// -------------------------------------------------------------------------------------------------

const translationCategory: keyof VariableClasses = 'mainSim-locations';

export function getLocationShortTranslation(location: LOCATION_ENUM): string {
  const key: TranslationKey = `location-${location.toLowerCase()}`;
  return getTranslation(translationCategory, key + '-short');
}

export function getLocationLongTranslation(location: LOCATION_ENUM): string {
  const key: TranslationKey = `location-${location.toLowerCase()}`;
  return getTranslation(translationCategory, key);
}

export interface LocationInfo {
  id: LOCATION_ENUM,
  name: string,
  icon: typeof locationEnumConfig[LOCATION_ENUM]['icon'],
  actors: Actor[],
  resources: Resource[],
  ambulances: Resource[],
  helicopters: Resource[],
}

export function fetchLocationInfo(currentState: Readonly<MainSimulationState>, binding: LOCATION_ENUM): LocationInfo | undefined {

  const mapActivable = getActiveMapEntityFromBinding(currentState, binding);

  if(mapActivable){
    return {
      id: mapActivable.binding,
      name: getLocationLongTranslation(mapActivable.binding) || 'missing name for ' + mapActivable.binding,
      icon: locationEnumConfig[binding].icon,
      actors: getActorsByLocation(mapActivable.binding),
      resources: ResourceState.getFreeHumanResourcesByLocation(
        currentState,
        mapActivable.binding
      ),
      ambulances: ResourceState.getFreeResourcesByTypeAndLocation(
        currentState,
        'ambulance',
        mapActivable.binding
      ),
      helicopters: ResourceState.getFreeResourcesByTypeAndLocation(
        currentState,
        'helicopter',
        mapActivable.binding
      ),
    }
  }

}
