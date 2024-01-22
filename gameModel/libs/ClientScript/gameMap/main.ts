import { GeometryType, PointLikeObjects } from "../game/common/events/defineMapObjectEvent";
import { Point } from "../map/point2D";
import { getActionTemplate, planAction } from "../UIfacade/actionFacade";

const logger = Helpers.getLogger('mainSim.map');

export const mapRef = Helpers.useRef<any>('map', null);
export const buildingsRef = Helpers.useRef<any>("buildings", null);
export const selectionLayerRef = Helpers.useRef<any>("selectionLayer", null);

interface MapState {
	mapSelect: boolean;
	selectionState: {
		geometryType: GeometryType | undefined;
		icon?: string;
		name?: string;
		geometries: Array<PointLikeObjects> | undefined;
	};
}

/**
 * Get initial empty MapState object
 * 
 * @returns initialMapState
 */
export function getInitialMapState(): MapState {
	return {
		mapSelect: false,
		selectionState: {
			geometryType: undefined,
			geometries: undefined,
		},
	};
}

/**
 * Reset mapState to initial state
 */
export function clearMapState() {
	const newState = getInitialMapState();
	Context.mapState.setState(newState);
	if (buildingsRef.current) buildingsRef.current.changed();
}

/**
 * Cancel current map action routine
 */
export function endMapAction() {
	logger.info('MAP: Action cancelled')
	clearMapState();
}

/**
 * Start MapSelect routine
 */
export function startMapSelect() {
	let params;
	if (Context.action.featureSelection) {
		logger.info('MAP: Feature Select Action started')
		params = Context.action.featureSelection;
	}
	if (Context.action.geometrySelection) {
		logger.info('MAP: Geometry Select Action started')
		params = Context.action.geometrySelection;
	}

	clearMapState();
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapSelect = true;
	newState.selectionState = params;
	Context.mapState.setState(newState);
}

/**
 * Map click handler
 * 
 * @param point Point
 * @param features
 */
export function handleMapClick(
	point: Point,
	features: {
		feature: Record<string, unknown>;
		layerId?: string
	}[],
): void {
	const interfaceState = Context.interfaceState.state;
	const mapState = Context.mapState.state;

	// Are we currently in a mapSelect action ?
	if (mapState.mapSelect) {
		const ref = getActionTemplate(interfaceState.currentActionUid)!.getTemplateRef();
		const actor = interfaceState.currentActorUid;

		// We're currently selecting from new geometries
		if (mapState.selectionState.geometryType) {
			const feature = features.find(f => f.layerId === 'selectionLayer');

			if (feature) {
				const index = feature.feature.name as number;

				const mapActionPayload = {
					geometryType: feature.feature.type,
					feature: mapState.selectionState.geometries[index],
				}

				planAction(ref, actor, mapActionPayload);
				clearMapState();
			}
		}

		// We're currently selecting on a layer
		if (mapState.selectionState.layerId) {
			const feature = features.find(f => f.layerId === mapState.selectionState.layerId)
			if (feature) {
				const id = feature.feature[mapState.selectionState.featureKey];

				const tmpFeature = {
					featureKey: mapState.selectionState.featureKey,
					featureId: id,
				}

				planAction(ref, actor, tmpFeature)
				clearMapState();
			}
		}
	}
}
