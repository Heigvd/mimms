import { InterventionRole } from '../actors/actor';
import { ResourceId, TranslationKey } from '../baseTypes';
import { UnlimitedMaximumIdleTime } from '../constants';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase, TaskType } from './taskBase';

/**
 * Pseudo-task when the resource is waiting for another task
 */
export class WaitingTask extends TaskBase {
  public constructor(
    title: TranslationKey,
    location: LOCATION_ENUM,
    availableToRoles?: InterventionRole[]
  ) {
    super(TaskType.Waiting, title, location, availableToRoles, true, UnlimitedMaximumIdleTime);
  }

  protected override dispatchInProgressEvents(
    _state: Readonly<MainSimulationState>,
    _timeJump: number
  ): ResourceId[] {
    //nothing to do while waiting
    return [];
  }
}
