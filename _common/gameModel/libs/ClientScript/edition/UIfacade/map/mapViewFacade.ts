import { getMapConfig, MapConfig } from '../../../gameMap/utils/mapConfig';
import { getMapEntityController } from '../../controllers/controllerInstances';
import { MapEntityUIState } from '../../UIfacade/locationConfigFacade';

const mapRef = Helpers.useRef<any>('map', null);

export function storeMapView(map: any): void {
  mapRef.current = map;
}

export function saveCurrentView(): void {
  const config: Partial<MapConfig> = {};
  const view = mapRef.current.getView();

  config.zoom = view.getZoom();
  config.center = view.getCenter();
  config.extent = view.calculateExtent();

  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.mapView = config;
  getMapEntityController().updateIState(newState);
}

export function getCurrentView(): MapConfig {
  return { ...getMapConfig(), ...getMapEntityController().getLatestIState().mapView };
}
