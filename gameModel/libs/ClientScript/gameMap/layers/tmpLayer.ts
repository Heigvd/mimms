import { getTmpFeature } from "../../gameMap/main";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";


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