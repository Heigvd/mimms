import { setMapAction } from "../gameMap/main";
import { getAllActors } from "../UIfacade/actorFacade";

/**
 * 
 */
type gameStateStatus = "NOT_INITIATED" | "RUNNING" | "PAUSED";

/**
 * Get the current gameStateStatus
 */
export function getGameStateStatus(): gameStateStatus {
	return Variable.find(gameModel, 'gameState').getValue(self) as gameStateStatus;
}

/**
 * Initialise interface with default values
 */
export function initInterface(): void {
	// Set the currentActorUid vegas variable to first actor available
	const actors = getAllActors();
	setCurrentActorUid(actors[0].Uid);
	// Reset any map action and tmpFeature
	setMapAction(false);
}

/**
 * Get current selected Actor Uid
 * @returns Uid
 */
export function getCurrentActorUid() {
	return Variable.find(gameModel, 'currentActorUid').getValue(self);
}

/**
 * Set the currently selected actor Uid
 */
export function setCurrentActorUid(id: number): void {
	APIMethods.runScript(
		`Variable.find(gameModel, 'currentActorUid').setValue(self, ${id});`,
		{},
	);
}

/**
 * Get currently selected Action Uid
 * @returns Uid
 */
export function getCurrentActionUid() {
	return Variable.find(gameModel, 'currentActionUid').getValue(self);
}
