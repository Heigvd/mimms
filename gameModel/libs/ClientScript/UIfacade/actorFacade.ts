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