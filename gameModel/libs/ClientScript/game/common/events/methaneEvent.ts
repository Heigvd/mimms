import { SimDuration } from "../baseTypes";
import { ResourceContainerType } from "../resources/resourceContainer";
import { ActionCreationEvent } from "./eventTypes";


export interface MethanePayload {
	otherStuff: string, // TODO add all fields for the letters and all
	resourceRequest : Record<ResourceContainerType, number>
}

export interface MethaneActionEvent extends ActionCreationEvent {
	durationSec: SimDuration, 
	methanePayload: MethanePayload
}
