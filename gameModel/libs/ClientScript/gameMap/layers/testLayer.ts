import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { FeatureCollection } from "../../map/mapLayers";
import { getCurrentState } from "../../UIfacade/debugFacade";

export function getPointLayer(): FeatureCollection {

	const layer = getEmptyFeatureCollection();

	const features = getCurrentState().getMapLocations();

	if (features.length > 0) {
		features.forEach((f, i) => {
			const newFeature: any = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: f.geometry,
				},
			}
			layer.features.push(newFeature)
		})
	}

	return layer;
}