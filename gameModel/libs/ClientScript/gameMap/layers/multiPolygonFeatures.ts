import { MapFeature, MultiPolygonFeature, PolygonFeature } from "../../game/common/events/defineMapObjectEvent";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { FeatureCollection } from "../../map/mapLayers";
import { getCurrentState } from "../../UIfacade/debugFacade";
import { getSimTime } from "../../UIfacade/timeFacade";

const logger = Helpers.getLogger('mainSim-interface');

// TODO Maybe use a generic getFeatureLayer function for all types ?
export function getMultiPolygonLayer(): FeatureCollection {
	const layer = getEmptyFeatureCollection();
	layer.name = 'MultiPolygon';

	const features = getCurrentState().getMapLocations();
	const polygons: MultiPolygonFeature[] = features.filter(f => f.geometryType === 'MultiPolygon') as MultiPolygonFeature[];

	if (polygons.length > 0) {

		polygons.forEach((f, i) => {

			const polygon: any = {
				type: 'Feature',
				geometry: {
					type: 'MultiPolygon',
					coordinates: f.geometry,
				},
				properties: {
					name: f.name,
					startTimeSec: f.startTimeSec,
					durationTimeSec: f.durationTimeSec
				}
			};
			layer.features.push(polygon);

		});
	}

	return layer;
}

// TODO For now hardcoded for triage zone
export function getMultiPolygonLayerStyle(feature: any): LayerStyleObject {
	
	const properties = feature.getProperties();
	const completed = properties.startTimeSec !== undefined ? properties.startTimeSec + properties.durationTimeSec <= getSimTime() : true;

	const fill: FillStyleObject = {
		type: 'FillStyle',
		// TODO CC = 80% opacity
		color: '#BCBFECCC',
	};

	const stroke: StrokeStyleObject = {
		type: 'StrokeStyle',
		color: '#575FCF',
		lineCap: 'round',
		lineJoin: 'round',
		width: 5, 
	}

	const text: TextStyleObject = {
		type: 'TextStyle',
		text: properties.name || 'No name',
		textAlign: 'center',
	}

	return {fill, stroke, text};
}

