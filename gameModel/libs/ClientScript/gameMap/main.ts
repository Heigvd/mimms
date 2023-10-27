import { GeometryType } from "../game/common/events/defineMapObjectEvent";
import { Point } from "../map/point2D";
import { getActionTemplate, planAction } from "../UIfacade/actionFacade";

const logger = Helpers.getLogger('mainSim-interface');

export const mapRef = Helpers.useRef<any>('map', null);
export const buildingsRef = Helpers.useRef<any>("buildings", null);

export function getInitialMapState() {
	return {
		mapAction: false,
		mapSelect: false,
		selectionKey: '',
		selectionIds: [],
		multiClick: false,
		tmpFeature: {
			feature: [],
			geometryType: 'Point',
		}
	};
}

export function clearMapState() {
	const newState = getInitialMapState();
	Context.mapState.setState(newState);
	buildingsRef.current.changed();
}

/**
 * Initialize a map interaction
 */
export function startMapAction(feature: GeometryType) {
	clearMapState();
	logger.info('MAP ACTION: Action initiated');
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapAction = true;
	newState.tmpFeature.geometryType = feature;
	Context.mapState.setState(newState);
}

export function startMapActionLine(feature: GeometryType) {
	wlog(feature);
	clearMapState();
	logger.info('MAP ACTION: LineString action initiated');
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapAction = true;
	newState.multiClick = true;
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

export function startMapSelect(params: any) {
	clearMapState();
	const newState = Helpers.cloneDeep(Context.mapState.state);
	newState.mapSelect = true;
	newState.selectionKey = params.key;
	newState.selectionIds = params.ids;
	Context.mapState.setState(newState);
	buildingsRef.current.changed();
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

	logger.info('MAP ACTION: Map click')
	logger.info('MAP ACTION - isMapAction: ', Context.mapState.state.mapAction)


	if (Context.mapState.state.mapAction && Context.mapState.state.tmpFeature.geometryType === 'Point') {
		const newState = Helpers.cloneDeep(Context.mapState.state);
		newState.tmpFeature.feature = [point.x, point.y];
		Context.mapState.setState(newState);
	} else if (Context.mapState.state.mapAction && Context.mapState.state.tmpFeature.geometryType === 'LineString') {
		const newState = Helpers.cloneDeep(Context.mapState.state);
		newState.tmpFeature.feature.push([point.x, point.y]);
		Context.mapState.setState(newState);
	} else if (Context.mapState.state.mapSelect) {
		const selected = features.find(f => Context.mapState.state.selectionIds.includes(f.feature[Context.mapState.state.selectionKey]));
		if (selected) {
			const currentActionRef = getActionTemplate(Context.interfaceState.state.currentActionUid)!.getTemplateRef();
			const currentActorUid = Context.interfaceState.state.currentActorUid;
			const params = {
				featureId: selected.feature[Context.mapState.state.selectionKey]
			}
			planAction(currentActionRef, currentActorUid, params);
			clearMapState();
		}
	}
}
