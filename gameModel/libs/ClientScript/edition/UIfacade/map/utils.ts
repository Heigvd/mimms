import { getMapEntityController } from '../../controllers/controllerInstances';
import { isSelected } from '../../UIfacade/genericConfigFacade';

/**
 * Returns true if the feature shares its location binding with the current location type
 */
export function hasSelectedLocationBinding(feature: any): boolean {
  const props = feature.getProperties();
  const state = getMapEntityController().getLatestIState();
  return props.binding === state.selectedFilter;
}

/**
 * Returns true if the corresponding map object is currently selected
 */
export function isLinkedMapObjectSelected(feature: any): boolean {
  const props = feature.getProperties();
  return isSelected('geometry', props.id);
}

/**
 *
 */
export function isLinkedMapEntitySelected(feature: any): boolean {
  const props = feature.getProperties();

  // TODO might be a ReadOnly without clone for efficiency
  const mapObj = getMapEntityController().getFlatDataClone()[props.id];
  if (mapObj) {
    return isSelected('mapEntity', mapObj.parent);
  }
  return false;
}
