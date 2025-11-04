import { getWaitingTaskId, loadTasks } from './taskLoader';
import { getCurrentGameOptions } from '../common/gameOptions';
import { Resource } from '../common/resources/resource';
import { LOCATION_ENUM } from '../common/simulationState/locationState';
import { MainSimulationState } from '../common/simulationState/mainSimulationState';
import { Actor } from '../common/actors/actor';
import { notifyMainStateInitializationComplete } from '../executionContext/gameExecutionContextController';
import { loadResourceContainersConfiguration } from './resourceLoader';
import { loadPatients } from './patientsLoader';
import { buildActivables } from './activableLoader';
import {
  LocalEventBase,
  T0TriggerEvaluationLocalEvent,
} from '../common/localEvents/localEventBase';

let singletonStartState: MainSimulationState;

export function getStartingMainState(): MainSimulationState {
  if (!singletonStartState) {
    singletonStartState = buildStartingMainState();
    notifyMainStateInitializationComplete();
  }
  return Helpers.cloneDeep(singletonStartState);
}

function buildStartingMainState(): MainSimulationState {
  const testAL = new Actor('AL', LOCATION_ENUM.chantier);
  const testCASU = new Actor('CASU', LOCATION_ENUM.remote);

  const tasks = loadTasks();
  const waitingTaskId = getWaitingTaskId(tasks);
  const initialResources = [new Resource('ambulancier', LOCATION_ENUM.chantier, waitingTaskId)];

  // TODO run triggers at T = 0 (a dedicated local event seems reasonable)
  return new MainSimulationState(
    {
      simulationTimeSec: 0,
      actions: [],
      cancelledActions: [],
      actors: [testAL, testCASU],
      patients: loadPatients(),
      tasks: tasks,
      radioMessages: [],
      resources: initialResources,
      resourceContainers: loadResourceContainersConfiguration(),
      flags: {},
      hospital: {},
      gameOptions: getCurrentGameOptions(),
      activables: buildActivables(),
    },
    0
  );
}

/**
 * Returns an empty state that cannot be updated
 * Mainly here for after script save reasons, to avoid rerender errors
 */
export function shallowState(): MainSimulationState {
  return new MainSimulationState(
    {
      simulationTimeSec: 0,
      actions: [],
      cancelledActions: [],
      actors: [],
      patients: [],
      tasks: [],
      radioMessages: [],
      resources: [],
      resourceContainers: [],
      flags: {},
      hospital: {},
      gameOptions: { respectHierarchy: true },
      activables: {},
    },
    -1 // impossible state id : make sure no event can be applied on that state
  );
}

/**
 * Returns events that should be evaluated on a newly built state
 */
export function getStartingLocalEvents(): LocalEventBase[] {
  return [new T0TriggerEvaluationLocalEvent()];
}
