import { getWaitingTaskId, loadTasks } from '../../simulationState/loaders/taskLoader';
import {
  BuildingStatus,
  GeometryBasedFixedMapEntity,
  PointGeometricalShape,
} from '../../events/defineMapObjectEvent';
import { getCurrentGameOptions } from '../../gameOptions';
import { Resource } from '../../resources/resource';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { Actor } from '../../actors/actor';
import { notifyMainStateInitializationComplete } from '../../../gameExecutionContextController';
import { loadEmergencyResourceContainers } from '../../simulationState/loaders/resourceLoader';
import { loadPatients } from '../../simulationState/loaders/patientsLoader';

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

  const mainAccident = new GeometryBasedFixedMapEntity(
    0,
    'location-chantier',
    LOCATION_ENUM.chantier,
    [],
    new PointGeometricalShape([[2500100, 1118500]], [2500100, 1118500]),
    BuildingStatus.ready,
    'mainAccident'
  );

  const tasks = loadTasks();
  const waitingTaskId = getWaitingTaskId(tasks);
  const initialResources = [new Resource('ambulancier', LOCATION_ENUM.chantier, waitingTaskId)];

  return new MainSimulationState(
    {
      simulationTimeSec: 0,
      actions: [],
      cancelledActions: [],
      actors: [testAL, testCASU],
      mapLocations: [mainAccident],
      patients: loadPatients(),
      tasks: tasks,
      radioMessages: [],
      resources: initialResources,
      resourceContainers: loadEmergencyResourceContainers(),
      flags: {},
      hospital: {},
      gameOptions: getCurrentGameOptions(),
    },
    0
  );
}

export function shallowState(): MainSimulationState {
  return new MainSimulationState(
    {
      simulationTimeSec: 0,
      actions: [],
      cancelledActions: [],
      actors: [],
      mapLocations: [],
      patients: [],
      tasks: [],
      radioMessages: [],
      resources: [],
      resourceContainers: [],
      flags: {},
      hospital: {},
      gameOptions: { respectHierarchy: true },
    },
    -1
  );
}
