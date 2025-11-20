import { getActorsByLocation, isCurrentActorAtLocation } from '../UIfacade/actorFacade';
import { Actor } from '../game/common/actors/actor';
import { ActorId } from '../game/common/baseTypes';
import * as ResourceLogic from '../game/common/resources/resourceLogic';
import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import * as ResourceState from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';
import { isGodView } from '../gameInterface/interfaceConfiguration';
import { MapState } from './main';
import { mainSimMapLogger } from '../tools/logger';
import { getMapEntityDescriptor } from '../game/loaders/mapEntitiesLoader';
import { getShapeCenter } from '../gameMap/utils/shapeUtils';
import { PointMapObject } from '../game/common/mapEntities/mapEntityDescriptor';
import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { MapEntityActivable } from '../game/common/simulationState/activableState';

let wasGodView = true;

// Replacement based on activables/descriptors
export function getOverlayItems(actorId: ActorId | undefined) {
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
      overlayItems.push({
        overlayProps: {
          // Overlay centered over the first mapObject
          position: getShapeCenter(firstMapObject),
          positioning: 'bottom-center',
          offset: [0, -60],
        },
        payload: {
          id: mapActivable.binding,
          name: I18n.translate(firstMapObject.label) || '',
          icon: firstMapObject.type === 'Point' ? (firstMapObject as PointMapObject).icon : '',
          actors: getActorsByLocation(mapActivable.binding),
          resources: ResourceLogic.getFreeDirectReachableHumanResourcesByLocation(
            getCurrentState(),
            actorId,
            mapActivable.binding
          ),
          ambulances: ResourceState.getFreeResourcesByTypeAndLocation(
            getCurrentState(),
            'ambulance',
            mapActivable.binding
          ),
          helicopters: ResourceState.getFreeResourcesByTypeAndLocation(
            getCurrentState(),
            'helicopter',
            mapActivable.binding
          ),
        },
      });
    }
  }

  // detect change of view mode
  if (wasGodView !== isGodView()) {
    wasGodView = isGodView();
    // Force close entities if role view enabled
    if (!isGodView()) {
      const newState: MapState = Helpers.cloneDeep<MapState>(Context.mapState.state);
      newState.overlayState = newState.overlayState.filter((l: LOCATION_ENUM) =>
        canViewLocation(l)
      );
      mainSimMapLogger.info('Role view map toggle', newState.overlayState);
      Context.mapState.setState(newState);
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

export function isOverlayItemOpen(itemId: LOCATION_ENUM) {
  return Context.mapState?.state.overlayState.includes(itemId);
}

/**
 * Should ressource be visible to current actor at location
 */
export function canViewLocation(location: LOCATION_ENUM): boolean {
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
