import * as mainLogic from '../game/mainSimulationLogic';
import * as eventUtils from '../game/common/events/eventUtils';
import { localEventManager } from '../game/common/localEvents/localEventManager';
import { buildingsRef } from '../gameMap/main';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
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

/* DEPRECATED */
// export function getAllResourcesGroup() {
// 	const tasks = getCurrentState().getInternalStateObject().tasks;
// 	const actors = getCurrentState().getInternalStateObject().actors;
// 	const resources = getCurrentState().getInternalStateObject().resources;
// 	const resourceGroups = Object.values(getCurrentState().getInternalStateObject().resourceGroups);
// 	const response: { ownerId: number, ownerType: Role, resourceId: number, resourceType: string, currentActivity: string  }[] = [];
// 	resourceGroups.forEach((resourceGroup) => {
// 		Object.keys(resourceGroup.owners).forEach(key => {
// 			const actor = actors.find(a => Number(key) == a.Uid);
// 			Object.keys(resourceGroup.resources).forEach(rk => {
// 				const resource = resources.find( r => r.Uid == Number(rk))
// 				const actionTitle = resource.currentActivity ? tasks.find(t => t.Uid == resource.currentActivity)?.title : resource.currentActivity;
// 				response.push({ownerId: actor.Uid, ownerType: actor.Role, resourceId: resource.Uid, resourceType: resource.type, currentActivity: actionTitle})
// 			})
// 		})
// 	});
// 	return response;
// }

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
