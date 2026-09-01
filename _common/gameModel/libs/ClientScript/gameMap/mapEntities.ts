import { getActorsByLocation } from '../UIfacade/actorFacade';
import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import * as ResourceState from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { MapState } from './main';
import { getMapEntityDescriptor } from '../game/loaders/mapEntitiesLoader';
import { getShapeCenter } from './utils/shapeUtils';
import { PointMapObject } from '../game/common/mapEntities/mapEntityDescriptor';
import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { getLocationLongTranslation } from '../game/common/location/locationLogic';

// Replacement based on activables/descriptors
export function getOverlayItems(): OverlayItem[] {
  // fetch all map locations entities where there can be actors / resources / patients
  const mapActivables = getAvailableMapActivables(getCurrentState(), 'anyKind').filter(
    (a: MapEntityActivable) => {
      const accessibility = locationEnumConfig[a.binding]?.accessibility;
      return (
        a.active && a.buildStatus === 'built' && (accessibility?.Actors || accessibility?.Resources)
      );
    }
  );
  const overlayItems: OverlayItem[] = [];

  for (const mapActivable of mapActivables) {
    const mapDescriptor = getMapEntityDescriptor(mapActivable.uid);
    // by convention the overlays are placed on the first map object if any
    const firstMapObject = mapDescriptor?.mapObjects[0];

    if (firstMapObject) {
      const currentState = getCurrentState();
      overlayItems.push({
        overlayProps: {
          // Overlay centered over the first mapObject
          position: getShapeCenter(firstMapObject),
          positioning: 'bottom-center',
          offset: [0, -20],
        },
        payload: {
          id: mapActivable.binding,
          name: getLocationLongTranslation(mapActivable.binding) || 'XXX',
          icon: firstMapObject.type === 'Point' ? (firstMapObject as PointMapObject).icon : '',
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
        },
      });
    }
  }

  const order: LOCATION_ENUM[] = Context.mapState.state.overlayState;

  // Sort overlayItem according to order and open/close
  overlayItems.sort((a, b) => {
    const indexA = order.indexOf(a.payload.id as LOCATION_ENUM);

    // Closed fixedEntities cases => after opened ones
    if (indexA === -1) {
      return 1;
    }
    const indexB = order.indexOf(b.payload.id as LOCATION_ENUM);
    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });

  return overlayItems;
}

/**
 * Bring the given overlayItem to the front
 */
export function bringOverlayItemToFront(itemId: LOCATION_ENUM) {
  const index = Context.mapState.state.overlayState.indexOf(itemId);

  if (index > -1) {
    const newState: MapState = Helpers.cloneDeep(Context.mapState.state);
    newState.overlayState.splice(index, 1);
    newState.overlayState.unshift(itemId);
    Context.mapState.setState(newState);
  }
}

export function isOverlayItemOpen(itemId: LOCATION_ENUM) {
  return Context.mapState?.state.overlayState.includes(itemId);
}


// 28.08.2026 XGO : Unused, kept temporarily in case we decide to have an open close state again
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

// 28.08.2026 XGO : Unused, kept temporarily in case we decide to have an open close state again
export function openOverlayItem(itemId: LOCATION_ENUM) {
  const isAlreadyOpen = isOverlayItemOpen(itemId);

  if (!isAlreadyOpen) {
    const newState: MapState = Helpers.cloneDeep(Context.mapState.state);
    newState.overlayState.unshift(itemId);
    Context.mapState.setState(newState);
  } else {
    bringOverlayItemToFront(itemId);
  }
}

