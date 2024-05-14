import { taskLogger } from '../../../tools/logger';
import { getPriorityByCategoryId } from '../../pretri/triage';
import { Actor, InterventionRole } from '../actors/actor';
import { ResourceId, TranslationKey } from '../baseTypes';
import { PatientMovedLocalEvent } from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { Resource } from '../resources/resource';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNextNonTransportedPatientsByPriority,
  getNonTransportedPatientsSize,
  getPatient,
  PatientState,
} from '../simulationState/patientState';
import { TaskBase } from './taskBase';
import * as TaskState from '../simulationState/taskStateAccess';
import { PorterSubTask } from './subTask';

// -------------------------------------------------------------------------------------------------
// Brancardage task
// -------------------------------------------------------------------------------------------------

export class PorterTask extends TaskBase<PorterSubTask> {
  private GROUP_SIZE = 2;
  private TIME_REQUIRED_FOR_TRANSPORT = 120;

  private TIME_REQUIRED_FOR_INSTRUCTION = 60;
  private TIME_REQUIRED_FOR_SELF_TRANSPORT = 60;

  private locationSource: LOCATION_ENUM = LOCATION_ENUM.chantier;

  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly feedbackAtEnd: TranslationKey,
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
      availableToRoles
    );
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>,
    location: Readonly<LOCATION_ENUM>
  ): boolean {
    return getNonTransportedPatientsSize(state, location) > 0;
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): void {
    // check if we have the capacity to do something
    if (!TaskState.hasEnoughResources(state, this)) {
      taskLogger.info('Not enough resources!');
      return;
    }

    taskLogger.debug(
      'Patients not transported before action : ',
      getNonTransportedPatientsSize(state, this.locationSource)
    );
    taskLogger.debug('Sub tasks before changes : ', JSON.stringify(Object.values(this.subTasks)));

    //1. Cleanup sub-tasks according to new allocated resources information
    this.cleanupSubTasksFromUnallocatedResources(state);

    //2. Group resources not grouped yet
    this.createNewSubTasks(state);

    //3. move patients

    const completedSubTasks: PorterSubTask[] = [];

    Object.values(this.subTasks).forEach((subTask: PorterSubTask) => {
      const patient = getPatient(state, subTask.patientId)!;

      this.subTasks[subTask.subTaskId] = {
        ...subTask,
        cumulatedTime: subTask.cumulatedTime + timeJump,
      };
      subTask.cumulatedTime += timeJump;

      if (subTask.patientCanWalk) {
        //3a. can walk
        // instruct to move
        if (subTask.cumulatedTime >= this.TIME_REQUIRED_FOR_INSTRUCTION) {
          // after instruction, the resources are available for another sub-task
          if (subTask.resources.length > 0) {
            subTask.resources = subTask.resources.splice(0, subTask.resources.length);
          }
        }

        // patient reached the target location
        if (
          subTask.cumulatedTime >=
          this.TIME_REQUIRED_FOR_INSTRUCTION + this.TIME_REQUIRED_FOR_SELF_TRANSPORT
        ) {
          localEventManager.queueLocalEvent(
            new PatientMovedLocalEvent(
              0,
              state.getSimTime(),
              this.Uid,
              patient.patientId,
              subTask.targetLocation
            )
          );

          completedSubTasks.push(subTask);
        }
      } else {
        //3b. cannot walk, handle transport
        //time-jump is enough to transport patient, so we just move it and un-assign patient
        if (subTask.cumulatedTime >= this.TIME_REQUIRED_FOR_TRANSPORT) {
          localEventManager.queueLocalEvent(
            new PatientMovedLocalEvent(
              0,
              state.getSimTime(),
              this.Uid,
              patient.patientId,
              subTask.targetLocation
            )
          );

          completedSubTasks.push(subTask);
        }
      }
    });

    for (const completedSubTask of completedSubTasks) {
      taskLogger.info('sub task is completed : ' + JSON.stringify(completedSubTask));
      delete this.subTasks[completedSubTask.subTaskId];
    }

    taskLogger.debug(
      '--- Sub tasks after changes : ',
      JSON.stringify(Object.values(this.subTasks))
    );

    taskLogger.debug(
      'Patients not transported after action: ' +
        getNonTransportedPatientsSize(state, this.locationSource)
    );

    //4. completed
    if (getNonTransportedPatientsSize(state, this.locationSource) === 0) {
      this.finaliseTask(state, this.feedbackAtEnd);
    }
  }

  private createNewSubTasks(state: Readonly<MainSimulationState>) {
    const readyResources: Resource[] = this.getResourcesReadyForNewSubTask(state);
    const alreadyInvolvedInSubTaskPatients = this.getPatientsInvolvedInSubTask();

    const readyPatients = getNextNonTransportedPatientsByPriority(
      state,
      this.locationSource,
      alreadyInvolvedInSubTaskPatients
    );

    while (readyResources.length >= this.GROUP_SIZE && readyPatients.length > 0) {
      const chosenResources: ResourceId[] = readyResources
        .splice(0, this.GROUP_SIZE)
        .map(resource => resource.Uid);
      const chosenPatient: PatientState = readyPatients.splice(0, 1)[0]!;
      const targetLocation: LOCATION_ENUM = this.computeTargetLocation(state);

      const patientCannotWalk: boolean =
        (chosenPatient.preTriageResult &&
          (getPriorityByCategoryId(chosenPatient.preTriageResult.categoryId!) === 1 ||
            getPriorityByCategoryId(chosenPatient.preTriageResult.categoryId!) === 2 ||
            !chosenPatient.preTriageResult.vitals['vitals.canWalk'])) ||
        !chosenPatient.humanBody.state.vitals.canWalk;

      const newSubTask: PorterSubTask = new PorterSubTask(
        chosenResources,
        chosenPatient.patientId,
        targetLocation,
        !patientCannotWalk
      );

      this.subTasks[newSubTask.subTaskId] = newSubTask;
    }
  }

  private computeTargetLocation(_state: Readonly<MainSimulationState>): LOCATION_ENUM {
    return LOCATION_ENUM.PMA;
    //   if (isLocationAvailable(LOCATION_ENUM.PMA)) {
    //     return LOCATION_ENUM.PMA;
    //   }
    //
    //   if (isLocationAvailable(LOCATION_ENUM.nidDeBlesses)) {
    //     return LOCATION_ENUM.nidDeBlesses;
    //   }
    //
    //   // TODO send a radio message if none is available
    //   return LOCATION_ENUM.nidDeBlesses;
  }
}
