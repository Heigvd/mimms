import { MapFeature } from "../game/common/events/defineMapObjectEvent";
import { getCurrentState } from "../game/mainSimulationLogic";
import { clearTmpFeature, setMapAction } from "../gameMap/main";

/**
 * Get all mapFeatures
 * @return All currently present mapFeatures
 */
export function getAllMapFeatures(): MapFeature[] {
	return getCurrentState().getMapLocations();
}

/**
 * Set the map in planning mode for the given action and plan it once done
 * TODO launch action once planned
 */
export function planAction(action: Promise<IManagedResponse | undefined>): void {
	setMapAction(true);
	
}

/**
 * Reset tmpFeature to initial value
 */
export function resetTmpFeature() {
	clearTmpFeature();
}