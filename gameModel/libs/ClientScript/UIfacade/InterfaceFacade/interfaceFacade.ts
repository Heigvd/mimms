/**
 * Functions related to interface variables
 */

/**
 * Get the currently active action ID
 */
export function getSelectedActionId() {
	return Variable.find(gameModel, 'actionID').getValue(self);
}

