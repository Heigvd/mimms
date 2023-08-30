/**
 * TODO Handle other types of features than point
 */

import { DefineMapObjectTemplate } from "../../game/common/actions/actionTemplateBase";
import { getMapState } from "../../gameMap/main";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getActionTemplate } from "../../UIfacade/actionFacade";

const logger = Helpers.getLogger('mainSim-interface');

/**
 * Get layer for tmp point feature
 */
export function getTmpLayer() {
	const layer = getEmptyFeatureCollection();
	const mapState = getMapState();

	if (mapState.tmpFeature.geometryType === undefined) return layer;

	const newFeature: any = {
		type: 'Feature',
		geometry: {
			type: mapState.tmpFeature.geometryType,
			coordinates: mapState.tmpFeature.feature,
		}
	};
	layer.features.push(newFeature);

	return layer;
}

/**
 * Get icon style for tmp point feature
 */
export function getTmpIconStyle(): LayerStyleObject {

	const actionUid = Variable.find(gameModel, 'currentActionUid').getValue(self);
	const template = getActionTemplate(actionUid) as DefineMapObjectTemplate

	const iconStyle: ImageStyleObject = {
		type: 'IconStyle',
		achor: [0, 0],
		displacement: [0, 300], // svg icons are 256x256
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: `/maps/mapIcons/${template.featureName}.svg`,
		scale: .1,
		opacity: 0.5,
	}

	return {image: iconStyle};
}