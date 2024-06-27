import { getActorsByLocation, isCurrentActorAtLocation } from '../UIfacade/actorFacade';
import { getAvailableLocationsFacade } from '../UIfacade/locationFacade';
import * as ResourceState from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { Actor } from '../game/common/actors/actor';
import { isGodView } from '../gameInterface/interfaceConfiguration';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { MapState } from '../gameMap/main';

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
        resources: ResourceState.getFreeHumanResourcesByLocation(getCurrentState(), mapEntity.id),
        ambulances: ResourceState.getFreeResourcesByTypeAndLocation(
          getCurrentState(),
          'ambulance',
          mapEntity.id
        ),
        helicopters: ResourceState.getFreeResourcesByTypeAndLocation(
          getCurrentState(),
          'helicopter',
          mapEntity.id
        ),
      },
    });
  }

  const order: LOCATION_ENUM[] = Context.mapState.state.overlayState;

  // Sort overlayItem according order and open/close
  overlayItems.sort((a, b) => {
    const indexA = order.indexOf(a.payload.id as LOCATION_ENUM);
    const indexB = order.indexOf(b.payload.id as LOCATION_ENUM);

    // Closed fixedEntities cases
    if (indexA === -1) {
      return 1;
    } else if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });

  return overlayItems;
}

/**
 * Bring the given overlayItem to the front
 */
export function bringOverlayToFront(itemId: LOCATION_ENUM) {
  const newState: MapState = Helpers.cloneDeep(Context.mapState.state);
  const index = newState.overlayState.indexOf(itemId);

  if (index > -1) {
    newState.overlayState.splice(index, 1);
    newState.overlayState.unshift(itemId);
    Context.mapState.setState(newState);
  }
}

/**
 * Toggle open close for given overlayItem
 */
export function toggleOverlayItem(itemId: LOCATION_ENUM) {
  const newState: MapState = Helpers.cloneDeep(Context.mapState.state);
  const index = newState.overlayState.indexOf(itemId);

  if (index === -1) {
    newState.overlayState.push(itemId);
  } else {
    newState.overlayState.splice(index, 1);
  }

  Context.mapState.setState(newState);
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
    return actors.some(a => a.Uid === currentActorUid) ? actors : [];
  }

  return actors;
}
