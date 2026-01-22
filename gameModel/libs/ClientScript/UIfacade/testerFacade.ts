import { saveToVariable } from '../edition/UIfacade/genericConfigFacade';
import { TimedEventPayload } from '../game/common/events/eventTypes';
import { compareTimedEvents, getAllEvents } from '../game/common/events/eventUtils';
import { getCurrentExecutionContext } from '../game/executionContext/gameExecutionContextController';
import { eraseInitialState } from '../game/loaders/mainStateLoader';
import { eraseState, runUpdateLoop } from '../game/mainSimulationLogic';
import {
  getOmittedGlobalEvents,
  setCurrentStateDebug,
  updateIgnoredEvents,
} from '../game/testing/stateDebug';
import { getInitialInterfaceState, setInterfaceState } from '../gameInterface/interfaceState';
import { debugLogger } from '../tools/logger';

/**
 * Saves the scenarist's data and deletes the current state
 */
export function reloadState(): void {
  // TODO might do a manual runScript to get an async call
  //saveToVariable();
  debugLogger.info('Saving...');
  eraseInitialState();
  eraseState();
  debugLogger.info('State erased...');
}

function refreshInterfaceState(): void {
  setInterfaceState({
    //selectedActionChoiceUid: undefined,
    //selectedCasuAction: undefined,
    //selectedRadioChannel: undefined,
    //selectedPatient: undefined,
  });
}

/**
 * Undo the last
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
      refreshInterfaceState();
      //reload();
    }
  }
}

/**
 * Restart the simulation from T0
 */
export async function restart(): Promise<void> {
  await setCurrentStateDebug(0);
  setInterfaceState(getInitialInterfaceState());
  setTimeout(() => {
    Helpers.scrollIntoView('#current-time', { behavior: 'smooth', inline: 'center' });
    Helpers.scrollIntoView('.aMessage-animation', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.radio-message-last', { behavior: 'smooth', block: 'start' });
    Helpers.scrollIntoView('.pending', { behavior: 'smooth', block: 'start' });
  }, 200);
  //reload();
}
