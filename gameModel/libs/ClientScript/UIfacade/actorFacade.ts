import { Actor } from "../game/common/actors/actor";
import { ActorId } from "../game/common/baseTypes";
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

export function getAnyOtherActorId(actorId: ActorId) : ActorId {
	const all = getAllActors();
	
	const allBut = all.filter(a => a !== getActor(actorId));
	if(allBut.length == 0){ // no other actor
		//fallback on current
		return actorId;
	}
	return allBut[0].Uid; // take any other in the list
}

/**
 * Returns an actor id that is not currently selected in the timeline.
 * falls back on current actor if the only one
 * @param main simulation Context
 */
export function getOtherValidActor(ctx: any) : ActorId {
	const resSelected = ctx.interfaceState.state.resources.sendResources.selectedActorId;
	const timelineSelected = ctx.interfaceState.state.currentActorUid;
	if(resSelected == timelineSelected){
		return getAnyOtherActorId(Context.interfaceState.state.resources.sendResources.selectedActorId);
	}
	return Context.interfaceState.state.resources.sendResources.selectedActorId;

}

