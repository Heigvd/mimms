import { FeatureCollection } from "../../gameMap/types/featureTypes";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getCurrentState } from "../../UIfacade/debugFacade";

export function getPointLayer(): FeatureCollection {
	const layer = getEmptyFeatureCollection();
	layer.name = 'Points';

	const features = getCurrentState().getMapLocations();
	const points = features.filter(f => f.type === 'Point');

	if (points.length > 0) {

		points.forEach((f, i) => {

			const point: any = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: f.geometry,
				},
				properties: {
						icon: f.name,
					}
			}
			layer.features.push(point);

		})
	}

	return layer;
}

export function getPointLayerStyle(feature: any): LayerStyleObject {

	const icon = feature.getProperties().icon;

	const iconStyle: ImageStyleObject = {
		type: 'IconStyle',
		achor: [0.5, 0.5],
		displacement: [0, 300],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: `/maps/mapIcons/${icon}.svg`,
		scale: .1
	}

	return {image: iconStyle};
}