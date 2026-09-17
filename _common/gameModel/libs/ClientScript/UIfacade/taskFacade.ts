import { TaskId } from '../game/common/baseTypes';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import * as TaskState from '../game/common/simulationState/taskStateAccess';
import * as TaskLogic from '../game/common/tasks/taskLogic';
import { getCurrentState } from '../game/mainSimulationLogic';

/**
 * fetch all the visible tasks for a location, move and evacuation are filtered out
 * @param location
 * @returns
 */
export function getTasksForLocation(location: LOCATION_ENUM): { Uid: TaskId; title: string }[] {
  const state = getCurrentState();
  const travelingTaskId = TaskLogic.getMoveToTaskUid(state, location);
  const evacuationTaskId = TaskLogic.getEvacuationTask(state, location).Uid;

  return TaskState.getAllTasks(state)
    .filter(task => task.location === location && task.Uid !== travelingTaskId && task.Uid !== evacuationTaskId)
    .map(task => ({ Uid: task.Uid, title: task.getTitle() }));
}
