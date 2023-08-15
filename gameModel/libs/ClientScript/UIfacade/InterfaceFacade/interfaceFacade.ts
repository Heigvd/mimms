/**
 * Functions related to interface variables
 */

/**
 * Get the currently selected actor
 */
export function getCurrentActor() {
	return Variable.find(gameModel, 'currentActor').getValue(self);
}

/**
 * Get the currently active action ID
 */
export function getSelectedActionId() {
	return Variable.find(gameModel, 'actionID').getValue(self);
}

