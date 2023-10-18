import { GeometryType } from "../game/common/events/defineMapObjectEvent";
import { Point } from "../map/point2D";

const logger = Helpers.getLogger('mainSim-interface');

interface MapState {
	mapAction: boolean;
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
	mapState.mapAction = false;
	updateMapState();
	clearTmpFeature();
}

/**
 * Map click handler
 * @param point Point
 * @param features
 */
export function handleMapClick(
	point: Point,
	features: {
		features: Record<string, unknown>;
		layerId?: string
	}[],
): void {

	logger.info('MAP ACTION: Map click')
	logger.info('MAP ACTION - isMapAction: ', mapState.mapAction)


	if (!mapState.mapAction) return;
	mapState.tmpFeature.geometryType = 'Point';
	mapState.tmpFeature.feature = [point.x, point.y];
}

/**
 * Return current tmpFeature
 */
export function getMapState() {
	return mapState;
}

export function updateMapState() {
	Context.mapState.setState(mapState);
}

/**
 * Clear the current tmpFeature
 */
export function clearTmpFeature() {
	logger.info('MAP ACTION: tmpFeature cleared')
	mapState.tmpFeature.geometryType = 'Point';
	mapState.tmpFeature.feature = [];
}