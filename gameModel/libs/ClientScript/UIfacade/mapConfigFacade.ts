import { MapConfig, getMapConfig, mapConfigVarKey } from '../gameMap/utils/mapConfig';
import { parseExtent } from '../map/layersData';
import { saveToObjectDescriptor } from '../tools/WegasHelper';

const swissDefaultProjection = 'EPSG:2056';
const gpsProjection = 'EPSG:4326';

/**
 * Updates the map selected folder. Resets the extent to the map's default extent
 * @param mapId Map identifier
 */
export async function updateMapChoice(mapId: string): Promise<void> {
  const config = getMapConfig();
  config.mapId = mapId;
  const bbox = await Helpers.downloadFile(`maps/${mapId}/bbox.data`, 'TEXT');

  const ext = parseExtent(bbox);
  config.extent = OpenLayer.transformExtent(ext, gpsProjection, swissDefaultProjection);

  saveMapConfig(config);
}

function saveMapConfig(config: MapConfig): void {
  const v = Variable.find(gameModel, mapConfigVarKey);
  saveToObjectDescriptor(v, { mapConfiguration: config });
}
