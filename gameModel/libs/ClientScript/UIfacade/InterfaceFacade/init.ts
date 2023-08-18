// TODO move to own folder

import { getAllActors, setCurrentActorUid } from "../../UIfacade/actorFacade";

/**
 * Initiase interface with default values
 */
export function initInterface(): void {

	// Set the currentActorUid vegas variable to first actor available
	const actors = getAllActors();
	setCurrentActorUid(actors[0].Uid);
}

// Prevents interface from failing on reload
Helpers.registerEffect(() => {
	initInterface();
})