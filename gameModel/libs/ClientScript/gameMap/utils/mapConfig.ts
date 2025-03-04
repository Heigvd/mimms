import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { FilterTypeProperties } from '../../tools/helper';

const MAP_FOLDER = 'maps';
const GEOJSON = '.geojson';

export const mapConfigVarKey: keyof FilterTypeProperties<VariableClasses, SObjectDescriptor> = 'mapConfiguration';

export type MapConfig = {
  mapId: string;
  zoom: number;
  maxZoom: number;
  extent: ExtentLikeObject;
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
    zoom: 18.5,
    extent: [1, 2, 3, 4], // TODO better
  };
}

export function getMapConfig(): MapConfig {
  const v = Variable.find(gameModel, mapConfigVarKey);
  return parseObjectDescriptor<MapConfig>(v).mapConfiguration || getDefaultMapConfig();
}

export function getExtentCenter(extent: ExtentLikeObject): PointLikeObject {
  return [(extent[0] + extent[2]) * 0.5, (extent[1] + extent[3]) * 0.5];
}

export function getMapCenter(): PointLikeObject {
  return getExtentCenter(getMapConfig().extent);
}
