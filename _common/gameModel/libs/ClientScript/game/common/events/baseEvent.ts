import { ActorId } from '../baseTypes';

export interface BaseEvent {
  type: string;
  emitterPlayerId: string;
  emitterCharacterId: string | ActorId;
}

/**
 * Init a base event for the pre-triage player (no character concept).
 * @returns an initialized base event
 */
export function initEmitterIds() {
  return {
    type: '',
    emitterCharacterId: '',
    emitterPlayerId: String(self.getId()),
  };
}

export function initBaseEvent(emitterActorId: ActorId) {
  return {
    type: '',
    emitterCharacterId: emitterActorId,
    emitterPlayerId: String(self.getId()),
  };
}

export interface TargetedEvent extends BaseEvent {
  targetType: 'Human';
  targetId: string;
}
