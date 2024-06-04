import { getActorsByLocation, isCurrentActorAtLocation } from '../UIfacade/actorFacade';
import { getAvailableLocationsFacade } from '../UIfacade/locationFacade';
import {
  getHumanResourcesForLocation,
  getResourcesForLocationAndType,
} from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { Actor } from '../game/common/actors/actor';
import { isGodView } from '../gameInterface/interfaceConfiguration';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

// used in page 43
export function getOverlayItems() {
  const mapEntities = getAvailableLocationsFacade();
  const overlayItems: OverlayItem[] = [];

  for (const mapEntity of mapEntities) {
    overlayItems.push({
      overlayProps: {
        position: mapEntity.getGeometricalShape().getShapeCenter(),
        positioning: 'bottom-center',
        offset: [0, -60],
      },
      payload: {
        id: mapEntity.id,
        name: mapEntity.name,
        icon: mapEntity.icon,
        actors: getActorsByLocation(mapEntity.id),
        resources: getHumanResourcesForLocation(getCurrentState(), mapEntity.id),
        ambulances: getResourcesForLocationAndType(getCurrentState(), mapEntity.id, 'ambulance'),
        helicopters: getResourcesForLocationAndType(getCurrentState(), mapEntity.id, 'helicopter'),
      },
    });
  }
  return overlayItems;
}

/**
 * Should ressource be visible to current actor at location
 */
export function canViewResources(location: LOCATION_ENUM): boolean {
  if (!isGodView()) {
    return isCurrentActorAtLocation(location);
  }

  return true;
}

/**
 * Filter actors of location according to view mode
 */
export function actorViewFilter(actors: Actor[]): Actor[] {
  const currentActorUid = Context.interfaceState.state.currentActorUid;

  if (!isGodView()) {
    // If the current actor is not at the location, we see nothing
    return actors.find(a => a.Uid === currentActorUid) ? actors : [];
  }

  return actors;
}
