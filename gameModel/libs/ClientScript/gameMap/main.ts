import { FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { bringOverlayItemToFront, toggleOverlayItem } from '../gameMap/mapEntities';
import { Point } from '../map/point2D';

const logger = Helpers.getLogger('mainSim.map');

export const mapRef = Helpers.useRef<any>('map', null);
export const selectionLayerRef = Helpers.useRef<any>('selectionLayer', null);

export function updateMapRef(map: any): void {
  mapRef.current = map;
  map.on('moveend', printView);
}

function printView(): void {
  const map = mapRef.current;
  logger.debug('Center', map.getView().getCenter());
  logger.debug('Zoom', map.getView().getZoom());
}

export interface MapState {
  mapSelect: boolean;
  selectionState: FixedMapEntity | undefined;
  overlayState: LOCATION_ENUM[];
}

/**
 * Get initial empty MapState object
 *
 * @returns initialMapState
 */
export function getInitialMapState(): MapState {
  return {
    mapSelect: false,
    selectionState: undefined,
    overlayState: [LOCATION_ENUM.chantier],
  };
}

/**
 * Reset mapState to initial state
 */
export function clearMapState() {
  const newState = getInitialMapState();
  newState.overlayState = Context.mapState.state.overlayState;
  Context.mapState.setState(newState);
}

/**
 * Cancel current map action routine
 */
export function endMapAction() {
  logger.info('MAP: Action cancelled');
  clearMapState();
}

/**
 * Start MapSelect routine
 */
export function startMapSelect() {
  let params;
  if (Context.action.fixedMapEntity) {
    logger.info('MAP: Geometry Select Action started');
    params = Context.action.fixedMapEntity;
  }

  clearMapState();
  const newState = Helpers.cloneDeep(Context.mapState.state);
  newState.mapSelect = true;
  newState.selectionState = params;
  Context.mapState.setState(newState);
}

/**
 * Map click handler
 *
 * @param point Point
 * @param features
 */
export function handleMapClick(
  _point: Point,
  features: {
    feature: Record<string, unknown>;
    layerId?: string;
  }[]
): void {
  const mapEntities = features.find(f => f.layerId === 'available');

  if (mapEntities) {
    const mapEntityId = mapEntities.feature['id'] as LOCATION_ENUM;
    toggleOverlayItem(mapEntityId);
    bringOverlayItemToFront(mapEntityId);
  }
}
