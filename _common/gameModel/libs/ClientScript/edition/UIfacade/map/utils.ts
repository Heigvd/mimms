import { getMapEntityController } from '../../controllers/controllerInstances';
import {
  getCurrentController,
  getItemsTyped,
  isSelected,
} from '../../UIfacade/genericConfigFacade';
import { ActionTemplateDataController } from '../../controllers/actionTemplateController';
import { TriggerDataController } from '../../controllers/triggerController';
import { MapEntityController } from '../../controllers/mapEntityController';

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
 * Returns true if the corresponding map entity is currently selected
 */
export function isLinkedMapEntitySelected(feature: any): boolean {
  const props = feature.getProperties();
  return isSelected('mapEntity', props.id);
}

/*********** SHOW ON MAP FUNCTIONS ************** */

export function isShowOnMapTarget(feature: any): boolean {
  const props = feature.getProperties();
  const controller = getCurrentController();
  if (controller && !(controller instanceof MapEntityController)) {
    return controller.getLatestIState()?.viewOnMapItem === props?.id;
  }
  return false;
}

/**
 * Returns true if the feature is a sibling of the show on map target map entity
 */
export function isShowOnMapTargetSibling(feature: any): boolean {
  const controller = getCurrentController();
  if (controller instanceof ActionTemplateDataController) {
    // check if the feature's id is in the displayed entites of the choice
    const targetId = controller.getLatestIState()?.viewOnMapItem;
    if (targetId) {
      const choices = getItemsTyped('choice', 'action');
      if (choices.some(c => c.displayedMapEntity === targetId)) {
        const props = feature.getProperties();
        return choices.some(c => c.displayedMapEntity === props?.id);
      }
    }
  } else if (controller instanceof TriggerDataController) {
    // TODO define what is a sibling in a trigger's impacts or conditions
    return false;
  }
  return false;
}
