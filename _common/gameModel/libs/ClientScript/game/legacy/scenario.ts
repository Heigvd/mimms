import { EventPayload, ScriptedEvent } from '../common/events/eventTypes';

export function reviveScriptedEvent(
  emitter: {
    emitterCharacterId: string;
    emitterPlayerId: string;
  },
  targetId: string,
  scripted: ScriptedEvent
): EventPayload {
  const pe: EventPayload = {
    ...emitter,
    ...scripted.payload,
    targetId: targetId,
  };
  return pe;
}
