/**
 * TODO Handle other types of features than point
 */

import { DefineMapObjectTemplate } from "../../game/common/actions/actionTemplateBase";
import { getTmpFeature } from "../../gameMap/main";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getActionTemplate } from "../../UIfacade/actionFacade";

/**
 * Get layer for tmp point feature
 */
export function getTmpLayer() {
	const layer = getEmptyFeatureCollection();
	const tmpFeature = getTmpFeature();

	if (tmpFeature.geometry === undefined) return layer;

	const newFeature: any = {
		type: 'Feature',
		geometry: {
			type: tmpFeature.geometryType,
			coordinates: tmpFeature.geometry,
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