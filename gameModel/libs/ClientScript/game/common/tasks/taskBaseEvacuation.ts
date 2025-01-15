import { taskLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { InterventionRole } from '../actors/actor';
import {
  ActorId,
  GlobalEventId,
  HospitalId,
  PatientId,
  ResourceId,
  TranslationKey,
} from '../baseTypes';
import { EvacuationSquadDefinition } from '../evacuation/evacuationSquadDef';
import { formatTravelTimeToMinutes } from '../evacuation/hospitalController';
import { PatientUnitTypology } from '../evacuation/hospitalType';
import {
  AddRadioMessageLocalEvent,
  AssignResourcesToWaitingTaskLocalEvent,
  MovePatientLocalEvent,
  MoveResourcesAtArrivalLocationLocalEvent,
  MoveResourcesLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { EvacuationSubTask } from './subTask';
import { TaskBase, TaskType } from './taskBase';

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
      TaskType.Evacuation,
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
    travelTime: number,
    feedbackWhenReturning: TranslationKey,
    squadDef: EvacuationSquadDefinition
  ) {
    const newSubTask: EvacuationSubTask = new EvacuationSubTask(
      resourcesId,
      patientId,
      hospitalId,
      patientUnitAtHospital,
      doResourcesComeBack,
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
    if (subTask.doResourcesComeBack) {
      // Send radio message on CASU about time needed to come back to incident when arriving at hospital
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          subTask.parentEventId,
          state.getSimTime(),
          undefined,
          RadioLogic.getResourceAsSenderName(),
          undefined,
          subTask.feedbackWhenReturning,
          RadioType.CASU,
          false,
          [
            getTranslation(
              'mainSim-actions-tasks',
              subTask.squadDef.mainVehicleTranslationNoun,
              false
            ),
            getTranslation(
              'mainSim-actions-tasks',
              subTask.squadDef.healerPresenceTranslation,
              false
            ),
            formatTravelTimeToMinutes(subTask.travelTime),
          ]
        )
      );
    }
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
