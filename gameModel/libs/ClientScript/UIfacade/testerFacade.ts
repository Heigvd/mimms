import { saveToVariable } from "../edition/UIfacade/genericConfigFacade";
import { TimedEventPayload } from "../game/common/events/eventTypes";
import { compareTimedEvents, getAllEvents } from "../game/common/events/eventUtils";
import { eraseState } from "../game/mainSimulationLogic";
import { getOmittedGlobalEvents, updateIgnoredEvents } from "../game/testing/stateDebug";
import { debugLogger } from "../tools/logger";

/**
 * Saves the scenarist's data and deletes the current state
 */
export function reload(): void {
  // TODO see if have to save to object instance instead ?
  // TODO might do a manual runScript to get an async call
  saveToVariable();
  debugLogger.info('Saving...');
  eraseState();
  debugLogger.info('State erased...');
}

/**
 * Undo the last
 */
export async function undoLastAction(): Promise<void> {

  // get all the applied events
  const omitted = getOmittedGlobalEvents();
  const globalEvents = getAllEvents<TimedEventPayload>().filter(ev => !omitted[ev.id]);
  const length = globalEvents.length;
  if(length > 0){
    globalEvents.sort(compareTimedEvents);
    const last = globalEvents[length-1];
    if(last?.id){
      omitted[last.id] = true;
      await updateIgnoredEvents(omitted);
      reload();
    }
  }
}

/**
 * Restart the simulation from T0
 */
export async function restart(): Promise<void> {

  const ignored : Record<string, boolean> = {};
  getAllEvents().forEach(ev => (ignored[ev.id] = true));
  await updateIgnoredEvents(ignored);
  reload();
}