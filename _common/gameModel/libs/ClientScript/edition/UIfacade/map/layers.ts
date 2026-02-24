import { getLayer } from '../../../gameMap/layers/activablesLayer';
import { filterRecord } from '../../../tools/helper';
import { getMapEntityController } from '../../controllers/controllerInstances';

export function getMapEntitiesLayer(onlySelected: boolean) {
  let mapEntities = getMapEntityController().getTreeData();
  if (onlySelected) {
    const location = getMapEntityController().getLatestIState().selectedFilter;
    mapEntities = filterRecord(mapEntities, me => (onlySelected ? me.binding === location : true));
  }
  return getLayer(mapEntities, 'mapEntities', false);
}
