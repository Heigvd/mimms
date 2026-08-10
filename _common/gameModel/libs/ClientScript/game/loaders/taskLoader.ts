import { LOCATION_ENUM } from '../common/simulationState/locationState';
import { HealingTask, TaskBase, TaskType } from '../common/tasks/taskBase';
import { EvacuationTask } from '../common/tasks/taskBaseEvacuation';
import { PorterTask } from '../common/tasks/taskBasePorter';
import { PreTriageTask } from '../common/tasks/taskBasePretriage';
import { WaitingTask } from '../common/tasks/taskBaseWaiting';

export function getWaitingTaskId(loadedTasks: TaskBase[], location: LOCATION_ENUM): number {
  return loadedTasks.find(t => t.taskType === TaskType.Waiting && t.location === location)!.Uid;
}

export function loadTasks(): TaskBase[] {
  const taskPretriChantier = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    LOCATION_ENUM.chantier,
    []
  );

  const taskPretriPMA = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    LOCATION_ENUM.PMA,
    []
  );

  const taskPretriNidDeBlesses = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    LOCATION_ENUM.nidDeBlesses,
    []
  );

  const taskBrancardageChantier = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-chantier-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.chantier,
    []
  );

  const taskBrancardageNidDeBlesses = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-nid-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.nidDeBlesses,
    []
  );

  const taskHealingNidDeBlesses = new HealingTask(
    'healing-title',
    'healing-desc',
    LOCATION_ENUM.nidDeBlesses,
    []
  );

  const taskHealingChantier = new HealingTask(
    'healing-title',
    'healing-desc',
    LOCATION_ENUM.chantier,
    []
  );

  const taskHealingRed = new HealingTask(
    'healing-pma-red-title',
    'healing-pma-red-desc',
    LOCATION_ENUM.PMA,
    [],
    1
  );

  const taskHealingYellow = new HealingTask(
    'healing-pma-yellow-title',
    'healing-pma-yellow-desc',
    LOCATION_ENUM.PMA,
    [],
    2
  );

  const taskHealingGreen = new HealingTask(
    'healing-pma-green-title',
    'healing-pma-green-desc',
    LOCATION_ENUM.PMA,
    [],
    3
  );

  const taskEvacuationAmbulancePark = new EvacuationTask(
    'evacuate-title',
    'evacuate-desc',
    LOCATION_ENUM.ambulancePark,
    []
  );

  const taskEvacuationHelicopterPark = new EvacuationTask(
    'evacuate-title',
    'evacuate-desc',
    LOCATION_ENUM.helicopterPark,
    []
  );

  const waitingTasks = [
    LOCATION_ENUM.entreeChantier,
    LOCATION_ENUM.PMA,
    LOCATION_ENUM.pcFront,
    LOCATION_ENUM.PC,
    LOCATION_ENUM.ambulancePark,
    LOCATION_ENUM.helicopterPark,
  ].map(location => new WaitingTask('waiting-title', 'waiting-task-desc', location, []));

  return [
    ...waitingTasks,
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