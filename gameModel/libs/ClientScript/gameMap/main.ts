import { FixedMapEntity } from "../game/common/events/defineMapObjectEvent";
import { LOCATION_ENUM } from "../game/common/simulationState/locationState";
import { Point } from "../map/point2D";

const logger = Helpers.getLogger('mainSim.map');

export const mapRef = Helpers.useRef<any>('map', null);
export const buildingsRef = Helpers.useRef<any>("buildings", null);
export const selectionLayerRef = Helpers.useRef<any>("selectionLayer", null);

interface MapState {
	mapSelect: boolean;
	selectionState: FixedMapEntity | undefined;
	overlayState: Partial<Record<LOCATION_ENUM, boolean>>
}

/**
 * Get initial empty MapState object
 * 
 * @returns initialMapState
 */
export function getInitialMapState(): MapState {
	return {
		mapSelect: false,
		selectionState: undefined,
		overlayState: {
			"chantier": false,
		}
	};
}

/**
 * Reset mapState to initial state
 */
export function clearMapState() {
	const newState = getInitialMapState();
	newState.overlayState = Context.mapState.state.overlayState;
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
	if (Context.action.fixedMapEntity) {
		logger.info('MAP: Geometry Select Action started')
		params = Context.action.fixedMapEntity;
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
	const mapEntities = features.find(f => f.layerId === 'available');
	
	if (mapEntities) {
		const newState = Helpers.cloneDeep(Context.mapState.state);
		newState.overlayState[mapEntities.feature["id"] as string] = !newState.overlayState[mapEntities.feature["id"] as string];
		Context.mapState.setState(newState);
	}
	
}
