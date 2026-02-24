import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { bringOverlayItemToFront, toggleOverlayItem } from '../gameMap/mapEntities';
import { Point } from '../map/point2D';
import {
  getAvailableActionTemplateById,
  isChoiceTemplate,
  updateChoice,
} from '../UIfacade/actionFacade';

const logger = Helpers.getLogger('mainSim.map');

export const mapRef = Helpers.useRef<any>('map', null);

export const selectionLayerRef = Helpers.useRef<any>('selectionLayer', null);
export const activablesLayerRef = Helpers.useRef<any>('activablesLayer', null);

export function refreshActivableLayer(): void {
  if (activablesLayerRef?.current?.changed) {
    activablesLayerRef.current.changed();
  }
}

export function refreshSelectionLayer(): void {
  if (selectionLayerRef?.current?.changed) {
    selectionLayerRef?.current.changed();
  }
}

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

export function getTypedMapState(): MapState {
  return Context.mapState?.state;
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
function clearMapState() {
  const newState = getInitialMapState();
  newState.overlayState = getTypedMapState()?.overlayState || [];
  Context.mapState.setState(newState);
  refreshActivableLayer();
}

/**
 * Cancel current map action routine
 */
export function endMapAction() {
  logger.info('MAP: Action cancelled');

  if (getTypedMapState()?.mapSelect) {
    clearMapState();
  }
}

/**
 * Start MapChoiceAction selection
 */
export function startMapChoice() {
  const newState = Helpers.cloneDeep(getTypedMapState());
  newState.mapSelect = true;
  Context.mapState.setState(newState);
  refreshActivableLayer();
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
  if (getTypedMapState().mapSelect) {
    const selectableObj = features.find(f => f.layerId === 'activableSelection');
    if (selectableObj) {
      const { currentActionUid } = getTypedInterfaceState();
      const currentTemplate = getAvailableActionTemplateById(currentActionUid || '');
      if (isChoiceTemplate(currentTemplate)) {
        const id = selectableObj.feature.id;
        const choice = currentTemplate.choices.find(c => c.displayedMapEntity === id);
        if (choice) {
          updateChoice(choice.uid);
        }
      }
    }
  } else {
    const mapActivable = features.find(f => f.layerId === 'activables');
    if (mapActivable) {
      const mapEntityId = mapActivable.feature['binding'] as LOCATION_ENUM;
      toggleOverlayItem(mapEntityId);
      bringOverlayItemToFront(mapEntityId);
    }
  }
}
