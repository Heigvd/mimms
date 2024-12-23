// -------------------------------------------------------------------------------------------------
// PreTriage
// -------------------------------------------------------------------------------------------------

import { taskLogger } from '../../../tools/logger';
import { InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import {
  AddRadioMessageLocalEvent,
  ReleaseResourcesFromTaskLocalEvent,
  TaskStatusChangeLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { doPatientAutomaticTriage } from '../patients/pretriage';
import { formatStandardPretriageReport } from '../patients/pretriageUtils';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { Resource } from '../resources/resource';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNextNonPreTriagedPatient,
  getNonPreTriagedPatientsSize,
} from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getTaskCurrentStatus } from '../simulationState/taskStateAccess';
import { TaskBase, TaskType } from './taskBase';

/**
 * Default behaviour of a task
 */
export class PreTriageTask extends TaskBase {
  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly feedbackAtEnd: TranslationKey,
    nbMinResources: number,
    nbMaxResources: number,
    ownerRole: InterventionRole,
    readonly locationSource: LOCATION_ENUM,
    availableToRoles?: InterventionRole[]
  ) {
    super(
      TaskType.Pretriage,
      title,
      description,
      nbMinResources,
      nbMaxResources,
      ownerRole,
      [locationSource],
      availableToRoles
    );
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): void {
    if (getTaskCurrentStatus(state, this.Uid) === 'Uninitialized') {
      localEventManager.queueLocalEvent(
        new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'OnGoing')
      );
    }

    taskLogger.info(
      'Patients not pretriaged before action: ' +
        getNonPreTriagedPatientsSize(state, this.locationSource)
    );
    const RESOURCE_EFFICACITY = 1;
    const TIME_REQUIRED_FOR_PATIENT_PRETRI = 60;
    ResourceState.getFreeResourcesByTask(state, this.Uid).map(resource => {
      if (
        (resource.cumulatedUnusedTime + timeJump) * RESOURCE_EFFICACITY >=
        TIME_REQUIRED_FOR_PATIENT_PRETRI
      ) {
        (resource as Resource).cumulatedUnusedTime =
          (resource.cumulatedUnusedTime + timeJump) * RESOURCE_EFFICACITY -
          TIME_REQUIRED_FOR_PATIENT_PRETRI;
        const nextPatient = getNextNonPreTriagedPatient(state, this.locationSource);
        if (nextPatient)
          nextPatient.preTriageResult = doPatientAutomaticTriage(
            nextPatient.humanBody,
            state.getSimTime()
          )!;
      } else {
        (resource as Resource).cumulatedUnusedTime += timeJump;
      }
    });

    taskLogger.info(
      'Patients not pretriaged after action: ' +
        getNonPreTriagedPatientsSize(state, this.locationSource)
    );

    if (getNonPreTriagedPatientsSize(state, this.locationSource) === 0) {
      localEventManager.queueLocalEvent(
        new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed')
      );
      localEventManager.queueLocalEvent(
        new ReleaseResourcesFromTaskLocalEvent(0, state.getSimTime(), this.Uid)
      );

      // We broadcast a message that task is completed (recipient = 0)
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          0,
          state.getSimTime(),
          undefined,
          RadioLogic.getResourceAsSenderName(),
          undefined,
          formatStandardPretriageReport(
            state,
            this.locationSource,
            'pretriage-report-task-feedback-report',
            true,
            false
          ),
          RadioType.RESOURCES,
          true
        )
      );
    }
  }
}
