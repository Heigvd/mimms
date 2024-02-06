import { BuildingStatus, FixedMapEntity, MultiLineStringGeometricalShape, MultiPointGeometricalShape, PointGeometricalShape } from "../../game/common/events/defineMapObjectEvent";
import { FeatureCollection } from "../../gameMap/types/featureTypes";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getCurrentState } from "../../UIfacade/debugFacade";

/************
*
*  Helpers & Tools
*
************/

/**
 * Filter for available layer generation
 * 
 * @params MapFeature features
 */
function filterAvailable(feature: FixedMapEntity) {
	if (feature.buildingStatus === BuildingStatus.ready)
		return true;
	return false;
}

/**
 * Filter for unavailable layer generation
 * 
 * @params MapFeature features
 */
function filterUnavailable(feature: FixedMapEntity) {
	if (feature.buildingStatus === BuildingStatus.inProgress)
		return true;
	return false;
}

/**
 * Returns a the end point and rotation for a given line segment
 * 
 * @param segment PointLikeObject of segment
 * 
 * @returns End point and rotation of segment
 */ 
export function getLineEndAndRotation(segment: PointLikeObject[]): {end: PointLikeObject, rotation: number} {
	const start = segment[0];
	const end = segment[1];

	const dx = end[0] - start[0];
	const dy = end[1] - start[1];
	const rotation = Math.atan2(dy, dx);

	return {end, rotation};
}

/**
 * Creates a layer with the given features and name
 * 
 * @params features MapFeature[]
 * @params name string
 * 
 * @returns FeatureCollection
 */
function getLayer(features: FixedMapEntity[], name: string): FeatureCollection {
	const layer = getEmptyFeatureCollection();
	layer.name = name;

	if (features.length > 0) {

		features.forEach((f, i) => {
			if (f instanceof FixedMapEntity){
				// If the feature is a building selection (geometryType: Select) we skip it
				if(f.buildingStatus === BuildingStatus.selection) return;

				// If the feature is an arrow add end points for arrow heads
				// TODO Better validation or templates ?
				if(f.getGeometricalShape() instanceof MultiLineStringGeometricalShape) {
					(f.getGeometricalShape() as MultiLineStringGeometricalShape).selectedPosition!.forEach((segment: PointLikeObject[], j) => {
						const {end, rotation} = getLineEndAndRotation(segment);

						const feature: any = {
							type: 'Feature',
							geometry: {
								type: 'Point',
								coordinates: end,
							},
							properties: {
								type: 'Point',
								name: String(i),
								icon: 'arrow',
								rotation: -rotation,
								startTimeSec: f.startTimeSec,
								durationTimeSec: f.durationTimeSec,
								accessType: j === 0 ? 'Access' : 'Regress',
							}
						};

						layer.features.push(feature)
					})
				}

				// Add the feature
				const feature: any = {
					type: 'Feature',
					geometry: {
						type: f.getGeometricalShape().olGeometryType,
						coordinates: f.getGeometricalShape().selectedPosition,
					},
					properties: {
						type: f.getGeometricalShape().olGeometryType,
						name: f.name,
						icon: f.getGeometricalShape() instanceof PointGeometricalShape || f.getGeometricalShape() instanceof MultiPointGeometricalShape ? f.icon : undefined,
						rotation: f.getGeometricalShape() instanceof PointGeometricalShape ? (f.getGeometricalShape() as PointGeometricalShape).rotation : undefined,
						startTimeSec: f.startTimeSec,
						durationTimeSec: f.durationTimeSec,
					},
				}
				layer.features.push(feature);

			}

		});
	}
	return layer;
}

/******************************
*
*  MainSim Layers Generation
*
******************************/

/**
 * Creates layer with all available features (completed actions)
 * 
 * @returns FeatureCollection Layer of available features
 */
export function getAvailableLayer() {
	const features = getCurrentState().getMapLocations();
	const available = features.filter(filterAvailable);

	return getLayer(available, 'AvailableLayer')
}

/**
 * Creates a layer with all unavailable features (ongoing actions)
 */
export function getUnavailableLayer() {
	const features = getCurrentState().getMapLocations();
	const unavailable = features.filter(filterUnavailable);

	return getLayer(unavailable, 'UnavailableLayer')
}

/**
 * Creates a layer from Selection payload
 * This layer displays the available selection when performing a SelectMapObjectAction
 */
export function getSelectionLayer() {
	const selection = Context.mapState.state.selectionState as FixedMapEntity;

	const layer = getEmptyFeatureCollection();
	layer.name = 'SelectionLayer';

	if (selection instanceof FixedMapEntity) {
		selection.getGeometricalShape().availablePositions!.forEach((position, i: number) => {
			if(selection.getGeometricalShape() instanceof MultiLineStringGeometricalShape) {
				(position as PointLikeObject[][])!.forEach((segment: PointLikeObject[], j) => {
					const {end, rotation} = getLineEndAndRotation(segment);

					const feature: any = {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: end,
						},
						properties: {
							type: 'Point',
							name: String(i),
							icon: 'arrow',
							rotation: -rotation,
							accessType: j === 0 ? 'Access' : 'Regress',
						}
					};

					layer.features.push(feature)
				})
			}


			const feature: any = {
				type: 'Feature',
				geometry: {
					type: selection.getGeometricalShape().olGeometryType,
					coordinates: position,
				},
				properties: {
					type: selection.getGeometricalShape().olGeometryType,
					name: String(i),
					icon: selection.getGeometricalShape() instanceof PointGeometricalShape || selection.getGeometricalShape() instanceof MultiPointGeometricalShape ? selection.icon : undefined,
					rotation: selection.getGeometricalShape() instanceof PointGeometricalShape ? (selection.getGeometricalShape() as PointGeometricalShape).rotation : undefined,
				},
			}
			layer.features.push(feature);
		});
	}
	return layer;
}








