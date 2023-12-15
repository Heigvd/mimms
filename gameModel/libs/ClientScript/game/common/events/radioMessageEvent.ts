import { SimDuration } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface RadioMessagePayload {
	channel: string,
	message: string,
	actorId: number
}

export interface RadioMessageActionEvent extends ActionCreationEvent {
	durationSec: SimDuration, 
	radioMessagePayload: RadioMessagePayload
}
