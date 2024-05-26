import { taskLogger } from '../../../tools/logger';
import { getPriorityByCategoryId } from '../../pretri/triage';
import { Actor, InterventionRole } from '../actors/actor';
import { ResourceId, TranslationKey } from '../baseTypes';
import { AddRadioMessageLocalEvent, MovePatientLocalEvent } from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { Resource } from '../resources/resource';
import { isLocationAvailableForPatients, LOCATION_ENUM } from '../simulationState/locationState';
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
import { getTranslation } from '../../../tools/translation';
import { ActionType } from '../actionType';

// -------------------------------------------------------------------------------------------------
// Brancardage task
// -------------------------------------------------------------------------------------------------

export class PorterTask extends TaskBase<PorterSubTask> {
  private GROUP_SIZE = 2;
  private TIME_REQUIRED_FOR_TRANSPORT = 120;

  private TIME_REQUIRED_FOR_INSTRUCTION = 60;
  private TIME_REQUIRED_FOR_SELF_TRANSPORT = 60;

  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly feedbackWhenDone: TranslationKey,
    readonly feedbackIfNoTargetLocation: TranslationKey,
    readonly locationSource: LOCATION_ENUM,
    nbMinResources: number,
    nbMaxResources: number,
    ownerRole: InterventionRole,
    availableToRoles?: InterventionRole[]
  ) {
    super(
      title,
      description,
      nbMinResources,
      nbMaxResources,
      ownerRole,
      [locationSource],
      availableToRoles
    );
  }

  /** Its short name */
  public getFeedbackWhenDone(): string {
    return getTranslation('mainSim-actions-tasks', this.feedbackWhenDone);
  }

  public getFeedbackIfNoTargetLocation(): string {
    return getTranslation('mainSim-actions-tasks', this.feedbackIfNoTargetLocation);
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>,
    location: Readonly<LOCATION_ENUM>
  ): boolean {
    return (
      // we allow the player to assign resources even if there is no work to do
      // but there must be a place to bring them to
      this.computeTargetLocation(state, this.locationSource) != undefined
    );
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): void {
    taskLogger.info('brancardage from ', this.locationSource);

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
            new MovePatientLocalEvent(0, state.getSimTime(), patient.patientId, {
              kind: 'FixedMapEntity',
              locationId: subTask.targetLocation,
            })
          );

          completedSubTasks.push(subTask);
        }
      } else {
        //3b. cannot walk, handle transport
        //time-jump is enough to transport patient, so we just move it and un-assign patient
        if (subTask.cumulatedTime >= this.TIME_REQUIRED_FOR_TRANSPORT) {
          localEventManager.queueLocalEvent(
            new MovePatientLocalEvent(0, state.getSimTime(), patient.patientId, {
              kind: 'FixedMapEntity',
              locationId: LOCATION_ENUM.PMA,
            })
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
    if (this.isCompleted(state)) {
      this.finaliseTask(state, this.getFeedbackWhenDone());
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

    const targetLocation: LOCATION_ENUM | undefined = this.computeTargetLocation(
      state,
      this.locationSource
    );

    if (targetLocation == undefined) {
      taskLogger.warn('nowhere to send patients');

      // We broadcast a message when the task is completed
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          0,
          state.getSimTime(),
          0,
          'resources',
          this.getFeedbackIfNoTargetLocation(),
          ActionType.RESOURCES_RADIO,
          undefined,
          true
        )
      );
    }

    while (
      targetLocation != undefined &&
      readyResources.length >= this.GROUP_SIZE &&
      readyPatients.length > 0
    ) {
      const chosenResources: ResourceId[] = readyResources
        .splice(0, this.GROUP_SIZE)
        .map(resource => resource.Uid);
      const chosenPatient: PatientState = readyPatients.splice(0, 1)[0]!;

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

  private computeTargetLocation(
    state: Readonly<MainSimulationState>,
    locationSource: LOCATION_ENUM
  ): LOCATION_ENUM | undefined {
    if (isLocationAvailableForPatients(state, LOCATION_ENUM.PMA)) {
      return LOCATION_ENUM.PMA;
    }

    if (
      locationSource != LOCATION_ENUM.nidDeBlesses &&
      isLocationAvailableForPatients(state, LOCATION_ENUM.nidDeBlesses)
    ) {
      return LOCATION_ENUM.nidDeBlesses;
    }

    return undefined;
  }

  private isCompleted(state: Readonly<MainSimulationState>): boolean {
    return (
      getNonTransportedPatientsSize(state, this.locationSource) === 0 &&
      !TaskState.isBrancardageTaskForTargetLocation(state, this.locationSource)
    );
  }
}
