import { taskLogger } from '../../../tools/logger';
import { InterventionRole } from '../actors/actor';
import {
  ActorId,
  GlobalEventId,
  HospitalId,
  PatientId,
  ResourceId,
  TranslationKey,
} from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase } from './taskBase';
import { EvacuationSubTask } from './subTask';
import { localEventManager } from '../localEvents/localEventManager';
import {
  AssignResourcesToWaitingTaskLocalEvent,
  MovePatientLocalEvent,
  MoveResourcesAtArrivalLocationLocalEvent,
  MoveResourcesLocalEvent,
} from '../localEvents/localEventBase';
import { PatientUnitTypology } from '../evacuation/hospitalType';

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
    ownerId: ActorId,
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
      ownerId,
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

    // no need to clean up sub-tasks from unallocated resources
    // we cannot unallocate an evacuation resource

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
        subTask.ownerId,
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
    localEventManager.queueLocalEvent(
      new MoveResourcesAtArrivalLocationLocalEvent(
        subTask.parentEventId,
        state.getSimTime(),
        subTask.resources
      )
    );

    localEventManager.queueLocalEvent(
      new AssignResourcesToWaitingTaskLocalEvent(
        subTask.parentEventId,
        state.getSimTime(),
        subTask.resources
      )
    );
  }
}
