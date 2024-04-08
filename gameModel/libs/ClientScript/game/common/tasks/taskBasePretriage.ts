// -------------------------------------------------------------------------------------------------
// PreTriage
// -------------------------------------------------------------------------------------------------

import { taskLogger } from '../../../tools/logger';
import { Actor, InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import {
  AddRadioMessageLocalEvent,
  AllResourcesReleaseLocalEvent,
  TaskStatusChangeLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { doPatientAutomaticTriage } from '../patients/pretriage';
import { Resource } from '../resources/resource';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNextNonPreTriagedPatient,
  getNonPreTriagedPatientsSize,
  getPreTriagedAmountByCategory,
} from '../simulationState/patientState';
import { DefaultTask } from './taskBase';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { getTranslation } from '../../../tools/translation';
import { ActionType } from '../actionType';
import { LOCATION_ENUM } from '../simulationState/locationState';

/**
 * Default behaviour of a task
 */
export class PreTriageTask extends DefaultTask {
  public static ownerRole: InterventionRole = 'AL';

  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    nbMinResources: number,
    nbMaxResources: number,
    readonly feedbackAtEnd: TranslationKey,
    executionLocations: LOCATION_ENUM[]
  ) {
    super(
      title,
      description,
      nbMinResources,
      nbMaxResources,
      PreTriageTask.ownerRole,
      executionLocations
    );
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    //return state.areZonesAlreadyDefined();
    return getNonPreTriagedPatientsSize(state) > 0;
  }

  protected dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void {
    // check if we have the capacity to do something
    if (!TaskState.hasEnoughResources(state, this)) {
      taskLogger.info('Not enough resources!');
      return;
    }
    taskLogger.info(
      'Patients not pretriaged before action: ' + getNonPreTriagedPatientsSize(state)
    );
    const RESOURCE_EFFICACITY = 1;
    const TIME_REQUIRED_FOR_PATIENT_PRETRI = 60;
    ResourceState.getAllocatedResourcesAnyKind(state, this.Uid).map(resource => {
      if (
        (resource.cumulatedUnusedTime + timeJump) * RESOURCE_EFFICACITY >=
        TIME_REQUIRED_FOR_PATIENT_PRETRI
      ) {
        (resource as Resource).cumulatedUnusedTime =
          (resource.cumulatedUnusedTime + timeJump) * RESOURCE_EFFICACITY -
          TIME_REQUIRED_FOR_PATIENT_PRETRI;
        const nextPatient = getNextNonPreTriagedPatient(state);
        if (nextPatient)
          nextPatient.preTriageResult = doPatientAutomaticTriage(
            nextPatient.humanBody,
            state.getSimTime()
          )!;
      } else {
        (resource as Resource).cumulatedUnusedTime += timeJump;
      }
    });

    taskLogger.info('Patients not pretriaged after action: ' + getNonPreTriagedPatientsSize(state));

    if (getNonPreTriagedPatientsSize(state) === 0) {
      localEventManager.queueLocalEvent(
        new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed')
      );
      localEventManager.queueLocalEvent(
        new AllResourcesReleaseLocalEvent(0, state.getSimTime(), this.Uid)
      );

      //get distinct pretriage categories with count
      let result = 'Result: ';
      Object.entries(getPreTriagedAmountByCategory(state)).forEach(([key, value]) => {
        result += key + ': ' + value + '\n';
      });

      // We broadcast a message that task is completed (recipient = 0)
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          0,
          state.getSimTime(),
          0,
          'resources',
          getTranslation('mainSim-actions-tasks', this.feedbackAtEnd) + '\n' + result,
          ActionType.RESOURCES_RADIO,
          false,
          true
        )
      );
    }
  }
}
