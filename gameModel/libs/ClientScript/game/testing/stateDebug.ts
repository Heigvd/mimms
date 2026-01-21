import { debugLogger } from "../../tools/logger";
import { GlobalEventId } from "../common/baseTypes";
import { getAllEvents } from "../common/events/eventUtils";
import { getCurrentExecutionContext } from "../executionContext/gameExecutionContextController";


export function getStateHistory() {
  return getCurrentExecutionContext().getStateHistory();
}

/*
 Restores the game state to a previously stored one
 this mutates the state history of the execution context
 */
export async function setCurrentStateDebug(stateId: number) {
  const execContext = getCurrentExecutionContext();
  execContext.restoreState(stateId);

  // store the events that have to be omitted when recomputing the state
  // i.e. the events that occurred after the restored state
  const ignored = getOmittedGlobalEvents();
  const lastEvtId = execContext.getCurrentState().getLastEventId();
  const all = getAllEvents();
  let i = all.length - 1;
  while (i > 0 && all[i]?.id !== lastEvtId) {
    ignored[all[i]!.id] = true;
    i--;
  }
  await updateIgnoredEvents(ignored);
  debugLogger.info(`restored state ${stateId}, ignored events :`, stateId);
}

export async function updateIgnoredEvents(list : Record<GlobalEventId, boolean>): Promise<void> {
  const ignoredString = JSON.stringify(list);
  const updateIgnoredScript = `Variable.find(gameModel, 'debugIgnoredEvents').getInstance(self).setProperty('ignored', JSON.stringify(${ignoredString}));`;
  await APIMethods.runScript(updateIgnoredScript, {});
}

/**
 * Get the events that have been cancelled due to previous stored state reloading
 */
export function getOmittedGlobalEvents(): Record<string, boolean> {
  try{
    const raw =
      Variable.find(gameModel, 'debugIgnoredEvents').getInstance(self).getProperties()['ignored'] ||
      '{}';
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

