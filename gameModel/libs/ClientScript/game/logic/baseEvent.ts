import { whoAmI } from "../../tools/WegasHelper";

// TODO move in event manager

export interface BaseEvent {
	type: string;
	emitterPlayerId: string;
	emitterCharacterId: string;
}

export function initEmitterIds() {
	return {
		type: "",
		emitterCharacterId: whoAmI(),
		emitterPlayerId: String(self.getId()),
	}
}

export interface TargetedEvent extends BaseEvent {
	targetType: 'Human';
	targetId: string;
}

