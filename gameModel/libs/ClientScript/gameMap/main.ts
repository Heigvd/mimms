import { Point } from "../map/point2D";

const logger = Helpers.getLogger('mainSim-interface');

let mapAction = false;
let isMultiClick = false;
let tmpFeature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][] | undefined = undefined;
let tmpType = 'Point';

/**
 * Forces an update of map via tmpFeatureForcer boolean
 */
export function forceUpdateMap() {
	const curr = Variable.find(gameModel, 'tmpFeatureForcer').getValue(self);
	APIMethods.runScript(`Variable.find(gameModel, "tmpFeatureForcer").setValue(self, ${!curr})`,{})
}


/**
 * Is the map currently in an action state
 */
export function isMapAction(): boolean {
	return mapAction;
}

/**
 * Change the action state of the map
 * TODO Include the action
 * @param value
 */
export function setMapAction(value: boolean) {
	logger.info('MAP ACTION: ' + isMapAction())
	mapAction = value;
	clearTmpFeature();
}

/**
 * Cancel current map action routine
 */
export function cancelMapAction() {
	logger.info('MAP ACTION: Action Cancelled')
	clearTmpFeature();
	setMapAction(false);
	forceUpdateMap();
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

	if (!mapAction) return;
	tmpFeature = [point.x, point.y];
	forceUpdateMap();
}

/**
 * Return current tmpFeature
 */
export function getTmpFeature() {
	return {
		id: 0,
		geometryType: tmpType,
		geometry: tmpFeature,
	};
}

/**
 * Clear the current tmpFeature
 */
export function clearTmpFeature() {
	logger.info('MAP ACTION: tmpFeature cleared')
	tmpFeature = undefined;
}