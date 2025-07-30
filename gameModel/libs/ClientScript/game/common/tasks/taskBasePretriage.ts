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
import { getLocalEventManager } from '../localEvents/localEventManager';
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
      getLocalEventManager().queueLocalEvent(
        new TaskStatusChangeLocalEvent({
          parentEventId: 0,
          simTimeStamp: state.getSimTime(),
          taskId: this.Uid,
          status: 'OnGoing',
        })
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
      getLocalEventManager().queueLocalEvent(
        new TaskStatusChangeLocalEvent({
          parentEventId: 0,
          simTimeStamp: state.getSimTime(),
          taskId: this.Uid,
          status: 'Completed',
        })
      );
      getLocalEventManager().queueLocalEvent(
        new ReleaseResourcesFromTaskLocalEvent({
          parentEventId: 0,
          simTimeStamp: state.getSimTime(),
          taskId: this.Uid,
        })
      );

      // We broadcast a message that task is completed (recipient = 0)
      getLocalEventManager().queueLocalEvent(
        new AddRadioMessageLocalEvent({
          parentEventId: 0,
          simTimeStamp: state.getSimTime(),
          senderName: RadioLogic.getResourceAsSenderName(),
          message: formatStandardPretriageReport(
            state,
            this.locationSource,
            'pretriage-report-task-feedback-report',
            true,
            false
          ),
          channel: RadioType.RESOURCES,
          omitTranslation: true,
        })
      );
    }
  }
}
