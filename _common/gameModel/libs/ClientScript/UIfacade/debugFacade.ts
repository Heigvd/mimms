import { getLocalEventManager } from '../game/common/localEvents/localEventManager';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { resetState, getCurrentState, runUpdateLoop } from '../game/mainSimulationLogic';
import { setCurrentStateDebug } from '../game/testing/stateDebug';
import { debugLogger } from '../tools/logger';

export async function debugStoreCurrentState() {
  const stateId = getCurrentState().stateCount;
  const script = `Variable.find(gameModel, 'debugStoredState').getInstance(self).setValue(${stateId});`;
  await APIMethods.runScript(script, {});
  debugLogger.info('Stored state with id ', stateId);
}

export async function debugRestoreSavedState() {
  const storedStateId = Variable.find(gameModel, 'debugStoredState').getValue(self);
  if (storedStateId === undefined) {
    debugLogger.info('No state stored yet');
  } else {
    await setCurrentStateDebug(storedStateId);
  }
}

export function recomputeLocalState() {
  wlog('--- LOCAL STATE RESET DEBUG ---');
  resetState();
  runUpdateLoop();
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
    const activityTitle: string =
      (resource.currentActivity != undefined
        ? tasks.find(t => t.Uid == resource.currentActivity)?.getTitle()
        : '') || '';

    response.push({
      resourceId: resource.Uid,
      resourceType: resource.type,
      currentActivity: activityTitle + ' (' + JSON.stringify(resource.currentActivity) + ')',
      currentLocation: resource.currentLocation,
    });
  });
  return response;
}

export function getAllLocalEvents() {
  let counter = 0;
  return getLocalEventManager()
    .getProcessedEvents()
    .map(pe => {
      return { id: counter++, parentId: pe.parentEventId, type: pe.type, time: pe.simTimeStamp };
    });
}
