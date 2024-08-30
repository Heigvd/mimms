import { SimDuration } from '../baseTypes';
import { ActionCreationEvent } from './eventTypes';

export interface RadioMessagePayload {
  actorId: number; // the emitter
  message: string;
}

export interface RadioMessageActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  radioMessagePayload: RadioMessagePayload;
}
