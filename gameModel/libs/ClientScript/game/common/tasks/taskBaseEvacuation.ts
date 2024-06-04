import { taskLogger } from '../../../tools/logger';
import { InterventionRole } from '../actors/actor';
import { GlobalEventId, HospitalId, PatientId, ResourceId, TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase } from './taskBase';
import { EvacuationSubTask } from './subTask';
import { localEventManager } from '../localEvents/localEventManager';
import {
  MovePatientLocalEvent,
  MoveResourcesLocalEvent,
  ResourceAllocationLocalEvent,
} from '../localEvents/localEventBase';
import { PatientUnitTypology } from '../evacuation/hospitalType';
import { getIdleTaskUid } from './taskLogic';
import { Resource } from '../resources/resource';
import resourceArrivalResolution from '../resources/resourceDispatchResolution';
import * as ResourceState from '../simulationState/resourceStateAccess';

// -------------------------------------------------------------------------------------------------
// Evacuation task
// -------------------------------------------------------------------------------------------------

export class EvacuationTask extends TaskBase<EvacuationSubTask> {
  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    nbMinResources: number,
    nbMaxResources: number,
    ownerRole: InterventionRole,
    availableToLocations: LOCATION_ENUM[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      nbMinResources,
      nbMaxResources,
      ownerRole,
      availableToLocations,
      availableToRoles,
      false
    );
  }

  public createSubTask(
    parentEventId: GlobalEventId,
    resourcesId: ResourceId[],
    patientId: PatientId,
    hospitalId: HospitalId,
    patientUnitAtHospital: PatientUnitTypology,
    doResourcesComeBack: boolean,
    travelTime: number
  ) {
    const newSubTask: EvacuationSubTask = new EvacuationSubTask(
      resourcesId,
      patientId,
      hospitalId,
      patientUnitAtHospital,
      doResourcesComeBack,
      parentEventId,
      travelTime
    );

    this.subTasks[newSubTask.subTaskId] = newSubTask;
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): void {
    taskLogger.debug('evacuation task');

    taskLogger.debug('Sub tasks before changes : ', JSON.stringify(Object.values(this.subTasks)));

    // 1. Cleanup sub-tasks according to new allocated resources information
    this.cleanupSubTasksFromUnallocatedResources(state);

    Object.values(this.subTasks).forEach((subTask: EvacuationSubTask) => {
      subTask.cumulatedTime += timeJump;

      if (subTask.status === 'started') {
        this.launchEventsAtStartTime(state, subTask);
        subTask.status = 'way_to_hospital';
      }

      if (subTask.status === 'way_to_hospital' && subTask.cumulatedTime > subTask.travelTime) {
        subTask.cumulatedTime -= subTask.travelTime;

        this.launchEventsWhenArriveAtHospital(state, subTask);

        if (subTask.doResourcesComeBack) {
          subTask.status = 'way_back';
        } else {
          subTask.status = 'completed';
        }
      }

      if (subTask.status === 'way_back' && subTask.cumulatedTime > subTask.travelTime) {
        subTask.cumulatedTime -= subTask.travelTime;

        this.launchEventsWhenResourcesComeBack(state, subTask);

        subTask.status = 'completed';
      }

      this.subTasks[subTask.subTaskId] = { ...subTask };

      if (subTask.status === 'completed') {
        delete this.subTasks[subTask.subTaskId];
      }
    });

    taskLogger.debug('Sub tasks after changes : ', JSON.stringify(Object.values(this.subTasks)));
  }

  private launchEventsAtStartTime(
    state: Readonly<MainSimulationState>,
    subTask: EvacuationSubTask
  ) {
    localEventManager.queueLocalEvent(
      new MovePatientLocalEvent(subTask.parentEventId, state.getSimTime(), subTask.patientId, {
        kind: 'FixedMapEntity',
        locationId: LOCATION_ENUM.remote,
      })
    );

    localEventManager.queueLocalEvent(
      new MoveResourcesLocalEvent(
        subTask.parentEventId,
        state.getSimTime(),
        subTask.resources,
        LOCATION_ENUM.remote
      )
    );
  }

  private launchEventsWhenArriveAtHospital(
    state: Readonly<MainSimulationState>,
    subTask: EvacuationSubTask
  ) {
    localEventManager.queueLocalEvent(
      new MovePatientLocalEvent(subTask.parentEventId, state.getSimTime(), subTask.patientId, {
        kind: 'Hospital',
        locationId: subTask.hospitalId,
        patientUnit: subTask.patientUnitAtHospital,
      })
    );
  }

  private launchEventsWhenResourcesComeBack(
    state: Readonly<MainSimulationState>,
    subTask: EvacuationSubTask
  ) {
    subTask.resources.forEach((resourceId: ResourceId) => {
      const resource: Resource = ResourceState.getResourceById(state, resourceId);

      localEventManager.queueLocalEvent(
        new MoveResourcesLocalEvent(
          subTask.parentEventId,
          state.getSimTime(),
          [resource.Uid],
          resourceArrivalResolution(state, resource.type)
        )
      );

      localEventManager.queueLocalEvent(
        new ResourceAllocationLocalEvent(
          subTask.parentEventId,
          state.getSimTime(),
          resource.Uid,
          getIdleTaskUid(state)
        )
      );
    });
  }
}
