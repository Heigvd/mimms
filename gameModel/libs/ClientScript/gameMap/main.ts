import { GeometryType } from "../game/common/events/defineMapObjectEvent";
import { Point } from "../map/point2D";
import { getActionTemplate, planAction } from "../UIfacade/actionFacade";

const logger = Helpers.getLogger('mainSim-interface');

export const mapRef = Helpers.useRef<any>('map', null);
export const buildingsRef = Helpers.useRef<any>("buildings", null);

interface MapState {
	mapAction: boolean;
	mapSelect: boolean;
	selectionKey: string;
	selectionIds: string[];
	multiClick: boolean;
	tmpFeature: {
		feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][],
		geometryType: GeometryType,
	}
}

// Helpers.useRef() to persist across renders ?
let mapState: MapState;

Helpers.registerEffect(() => {
	mapState = {
		mapAction: false,
		mapSelect: false,
		selectionKey: '',
		selectionIds: [],
		multiClick: false,
		tmpFeature: {
			feature: [],
			geometryType: 'Point',
		},
	}
})

/**
 * Is the map currently in an action state
 */
export function isMapAction(): boolean {
	return mapState.mapAction;
}

/**
 * Initialize a map interaction
 */
export function startMapAction(feature: GeometryType) {
	logger.info('MAP ACTION: Action initiated');
	mapState.mapAction = true;
	updateMapState();
	clearTmpFeature();
}

/**
 * Cancel current map action routine
 */
export function endMapAction() {
	logger.info('MAP ACTION: Action Cancelled')
	clearMapState();
	buildingsRef.current.changed();
	clearTmpFeature();
}

export function startMapSelect(params: any) {
	mapState.mapSelect = true;
	mapState.selectionKey = params.key;
	mapState.selectionIds = params.ids;
	buildingsRef.current.changed();
	updateMapState();
	clearTmpFeature();
}

  const asd = 'asd';

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
	logger.info('MAP ACTION - isMapAction: ', mapState.mapAction)


	if (mapState.mapAction) {
		mapState.tmpFeature.geometryType = 'Point';
		mapState.tmpFeature.feature = [point.x, point.y];
	} else if (mapState.mapSelect) {
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

/**
 * Return current tmpFeature
 */
export function getMapState() {
	return mapState;
}

export function clearMapState() {
	mapState = {
		mapAction: false,
		mapSelect: false,
		selectionKey: '',
		selectionIds: [],
		multiClick: false,
		tmpFeature: {
			feature: [],
			geometryType: 'Point',
		},
	};
	Context.mapState.setState(mapState);
	buildingsRef.current.changed();
}

export function updateMapState() {
	Context.mapState.setState(mapState);
	buildingsRef.current.changed();
}

/**
 * Clear the current tmpFeature
 */
export function clearTmpFeature() {
	logger.info('MAP ACTION: tmpFeature cleared')
	mapState.tmpFeature.geometryType = 'Point';
	mapState.tmpFeature.feature = [];
}