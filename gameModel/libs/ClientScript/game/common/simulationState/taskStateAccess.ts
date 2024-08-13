import { mainSimStateLogger, taskLogger } from '../../../tools/logger';
import { getStateActorSymbolicLocation } from '../actors/actorLogic';
import { ActorId, TaskId } from '../baseTypes';
import { TaskBase, TaskStatus } from '../tasks/taskBase';
import { PorterTask } from '../tasks/taskBasePorter';
import { LOCATION_ENUM } from './locationState';
import { MainSimulationState } from './mainSimulationState';
import * as ResourceState from './resourceStateAccess';
import { getIdleTask } from '../tasks/taskLogic';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * @returns All the tasks (no filter)
 */
export function getAllTasks(state: Readonly<MainSimulationState>): Readonly<TaskBase>[] {
  const internalState = state.getInternalStateObject();

  return internalState.tasks;
}

/**
 * Temporary filtering implementation of local communication restrictions on incident site
 */
const restrictedDirectCommAreas: Partial<Record<LOCATION_ENUM, boolean>> = { chantier: true };

export function fetchTaskChoicesForActorAndLocation(
  state: Readonly<MainSimulationState>,
  actorId: ActorId,
  location: LOCATION_ENUM,
  radioComm: boolean
): Readonly<TaskBase>[] {
  if (!radioComm && restrictedDirectCommAreas[location]) {
    return [getIdleTask(state)];
  } else {
    return fetchAvailableStandardTasksForActorAndLocation(state, actorId, location);
  }
}

export function fetchAvailableStandardTasksForActorAndLocation(
  state: Readonly<MainSimulationState>,
  actorId: ActorId,
  location: LOCATION_ENUM
): Readonly<TaskBase>[] {
  const actor = state.getActorById(actorId);
  if (actor) {
    return Object.values(getAllTasks(state)).filter(ta =>
      ta.isAvailable(state, actor, location, true)
    );
  } else {
    taskLogger.warn('Actor not found. id = ' + actorId + '. And so no task is available');
    return [];
  }
}

export function isBrancardageTaskForTargetLocation(
  state: Readonly<MainSimulationState>,
  targetLocation: LOCATION_ENUM
): boolean {
  return Object.values(getAllTasks(state))
    .filter(ta => ta instanceof PorterTask)
    .flatMap(ta => Object.values((ta as PorterTask).subTasks))
    .some(st => st.targetLocation === targetLocation);
}

/**
 * @returns True if the task has a status that is not final. It means that the task can still evolve.
 * The final status are 'Cancelled' and 'Completed'
 */
export function isTaskAlive(state: Readonly<MainSimulationState>, taskId: TaskId): boolean {
  const task = internallyGetTask(state, taskId);

  return task.getStatus() != 'Cancelled' && task.getStatus() != 'Completed';
}

/**
 * @returns Whether the allocated resources are enough to perform the task
 */
export function isAtLeastOneResource(
  state: Readonly<MainSimulationState>,
  task: TaskBase
): boolean {
  return ResourceState.getFreeResourcesByTask(state, task.Uid).length > 0;
}

/**
 * @returns The task matching the Uid. Previously check that it is unique.
 */
function internallyGetTask(state: Readonly<MainSimulationState>, taskId: TaskId): TaskBase {
  const internalState = state.getInternalStateObject();

  const matchingTasks = internalState.tasks.filter(ta => ta.Uid === taskId);

  if (matchingTasks.length === 0 || matchingTasks[0] == null) {
    mainSimStateLogger.error('No task matches id : ' + taskId);
  }

  if (matchingTasks.length > 1) {
    mainSimStateLogger.error('Error in data : there must not be 2 tasks with same id : ' + taskId);
  }

  return matchingTasks[0]!;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Change the status of a task
 */
export function changeTaskStatus(
  state: MainSimulationState,
  taskId: TaskId,
  status: TaskStatus
): void {
  const task = internallyGetTask(state, taskId);

  task.setStatus(status);
}

export function getTaskResponsibleActorSymbolicLocation(
  state: Readonly<MainSimulationState>,
  taskId: TaskId
): LOCATION_ENUM {
  const task = internallyGetTask(state, taskId);
  return getStateActorSymbolicLocation(state, task.ownerRole);
}

export function getLocationsByTaskClass<T extends TaskBase>(
  state: Readonly<MainSimulationState>,
  taskClass: { new (...args: any[]): T }
): LOCATION_ENUM[] {
  return state
    .getInternalStateObject()
    .tasks.filter(task => task instanceof taskClass)
    .flatMap(task => task.availableToLocations)
    .filter((enumValue, index, array) => array.indexOf(enumValue) === index);
}
