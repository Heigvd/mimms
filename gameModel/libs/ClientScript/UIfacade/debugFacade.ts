import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { localEventManager } from '../game/common/localEvents/localEventManager';
import { buildingsRef } from '../gameMap/main';
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
  }, 1);
  if (buildingsRef.current) buildingsRef.current.changed();
}

export function recomputeLocalState() {
  wlog('--- LOCAL STATE RESET');
  mainLogic.recomputeState();
}

export function getAllResources() {
  const tasks = getCurrentState().getInternalStateObject().tasks;
  const resources = getCurrentState().getInternalStateObject().resources;

  const response: {
    resourceId: number;
    resourceType: string;
    currentActivity: string;
    currentLocation: LOCATION_ENUM;
  }[] = [];

  resources.forEach(resource => {
    const activityTitle = resource.currentActivity
      ? tasks.find(t => t.Uid == resource.currentActivity)?.title
      : resource.currentActivity;
    response.push({
      resourceId: resource.Uid,
      resourceType: resource.type,
      currentActivity: '' + (activityTitle || ''),
      currentLocation: resource.currentLocation,
    });
  });
  return response;
}

export function getAllLocalEvents() {
  let counter = 0;
  return localEventManager.processedEvents.map(pe => {
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
