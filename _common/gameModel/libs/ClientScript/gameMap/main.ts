import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { entries } from '../tools/helper';
import { Point } from '../tools/point2D';
import {
  getAvailableActionTemplateById,
  isChoiceTemplate,
  updateChoice,
} from '../UIfacade/actionFacade';
import { bringOverlayItemToFront } from './mapEntities';

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

export type FixedEntityContentPanel = 'resources' | 'patients';

export interface MapState {
  mapSelect: boolean;
  overlayState: LOCATION_ENUM[];
  openFixedEntityPanel: Partial<Record<LOCATION_ENUM, FixedEntityContentPanel>>;
}

export function getTypedMapState(): MapState {
  return Context.mapState?.state;
}

/**
 * Get initial empty MapState object
 * By default, all locations that can have ressources are open
 *
 * @returns initialMapState
 */
export function getInitialMapState(): MapState {
  const locations = entries(locationEnumConfig)
    .filter(([_k, config]) => config.accessibility.Resources)
    .map(([k, _v]) => k);
  return {
    mapSelect: false,
    overlayState: locations,
    openFixedEntityPanel: {},
  };
}

/**
 * Reset mapState to initial state
 */
function clearMapState() {
  const newState = getInitialMapState();
  newState.overlayState = getTypedMapState()?.overlayState || [];
  newState.openFixedEntityPanel = getTypedMapState()?.openFixedEntityPanel || {};
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
      bringOverlayItemToFront(mapEntityId);
    }
  }
}
