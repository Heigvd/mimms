import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { FilterTypeProperties } from '../../tools/helper';
import { scaleExtent } from '../../gameMap/utils/mapUtils';

const MAP_FOLDER = 'maps';
const GEOJSON = '.geojson';

export const MAP_EXTENT_SCALE_FACTOR = 1.5;

/**
 * The standard projection used for Switzerland
 */
export const swissProjection = 'EPSG:2056';
/**
 * Equivalent to WGS84 GPS coordinates
 * extracted GeoJSON files are expressed in this coordinate system
 */
export const gpsProjection = 'EPSG:4326';

export const mapConfigVarKey: keyof FilterTypeProperties<VariableClasses, SObjectDescriptor> =
  'mapConfiguration';

export type MapConfig = {
  mapId: string;
  zoom: number;
  maxZoom: number;
  extent: ExtentLikeObject;
  center: PointLikeObject;
  projection: string;
  viewConfigured: boolean;
};

/**
 * json data layer names, used directly as file names
 */
export enum LayerType {
  BUILDINGS = 'BUILDINGS',
  RAILS = 'RAILS',
  ROADS = 'ROADS',
  WATER = 'WATER',
}

export function layerDataPath(layerType: LayerType): string {
  const filename = layerType.toLowerCase() + GEOJSON;
  return [MAP_FOLDER, getMapConfig().mapId, filename].join('/');
}

export function getDefaultMapConfig(): MapConfig {
  return {
    maxZoom: 21,
    mapId: 'GVA-center',
    zoom: 0,
    extent: [0, 0, 1, 1],
    center: [0, 0],
    projection: swissProjection,
    viewConfigured: false,
  };
}

export function getMapConfig(): MapConfig {
  const v = Variable.find(gameModel, mapConfigVarKey);
  return parseObjectDescriptor<MapConfig>(v).mapConfiguration || getDefaultMapConfig();
}

/**
 * Scaled up extent to give user some room to zoom out
 */
export function getScaledExtent(): ExtentLikeObject {
  const config = getMapConfig();
  if (config.viewConfigured) {
    return scaleExtent(config.extent, MAP_EXTENT_SCALE_FACTOR);
  } else {
    return config.extent;
  }
}
