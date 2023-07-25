import { SimDuration } from "../baseTypes";
import { ActionEvent } from "./eventTypes";

export interface GetInformationEvent extends ActionEvent {
	durationSec: SimDuration;
}
