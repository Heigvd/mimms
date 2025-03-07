import { FeatureCollection } from '../gameMap/types/featureTypes';
import {
  MapConfig,
  getMapConfig,
  mapConfigVarKey,
  gpsProjection,
  swissProjection,
  getDefaultMapConfig,
} from '../gameMap/utils/mapConfig';
import {
  extentToLineString,
  getEmptyFeatureCollection,
  getExtentCenter,
} from '../gameMap/utils/mapUtils';
import { parseExtent } from '../map/layersData';
import { saveToObjectDescriptor } from '../tools/WegasHelper';

const mapRef = Helpers.useRef<any>('map', null);

export function storeMapView(map: any): void {
  mapRef.current = map;
}

/**
 * Updates the map selected folder. Resets the extent and center to the map's defaults
 * @param mapId Map identifier
 */
export async function updateMapChoice(mapId: string): Promise<void> {
  const config = getDefaultMapConfig();
  config.mapId = mapId;
  const bbox = await Helpers.downloadFile(`maps/${mapId}/bbox.data`, 'TEXT');

  const ext = parseExtent(bbox);
  const projection = config.projection ?? swissProjection;
  config.extent = OpenLayer.transformExtent(ext, gpsProjection, projection);
  config.center = getExtentCenter(config.extent);

  saveMapConfig(config);
}

export function saveCurrentView(): void {
  const config = getMapConfig();
  const view = mapRef.current.getView();

  config.zoom = view.getZoom();
  config.center = view.getCenter();
  config.extent = view.calculateExtent();
  config.viewConfigured = true;

  saveMapConfig(config);
}

export function centerToSavedView(): void {
  const config = getMapConfig();
  const view = mapRef.current.getView();
  view.setZoom(config.zoom);
  view.setCenter(config.center);
}

export function getViewGeometry(): FeatureCollection {
  const config = getMapConfig();
  const f = getEmptyFeatureCollection('view bounds');
  if (!config.viewConfigured) {
    return f;
  }

  f.features.push({
    type: 'LineString',
    coordinates: extentToLineString(getMapConfig().extent),
  });
  f.features.push({
    type: 'Point',
    coordinates: getMapConfig().center,
  });
  return f;
}

function saveMapConfig(config: MapConfig): void {
  const v = Variable.find(gameModel, mapConfigVarKey);
  saveToObjectDescriptor(v, { mapConfiguration: config });
}
