import { PointFeature } from "../../game/common/events/defineMapObjectEvent";
import { FeatureCollection } from "../../gameMap/types/featureTypes";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getCurrentState } from "../../UIfacade/debugFacade";
import { getSimTime } from "../../UIfacade/timeFacade";

const logger = Helpers.getLogger('mainSim-interface');

export function getPointLayer(): FeatureCollection {
	const layer = getEmptyFeatureCollection();
	layer.name = 'Points';

	const features = getCurrentState().getMapLocations();
	const points: PointFeature[] = features.filter(f => f.geometryType === 'Point') as PointFeature[];

	if (points.length > 0) {

		points.forEach((f, i) => {

			const point: any = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: f.geometry,
				},
				properties: {
						name: f.name,
						icon: f.icon,
						startTimeSec: f.startTimeSec,
						durationTimeSec: f.durationTimeSec,
					}
			}
			layer.features.push(point);

		})
	}

	return layer;
}

export function getPointLayerStyle(feature: any): LayerStyleObject {

	const properties = feature.getProperties();
	const icon = properties.icon;
	const completed = properties.startTimeSec !== undefined ? properties.startTimeSec + properties.durationTimeSec <= getSimTime() : true;


	const iconStyle: ImageStyleObject = {
		type: 'IconStyle',
		achor: [0.5, 0.5],
		displacement: [0, 300],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: `/maps/mapIcons/${icon}.svg`,
		scale: .1,
		opacity: completed ? 1 : .5,
	}

	return {image: iconStyle};
}