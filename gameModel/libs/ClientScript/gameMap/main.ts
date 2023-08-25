import { Point } from "../map/point2D";

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
	mapAction = value;
	clearTmpFeature();
}

/**
 * Initiate map action routine
 */
export function initiateMapAction() {
	setMapAction(true);
}

/**
 * Cancel current map action routine
 */
export function cancelMapAction() {
	clearTmpFeature();
	setMapAction(false);
	forceUpdateMap();
}

/**
 * Launch specified action if tmpFeature matches necessary geometry
 */
export function launchMapAction(action: any) {
	// TODO implement validation of tmpFeature before initiating action
	if (tmpFeature === undefined) return;

	setMapAction(false);
	action();
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
	tmpFeature = undefined;
}