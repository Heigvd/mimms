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
import { Resource } from '../resources/resource';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNextNonPreTriagedPatient,
  getNonPreTriagedPatientsSize,
  getPreTriagedAmountByTagName,
} from '../simulationState/patientState';
import { TaskBase } from './taskBase';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getTranslation } from '../../../tools/translation';
import { ActionType } from '../actionType';
import { getFixedMapEntityById, LOCATION_ENUM } from '../simulationState/locationState';

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

      //get distinct pretriage categories with count
      let result = 'Result: ';
      Object.entries(getPreTriagedAmountByTagName(state, this.locationSource)).forEach(
        ([key, value]) => {
          result += key + ': ' + value + '\n';
        }
      );

      const locationName = getFixedMapEntityById(state, this.locationSource)!.name;
      // We broadcast a message that task is completed (recipient = 0)
      localEventManager.queueLocalEvent(
        new AddRadioMessageLocalEvent(
          0,
          state.getSimTime(),
          0,
          'resources',
          `${getTranslation('mainSim-locations', locationName)} - ` +
            getTranslation('mainSim-actions-tasks', this.feedbackAtEnd) +
            '\n' +
            result,
          ActionType.RESOURCES_RADIO,
          false,
          true
        )
      );
    }
  }
}
