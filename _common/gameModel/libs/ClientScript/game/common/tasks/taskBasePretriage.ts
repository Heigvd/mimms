// -------------------------------------------------------------------------------------------------
// PreTriage
// -------------------------------------------------------------------------------------------------

import { taskLogger } from '../../../tools/logger';
import { InterventionRole } from '../actors/actor';
import { ResourceId, TranslationKey } from '../baseTypes';
import { doPatientAutomaticTriage } from '../patients/pretriage';
import { Resource } from '../resources/resource';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNextNonPreTriagedPatient,
  getNonPreTriagedPatientsSize,
} from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { TaskBase, TaskType } from './taskBase';

const TIME_REQUIRED_FOR_PATIENT_PRETRI = 60;

/**
 * Default behaviour of a task
 */
export class PreTriageTask extends TaskBase {
  public constructor(
    title: TranslationKey,
    readonly locationSource: LOCATION_ENUM,
    availableToRoles?: InterventionRole[],
    maximumIdleTime?: number
  ) {
    super(TaskType.Pretriage, title, locationSource, availableToRoles, true, maximumIdleTime);
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): ResourceId[] {
    taskLogger.info(
      'Patients not pretriaged before action: ' +
        getNonPreTriagedPatientsSize(state, this.locationSource)
    );

    const workingResourcesId: ResourceId[] = [];

    ResourceState.getFreeResourcesByTask(state, this.Uid).forEach((resource: Resource) => {
      if (getNonPreTriagedPatientsSize(state, this.locationSource) === 0) {
        // there is no one left to pretriage, the resource has nothing to do
        return;
      }

      workingResourcesId.push(resource.Uid);

      resource.carryoverWorkTime += timeJump;

      if (resource.carryoverWorkTime >= TIME_REQUIRED_FOR_PATIENT_PRETRI) {
        resource.carryoverWorkTime -= TIME_REQUIRED_FOR_PATIENT_PRETRI;

        const nextPatient = getNextNonPreTriagedPatient(state, this.locationSource);
        if (nextPatient)
          nextPatient.preTriageResult = doPatientAutomaticTriage(
            nextPatient.humanBody,
            state.getSimTime()
          )!;
      }
    });

    taskLogger.info(
      'Patients not pretriaged after action: ' +
        getNonPreTriagedPatientsSize(state, this.locationSource)
    );

    return workingResourcesId;
  }
}
