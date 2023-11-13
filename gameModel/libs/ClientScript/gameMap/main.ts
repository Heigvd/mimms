import { GeometryType } from "../game/common/events/defineMapObjectEvent";
import { Point } from "../map/point2D";
import { getActionTemplate, planAction } from "../UIfacade/actionFacade";

const logger = Helpers.getLogger('mainSim-interface');

export const mapRef = Helpers.useRef<any>('map', null);
export const buildingsRef = Helpers.useRef<any>("buildings", null);
export const selectionLayerRef = Helpers.useRef<any>("selectionLayer", null);

export function getInitialMapState() {
	return {
		mapAction: false,
		mapSelect: false,
		multiClick: false,
		tmpFeature: {
			feature: [],
			geometryType: 'Point',
		},
		selectionState: {},
	};
}

export function clearMapState() {
	const newState = getInitialMapState();
	Context.mapState.setState(newState);
	if (buildingsRef.current) buildingsRef.current.changed();
}

/**
 * Initialize a map interaction
 */
export function startMapAction(feature: GeometryType) {
	clearMapState();
	logger.info('MAP ACTION: Action initiated');
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapAction = true;
	newState.multiClick = feature !== 'Point';
	newState.tmpFeature.geometryType = feature;
	Context.mapState.setState(newState);
}

/**
 * Cancel current map action routine
 */
export function endMapAction() {
	logger.info('MAP ACTION: Action Cancelled')
	clearMapState();
}

export function startMapSelect() {
	let params;
	if (Context.action.featureSelection) {
		params = Context.action.featureSelection;
	}
	if (Context.action.geometrySelection) {
		params = Context.action.geometrySelection;
	}

	clearMapState();
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapSelect = true;
	newState.selectionState = params;
	Context.mapState.setState(newState);
	wlog('startMapSelect');
}

/**
 * Map click handler
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

	logger.info('MAP ACTION: Map click')
	logger.info('MAP ACTION - isMapAction: ', Context.mapState.state.mapAction)

	if (mapState.mapAction) {
		if (mapState.tmpFeature === 'Point') {
			const newState = Helpers.cloneDeep(Context.mapState.state);
			newState.tmpFeature.feature = [point.x, point.y];
			Context.mapState.setState(newState);
		} else {
			const newState = Helpers.cloneDeep(Context.mapState.state);
			newState.tmpFeature.feature.push([point.x, point.y]);
			Context.mapState.setState(newState);
		}
	} else if (mapState.mapSelect) {
		const ref = getActionTemplate(interfaceState.currentActionUid)!.getTemplateRef();
		const actor = interfaceState.currentActorUid;

		if (mapState.selectionState.geometryType) {
			const feature = features.find(f => f.layerId === 'selectionLayer');

			if (feature) {
				const index = feature.feature.name as number;

				const tmpFeature = {
					geometryType: feature.feature.type,
					feature: mapState.selectionState.geometries[index],
				}

				planAction(ref, actor, tmpFeature);
				clearMapState();
			}
		}
		if (mapState.selectionState.layerId) {
			wlog(features)
			const feature = features.find(f => f.layerId === mapState.selectionState.layerId)
			wlog(feature)
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
