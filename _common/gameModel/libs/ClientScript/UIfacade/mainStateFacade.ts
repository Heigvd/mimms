import { getRoleShortTranslation } from '../game/common/actors/actorLogic';
import { getLocalEventManager } from '../game/common/localEvents/localEventManager';
import { getLocationLongTranslation } from '../game/common/location/locationLogic';
import { runUpdateLoop } from '../game/mainSimulationLogic';
import { getActor } from '../UIfacade/actorFacade';

export function triggerEventLoop() {
  runUpdateLoop();

  // Force scroll after interface rerender
  setTimeout(() => {
    Helpers.scrollIntoView('#current-time', { behavior: 'smooth', inline: 'center' });
    Helpers.scrollIntoView('.aMessage-animation', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.radio-message-last', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.pending', { behavior: 'smooth', block: 'start' });
  }, 1);
}

export function getAllLocalEvents() {
  let counter = 0;
  return getLocalEventManager()
    .getProcessedEvents()
    .map(pe => {
      return { id: counter++, parentId: pe.parentEventId, type: pe.type, time: pe.simTimeStamp };
    });
}

export function getHeaderText(): string {
  const actor = getActor(Context.interfaceState.state.currentActorUid);
  if (actor) {
    return getRoleShortTranslation(actor.Role) + ' - ' + getLocationLongTranslation(actor.Location);
  } else {
    return 'No actor selected';
  }
}
