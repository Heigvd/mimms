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
 * Start MapChoiceAction selection
 */
export function startMapChoice() {
  clearMapState();
  const newState = Helpers.cloneDeep(Context.mapState.state);
  newState.mapSelect = true;
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
  const mapActivable = features.find(f => f.layerId === 'activables');

  if (mapActivable) {
    const mapEntityId = mapActivable.feature['binding'] as LOCATION_ENUM;
    toggleOverlayItem(mapEntityId);
    bringOverlayItemToFront(mapEntityId);
  }
}
