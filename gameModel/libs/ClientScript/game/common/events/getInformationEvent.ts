import { SimDuration } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface GetInformationEvent extends ActionCreationEvent {
	durationSec: SimDuration;
}
