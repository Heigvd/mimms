import { SimDuration } from "../baseTypes";
import { ResourceContainerType } from "../resources/resourceContainer";
import { ActionCreationEvent } from "./eventTypes";


export interface MethanePayload {
	major: string,
	exact: string,
	incidentType: string,
	hazards: string,
	access: string,
	victims: string,
	resourceRequest: Record<ResourceContainerType, number>
}

export interface MethaneActionEvent extends ActionCreationEvent {
	durationSec: SimDuration, 
	methanePayload: MethanePayload
}
