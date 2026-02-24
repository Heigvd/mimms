import { ActorId, SimDuration } from '../baseTypes';
import { ActionCreationEvent } from './eventTypes';

export interface RadioMessagePayload {
  actorId: ActorId | undefined; // the sender
  message: string;
}

export interface RadioMessageActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  radioMessagePayload: RadioMessagePayload;
}
