import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { localEventManager } from '../game/common/localEvents/localEventManager';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getStateHistory } from '../game/mainSimulationLogic';
import { debugFacadeLogger } from '../tools/logger';

export function getCurrentState() {
  return mainLogic.getCurrentState();
}

export async function debugStoreCurrentState() {
  const stateId = mainLogic.getCurrentState().stateCount;
  const script = `Variable.find(gameModel, 'debugStoredState').getInstance(self).setValue(${stateId});`;
  await APIMethods.runScript(script, {});
  debugFacadeLogger.info('Stored state with id ', stateId);
}

export async function debugRestoreSavedState() {
  const storedStateId = Variable.find(gameModel, 'debugStoredState').getValue(self);
  if (storedStateId === undefined) {
    debugFacadeLogger.info('No state stored yet');
  } else {
    await mainLogic.setCurrentStateDebug(storedStateId);
  }
}

export function getAllActionTemplates() {
  return mainLogic.debugGetAllActionTemplates();
}

export function getAllEvents() {
  return eventUtils.getAllEvents();
}

export function triggerEventLoop() {
  mainLogic.runUpdateLoop();
  // Force scroll after interface rerender
  setTimeout(() => {
    Helpers.scrollIntoView('#current-time', { behavior: 'smooth', inline: 'center' });
    Helpers.scrollIntoView('.aMessage-animation', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.radio-message-last', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.pending', { behavior: 'smooth', block: 'start' });
  }, 1);
}

export function recomputeLocalState() {
  wlog('--- LOCAL STATE RESET');
  mainLogic.recomputeState();
}

export function getAllResources() {
  const tasks = getCurrentState().getInternalStateObject().tasks;
  const resources = getCurrentState().getInternalStateObject().resources;
  const actions = getCurrentState().getInternalStateObject().actions;

  const response: {
    resourceId: number;
    resourceType: string;
    currentActivity: string;
    currentLocation: LOCATION_ENUM;
    reservedBy: string;
  }[] = [];

  resources.forEach(resource => {
    const activityTitle: string =
      (resource.currentActivity != undefined
        ? tasks.find(t => t.Uid == resource.currentActivity)?.getTitle()
        : '') || '';

    let reservationActor = '';
    if (resource.reservationActionId != undefined) {
      const actionOwnerId = actions.find(a => a.Uid === resource.reservationActionId)?.ownerId;
      if (actionOwnerId) {
        reservationActor = getCurrentState().getActorById(actionOwnerId)?.ShortName || '';
      }
    }

    response.push({
      resourceId: resource.Uid,
      resourceType: resource.type,
      currentActivity: activityTitle + ' (' + JSON.stringify(resource.currentActivity) + ')',
      currentLocation: resource.currentLocation,
      reservedBy: reservationActor + ' (' + JSON.stringify(resource.reservationActionId) + ')',
    });
  });
  return response;
}

export function getAllLocalEvents() {
  let counter = 0;
  return localEventManager.getProcessedEvents().map(pe => {
    return { id: counter++, parentId: pe.parentEventId, type: pe.type, time: pe.simTimeStamp };
  });
}

export function getTimeFrameHistory() {
  const h = getStateHistory();
  let i = 0;
  return h.map(s => {
    return { id: i++, tf: s.getCurrentTimeFrame() };
  });
}
