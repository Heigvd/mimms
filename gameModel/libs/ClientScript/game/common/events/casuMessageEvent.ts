import { SimDuration } from "../baseTypes";
import { ResourceContainerType } from "../resources/resourceContainer";
import { Proximity } from "../simulationState/locationState";
import { ActionCreationEvent } from "./eventTypes";

export interface CasuMessagePayload {
	messageType: string,
}

export interface MethaneMessagePayload extends CasuMessagePayload {
	messageType: 'METHANE' | 'MET' | 'HANE' | 'E',
	major?: string,
	exact?: string,
	incidentType?: string,
	hazards?: string,
	access?: string,
	victims?: string,
	resourceRequest?: Record<ResourceContainerType, number>,
}

export interface HospitalRequestPayload extends CasuMessagePayload {
	messageType: 'R',
	proximity: Proximity;
}

export interface CasuMessageActionEvent extends ActionCreationEvent {
	durationSec: SimDuration,
	casuMessagePayload: CasuMessagePayload
}
