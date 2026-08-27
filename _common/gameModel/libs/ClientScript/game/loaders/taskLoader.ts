import { NoIdleTimeAllowed, StandardMaximumIdleTime } from '../common/constants';
import { LOCATION_ENUM } from '../common/simulationState/locationState';
import { HealingTask, TaskBase, TaskType } from '../common/tasks/taskBase';
import { EvacuationTask } from '../common/tasks/taskBaseEvacuation';
import { MoveToTask } from '../common/tasks/taskBaseMoveTo';
import { PorterTask } from '../common/tasks/taskBasePorter';
import { PreTriageTask } from '../common/tasks/taskBasePretriage';
import { WaitingTask } from '../common/tasks/taskBaseWaiting';

export function getWaitingTaskId(loadedTasks: TaskBase[], location: LOCATION_ENUM): number {
  return loadedTasks.find(t => t.taskType === TaskType.Waiting && t.location === location)!.Uid;
}

export function loadTasks(): TaskBase[] {
  const taskPretriChantier = new PreTriageTask(
    'pre-tri-title',
    LOCATION_ENUM.chantier,
    [],
    NoIdleTimeAllowed
  );

  const taskPretriPMA = new PreTriageTask(
    'pre-tri-title',
    LOCATION_ENUM.PMA,
    [],
    StandardMaximumIdleTime
  );

  const taskPretriNidDeBlesses = new PreTriageTask(
    'pre-tri-title',
    LOCATION_ENUM.nidDeBlesses,
    [],
    StandardMaximumIdleTime
  );

  const taskBrancardageChantier = new PorterTask(
    'brancardage-title',
    'porters-task-no-target-location',
    LOCATION_ENUM.chantier,
    [],
    NoIdleTimeAllowed
  );

  const taskBrancardageNidDeBlesses = new PorterTask(
    'brancardage-title',
    'porters-task-no-target-location',
    LOCATION_ENUM.nidDeBlesses,
    [],
    StandardMaximumIdleTime
  );

  const taskHealingChantier = new HealingTask(
    'healing-title',
    LOCATION_ENUM.chantier,
    [],
    NoIdleTimeAllowed
  );

  const taskHealingNidDeBlesses = new HealingTask(
    'healing-title',
    LOCATION_ENUM.nidDeBlesses,
    [],
    StandardMaximumIdleTime
  );

  const taskHealingRed = new HealingTask(
    'healing-pma-red-title',
    LOCATION_ENUM.PMA,
    [],
    StandardMaximumIdleTime,
    1
  );

  const taskHealingYellow = new HealingTask(
    'healing-pma-yellow-title',
    LOCATION_ENUM.PMA,
    [],
    StandardMaximumIdleTime,
    2
  );

  const taskHealingGreen = new HealingTask(
    'healing-pma-green-title',
    LOCATION_ENUM.PMA,
    [],
    StandardMaximumIdleTime,
    3
  );

  const taskEvacuationAmbulancePark = new EvacuationTask(
    'evacuate-title',
    LOCATION_ENUM.ambulancePark,
    [],
    StandardMaximumIdleTime
  );

  const taskEvacuationHelicopterPark = new EvacuationTask(
    'evacuate-title',
    LOCATION_ENUM.helicopterPark,
    [],
    StandardMaximumIdleTime
  );

  // Where a resource can be between two tasks : it waits there for new orders,
  // and travels there to take up its next task
  const betweenTasksLocations = [
    LOCATION_ENUM.entreeChantier,
    LOCATION_ENUM.PMA,
    LOCATION_ENUM.pcFront,
    LOCATION_ENUM.PC,
    LOCATION_ENUM.ambulancePark,
    LOCATION_ENUM.helicopterPark,
  ];

  const waitingTasks = betweenTasksLocations.map(
    location => new WaitingTask('waiting-title', location, [])
  );

  const moveToTasks = betweenTasksLocations.map(
    location => new MoveToTask('on-the-road', location, [])
  );

  return [
    ...waitingTasks,
    ...moveToTasks,
    taskPretriChantier,
    taskPretriPMA,
    taskPretriNidDeBlesses,
    taskBrancardageChantier,
    taskBrancardageNidDeBlesses,
    taskHealingNidDeBlesses,
    taskHealingChantier,
    taskHealingRed,
    taskHealingYellow,
    taskHealingGreen,
    taskEvacuationAmbulancePark,
    taskEvacuationHelicopterPark,
  ];
}