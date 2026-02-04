//import { saveToVariable } from "../edition/UIfacade/genericConfigFacade";
import { TimedEventPayload } from '../game/common/events/eventTypes';
import { compareTimedEvents, getAllEvents } from '../game/common/events/eventUtils';
import { getCurrentExecutionContext } from '../game/executionContext/gameExecutionContextController';
import { resetHospitalCache } from '../game/loaders/hospitalLoader';
import { eraseInitialState } from '../game/loaders/mainStateLoader';
import { resetMapEntitiesCache } from '../game/loaders/mapEntitiesLoader';
import { resetTriggerCache } from '../game/loaders/triggerLoader';
import { resetState, runUpdateLoop } from '../game/mainSimulationLogic';
import {
  getOmittedGlobalEvents,
  setCurrentStateDebug,
  updateIgnoredEvents,
} from '../game/testing/stateDebug';
import { getInitialInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { makeAsync } from '../tools/helper';
import { debugLogger } from '../tools/logger';

/**
 * Recomputes the game state with fresh data
 */
export async function reloadState(): Promise<void> {
  // force delete the initial state
  // this will erase
  // - patients initial state
  // - ressources containers initial state (but not the container definitions)
  // - starting activables
  eraseInitialState();

  // delete the current execution context (actions, radio message, etc.)
  // and the loaded templates
  resetState();

  // reset triggers (remove cached values)
  resetTriggerCache();
  // reset map entities (remove cached values)
  resetMapEntitiesCache();
  // reset hospitals (remove cached values)
  resetHospitalCache();

  // this will reinitialize the starting state and the current state of the game
  await makeAsync(() => runUpdateLoop(), {});
  setInterfaceState(getInitialInterfaceState());
  debugLogger.info('State erased...');
}

/**
 * Undo the last action (one step is one global event)
 */
export async function undoLastAction(): Promise<void> {
  // get all the applied events
  const omitted = getOmittedGlobalEvents();
  const globalEvents = getAllEvents<TimedEventPayload>().filter(ev => !omitted[ev.id]);
  const length = globalEvents.length;
  if (length > 0) {
    globalEvents.sort(compareTimedEvents);
    const last = globalEvents[length - 1];
    if (last?.id) {
      omitted[last.id] = true;
      await updateIgnoredEvents(omitted);
      getCurrentExecutionContext().restorePreviousState();
      runUpdateLoop();
      setInterfaceState({});
    }
  }
}

/**
 * Restart the simulation from T0
 */
export async function restart(): Promise<void> {
  await setCurrentStateDebug(0);
  await reloadState();
  setTimeout(() => {
    Helpers.scrollIntoView('#current-time', { behavior: 'smooth', inline: 'center' });
  }, 200);
}

export function isTesterPage(): boolean {
  return Context.testerPageState !== undefined;
}
