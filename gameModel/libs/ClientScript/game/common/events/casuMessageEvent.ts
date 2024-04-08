import { SimDuration } from '../baseTypes';
import { ResourceContainerType } from '../resources/resourceContainer';
import { HospitalProximity } from '../simulationState/locationState';
import { ActionCreationEvent } from './eventTypes';


export type CasuMessagePayload = MethaneMessagePayload | HospitalRequestPayload;

export interface MethaneMessagePayload {
  messageType: 'METHANE' | 'MET' | 'HANE' | 'E';
  major?: string;
  exact?: string;
  incidentType?: string;
  hazards?: string;
  access?: string;
  victims?: string;
  resourceRequest?: Record<ResourceContainerType, number>;
}

export interface HospitalRequestPayload {
  messageType: 'R';
  proximity: HospitalProximity;
}

export interface CasuMessageActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  casuMessagePayload: CasuMessagePayload;
}
