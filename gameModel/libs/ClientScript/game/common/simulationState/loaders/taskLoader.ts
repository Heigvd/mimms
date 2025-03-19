import { LOCATION_ENUM } from '../../simulationState/locationState';
import { HealingTask, TaskBase } from '../../tasks/taskBase';
import { EvacuationTask } from '../../tasks/taskBaseEvacuation';
import { PorterTask } from '../../tasks/taskBasePorter';
import { PreTriageTask } from '../../tasks/taskBasePretriage';
import { WaitingTask } from '../../tasks/taskBaseWaiting';

export function loadTasks(): TaskBase[] {
  const taskPretriChantier = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.chantier,
    []
  );

  const taskPretriPMA = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.PMA,
    []
  );

  const taskPretriNidDeBlesses = new PreTriageTask(
    'pre-tri-title',
    'pre-tri-desc',
    'pretriage-task-completed',
    1,
    5,
    'AL',
    LOCATION_ENUM.nidDeBlesses,
    []
  );

  const taskBrancardageChantier = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-chantier-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.chantier,
    2,
    100,
    'AL',
    []
  );

  const taskBrancardageNidDeBlesses = new PorterTask(
    'brancardage-title',
    'porter-desc',
    'porters-task-nid-completed',
    'porters-task-no-target-location',
    LOCATION_ENUM.nidDeBlesses,
    2,
    100,
    'AL',
    []
  );

  const taskHealing = new HealingTask(
    'healing-title',
    'healing-desc',
    1,
    100,
    'AL',
    [LOCATION_ENUM.nidDeBlesses, LOCATION_ENUM.chantier],
    []
  );

  const taskHealingRed = new HealingTask(
    'healing-pma-red-title',
    'healing-pma-red-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    1
  );

  const taskHealingYellow = new HealingTask(
    'healing-pma-yellow-title',
    'healing-pma-yellow-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    2
  );

  const taskHealingGreen = new HealingTask(
    'healing-pma-green-title',
    'healing-pma-green-desc',
    1,
    100,
    'LEADPMA',
    [LOCATION_ENUM.PMA],
    [],
    3
  );

  const taskEvacuation = new EvacuationTask(
    'evacuate-title',
    'evacuate-desc',
    1,
    100000,
    'EVASAN',
    [LOCATION_ENUM.ambulancePark, LOCATION_ENUM.helicopterPark],
    []
  );

  const taskWaiting = new WaitingTask(
    'waiting-title',
    'waiting-task-desc',
    1,
    10000,
    'AL',
    [
      LOCATION_ENUM.chantier,
      LOCATION_ENUM.PMA,
      LOCATION_ENUM.pcFront,
      LOCATION_ENUM.PC,
      LOCATION_ENUM.ambulancePark,
      LOCATION_ENUM.helicopterPark,
    ],
    []
  );
  return [
    taskWaiting,
    taskPretriChantier,
    taskPretriPMA,
    taskPretriNidDeBlesses,
    taskBrancardageChantier,
    taskBrancardageNidDeBlesses,
    taskHealing,
    taskHealingRed,
    taskHealingYellow,
    taskHealingGreen,
    taskEvacuation,
  ];
}
