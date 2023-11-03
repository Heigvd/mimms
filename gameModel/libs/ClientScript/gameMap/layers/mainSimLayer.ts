import { MapFeature } from "../../game/common/events/defineMapObjectEvent";
import { FeatureCollection } from "../../gameMap/types/featureTypes";
import { getEmptyFeatureCollection } from "../../gameMap/utils/mapUtils";
import { getCurrentState } from "../../UIfacade/debugFacade";
import { getSimTime } from "../../UIfacade/timeFacade";

function filterAvailable(feature: MapFeature) {
	if (feature.startTimeSec !== undefined && feature.durationTimeSec !== undefined) {
		return feature.startTimeSec + feature.durationTimeSec <= getSimTime();
	}

	return true;
}

function filterUnavailable(feature: MapFeature) {
	if (feature.startTimeSec !== undefined && feature.durationTimeSec !== undefined) {
		return feature.startTimeSec + feature.durationTimeSec >= getSimTime();
	}

	return false;
}

/**
 * Creates a layer with the given features and name
 */
function getLayer(features: MapFeature[], name: string): FeatureCollection {
	const layer = getEmptyFeatureCollection();
	layer.name = name;

	if (features.length > 0) {

		features.forEach((f, i) => {
			// If the feature is a building selection (geometryType: Select) we skip it
			if (f.geometryType === 'Select') return;

			const feature: any = {
				type: 'Feature',
				geometry: {
					type: f.geometryType,
					coordinates: f.geometry,
				},
				properties: {
					type: f.geometryType,
					name: f.name,
					icon: f.geometryType === 'Point' ? f.icon : undefined,
					startTimeSec: f.startTimeSec,
					durationTimeSec: f.durationTimeSec,
				},
			}
			layer.features.push(feature);

		})
	}

	return layer;
}

/**
 * Creates layer with all available features (completed actions)
 */
export function getAvailableLayer() {
	const features = getCurrentState().getMapLocations();
	const unavailable = features.filter(filterAvailable);

	return getLayer(unavailable, 'AvailableLayer')
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
 * Creates a layer from tmpFeature
 * This layer displays the temporary feature defined by the user during a DefineMapObjectAction
 */
export function getTmpLayer() {
	const feature = Context.mapState.state.tmpFeature;
	let formattedFeature: MapFeature[] = [];


	if (feature) {
		formattedFeature.push({
			ownerId: Context.interfaceState.state.currentActorUid,
			geometryType: feature.geometryType,
			geometry: feature.feature,
			name: 'tmpFeature'
		});

		if (feature.geometryType === 'LineString') {
			feature.feature.forEach((point: PointLikeObject) => {
				formattedFeature.push({
					ownerId: Context.interfaceState.state.currentActorUid,
					geometryType: 'Point',
					geometry: point,
					name: 'tmpFeaturePoint'
				})
			})
		};
	}



	return getLayer(formattedFeature, 'TmpLayer')
}

/**
 * Creates a layer from Selection payload
 * This layer displays the available selection when performing a SelectMapObjectAction
 */
export function getSelectionLayer() {
	const selection = Context.mapState.state.selectionState;
	let selectionFeatures: MapFeature[] = [];


	if (selection.geometryType) {
		selection.geometries.forEach((geometry: any, i: number) => {
			selectionFeatures.push({
				ownerId: Context.interfaceState.state.currentActorUid,
				geometryType: selection.geometryType,
				geometry: geometry,
				name: String(i),
				icon: selection.icon ?? undefined,
			})
		})
	}

	return getLayer(selectionFeatures, 'SelectionLayer');
}








