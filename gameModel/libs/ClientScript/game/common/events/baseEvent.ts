import { whoAmI } from "../../../tools/WegasHelper";
import { ActorId } from "../baseTypes";

export interface BaseEvent {
	type: string;
	emitterPlayerId: string;
	emitterCharacterId: string | ActorId;
}

/**
 * Legacy use initBaseEvent instead
 * @returns an initialized base event 
 */
export function initEmitterIds() {
	return {
		type: "",
		emitterCharacterId: whoAmI(),
		emitterPlayerId: String(self.getId()),
	}
}

export function initBaseEvent(emitterActorId: ActorId){
	return {
		type: "",
		emitterCharacterId: emitterActorId,
		emitterPlayerId: String(self.getId()),
	}
}

export interface TargetedEvent extends BaseEvent {
	targetType: 'Human';
	targetId: string;
}


