import { SimDuration } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface AskReinforcementEvent extends ActionCreationEvent {
	durationSec: SimDuration;
}
