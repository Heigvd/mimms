import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { eraseState, getCurrentState, runUpdateLoop } from '../game/mainSimulationLogic';
import { getStateHistory, setCurrentStateDebug } from '../game/testing/stateDebug';
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
  eraseState();
  runUpdateLoop();
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

export function getTimeFrameHistory() {
  const h = getStateHistory();
  let i = 0;
  return h.map(s => {
    return { id: i++, tf: s.getCurrentTimeFrame() };
  });
}
