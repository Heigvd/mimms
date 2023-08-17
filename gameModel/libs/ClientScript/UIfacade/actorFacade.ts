import { Actor, InterventionRole } from "../game/common/actors/actor";
import { getCurrentState } from "../game/mainSimulationLogic";


/**
 * @returns All currently present actors
 */
export function getAllActors(): Readonly<Actor[]> {
	return getCurrentState().getAllActors();
}

/**
 * @returns Actor with given id or undefined
 */
export function getActor(id: number): Readonly<Actor | undefined> | undefined {
	return getCurrentState().getActorById(id);
}

/**
 * Get the currently selected actor
 */
export function getCurrentActorRole() {
	const id = Variable.find(gameModel, 'currentActorUid').getValue(self);
	return getActor(id)?.Role;
}

/**
 * Get the currently selected actor Uid
 */
export function getCurrentActorUid() {
	return Variable.find(gameModel, 'currentActorUid').getValue(self);
}