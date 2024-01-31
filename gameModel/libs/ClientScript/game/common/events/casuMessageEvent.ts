import { SimDuration } from '../baseTypes';
import { ResourceContainerType } from '../resources/resourceContainer';
import { ActionCreationEvent } from './eventTypes';

export interface CasuMessagePayload {
  messageType: 'METHANE' | 'MET' | 'HANE' | 'E';
  major?: string;
  exact?: string;
  incidentType?: string;
  hazards?: string;
  access?: string;
  victims?: string;
  resourceRequest?: Record<ResourceContainerType, number>;
}

export interface CasuMessageActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  casuMessagePayload: CasuMessagePayload;
}
