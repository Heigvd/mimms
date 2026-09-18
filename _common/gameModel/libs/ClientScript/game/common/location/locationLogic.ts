import { getTranslation } from '../../../tools/translation';
import { getActorsByLocation } from '../../../UIfacade/actorFacade';
import { Actor } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { locationEnumConfig } from '../mapEntities/locationEnumConfig';
import { Resource } from '../resources/resource';
import { getActiveMapEntityFromBinding, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getMoveToTaskUid, isMoveToTaskUid } from '../tasks/taskLogic';

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
  id: LOCATION_ENUM;
  name: string;
  icon: typeof locationEnumConfig[LOCATION_ENUM]['icon'];
  actors: Actor[];
  resources: Resource[];
  ambulances: Resource[];
  helicopters: Resource[];
  comingTo: Resource[];
}

export function fetchLocationInfo(
  currentState: Readonly<MainSimulationState>,
  binding: LOCATION_ENUM
): LocationInfo | undefined {
  const mapActivable = getActiveMapEntityFromBinding(currentState, binding);

  if (mapActivable) {
    return {
      id: mapActivable.binding,
      name:
        getLocationLongTranslation(mapActivable.binding) ||
        'missing name for ' + mapActivable.binding,
      icon: locationEnumConfig[binding].icon,
      actors: getActorsByLocation(mapActivable.binding),
      resources: exludeMoving(
        currentState,
        ResourceState.getHumanResourcesByLocation(currentState, mapActivable.binding)
      ),
      ambulances: exludeMoving(
        currentState,
        ResourceState.getResourcesByTypeAndLocation(currentState, 'ambulance', mapActivable.binding)
      ),
      helicopters: exludeMoving(
        currentState,
        ResourceState.getResourcesByTypeAndLocation(
          currentState,
          'helicopter',
          mapActivable.binding
        )
      ),
      comingTo: getResourcesMovingTo(currentState, binding)
    };
  }
}

/**
 * Fetches the resources that currently moving to this location
 * @param currentState
 * @param binding
 */
function getResourcesMovingTo(
  currentState: Readonly<MainSimulationState>,
  binding: LOCATION_ENUM
): Resource[] {
  const tid = getMoveToTaskUid(currentState, binding);
  if(tid){
    return ResourceState.getResourcesByTask(currentState, tid);
  }
  return [];
}

/**
 * Resources that have been given an order have taken the road, even though they physically
 * leave the place only once the order is fully given, they are not shown at the place anymore.
 */
function exludeMoving(
  currentState: Readonly<MainSimulationState>,
  resources: Resource[]
): Resource[] {
  return resources.filter(resource => !isMoveToTaskUid(currentState, resource.currentActivity));
}
