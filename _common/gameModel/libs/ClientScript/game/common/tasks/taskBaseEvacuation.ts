import { taskLogger } from '../../../tools/logger';
import { Actor, InterventionRole } from '../actors/actor';
import {
  ActorId,
  GlobalEventId,
  HospitalId,
  PatientId,
  PatientUnitId,
  ResourceId,
  TranslationKey,
} from '../baseTypes';
import { EvacuationSquadDefinition } from '../evacuation/evacuationSquadDef';
import { MovePatientLocalEvent } from '../localEvents/localEventBase';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { EvacuationSubTask } from './subTask';
import { TaskBase, TaskType } from './taskBase';
import { MoveResourcesLocalEvent } from '../localEvents/localEventResources';

// -------------------------------------------------------------------------------------------------
// Evacuation task
// -------------------------------------------------------------------------------------------------

export class EvacuationTask extends TaskBase<EvacuationSubTask> {
  public constructor(
    title: TranslationKey,
    location: LOCATION_ENUM,
    availableToRoles?: InterventionRole[],
    maximumIdleTime?: number
  ) {
    super(TaskType.Evacuation, title, location, availableToRoles, maximumIdleTime);
  }

  /**
   * Resources engaged in an evacuation cannot be taken off it.
   *
   * @see dispatchInProgressEvents
   */
  protected override isAvailableCustom(
    _state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>,
    _location: Readonly<LOCATION_ENUM>
  ): boolean {
    return false;
  }

  public createSubTask(
    parentEventId: GlobalEventId,
    ownerId: ActorId,
    resourcesId: ResourceId[],
    patientId: PatientId,
    hospitalId: HospitalId,
    patientUnitId: PatientUnitId,
    travelTime: number,
    feedbackWhenReturning: TranslationKey,
    squadDef: EvacuationSquadDefinition
  ) {
    const newSubTask: EvacuationSubTask = new EvacuationSubTask(
      resourcesId,
      patientId,
      hospitalId,
      patientUnitId,
      parentEventId,
      ownerId,
      travelTime,
      feedbackWhenReturning,
      squadDef
    );

    this.subTasks[newSubTask.subTaskId] = newSubTask;
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): ResourceId[] {
    taskLogger.debug('evacuation task');

    taskLogger.debug('Sub tasks before changes : ', JSON.stringify(Object.values(this.subTasks)));

    // no need to clean up sub-tasks from unallocated resources
    // we cannot unallocate an evacuation resource

    // the resources involved in a sub-task are the ones that are able to work during the time slice
    const workingResourcesId: ResourceId[] = Object.values(this.subTasks).flatMap(
      (subTask: EvacuationSubTask) => subTask.resources
    );

    Object.values(this.subTasks).forEach((subTask: EvacuationSubTask) => {
      subTask.cumulatedTime += timeJump;

      if (subTask.status === 'started') {
        this.launchEventsAtStartTime(state, subTask);
        subTask.status = 'way_to_hospital';
      }

      if (subTask.status === 'way_to_hospital' && subTask.cumulatedTime > subTask.travelTime) {
        subTask.cumulatedTime -= subTask.travelTime;

        this.launchEventsWhenArriveAtHospital(state, subTask);

        subTask.status = 'completed';
      }

      if (subTask.status === 'completed') {
        delete this.subTasks[subTask.subTaskId];
      }
    });

    taskLogger.debug('Sub tasks after changes : ', JSON.stringify(Object.values(this.subTasks)));

    return workingResourcesId;
  }

  private launchEventsAtStartTime(
    state: Readonly<MainSimulationState>,
    subTask: EvacuationSubTask
  ) {
    getLocalEventManager().queueLocalEvent(
      new MovePatientLocalEvent({
        parentEventId: subTask.parentEventId,
        source: { type: 'task', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        patientId: subTask.patientId,
        location: {
          kind: 'FixedMapEntity',
          locationId: LOCATION_ENUM.remote,
        },
      })
    );

    getLocalEventManager().queueLocalEvent(
      new MoveResourcesLocalEvent({
        parentEventId: subTask.parentEventId,
        source: { type: 'task', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        ownerUid: subTask.ownerId,
        resourcesId: subTask.resources,
        targetLocation: LOCATION_ENUM.remote,
      })
    );
  }

  private launchEventsWhenArriveAtHospital(
    state: Readonly<MainSimulationState>,
    subTask: EvacuationSubTask
  ) {
    getLocalEventManager().queueLocalEvent(
      new MovePatientLocalEvent({
        parentEventId: subTask.parentEventId,
        source: { type: 'task', id: this.Uid },
        simTimeStamp: state.getSimTime(),
        patientId: subTask.patientId,
        location: {
          kind: 'Hospital',
          locationId: subTask.hospitalId,
          patientUnit: subTask.patientUnitId,
        },
      })
    );

    // The resources stay allocated to the evacuation task. As they have nothing to do anymore,
    // they cumulate idle time and eventually go back to get new orders.
    // @see TaskBase.update
  }
}
