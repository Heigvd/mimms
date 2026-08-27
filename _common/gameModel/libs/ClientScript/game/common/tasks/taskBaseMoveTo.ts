import { InterventionRole } from '../actors/actor';
import { ResourceId, TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase, TaskType } from './taskBase';

/**
 * Task for when a resource is transferred
 */
export class MoveToTask extends TaskBase {
  public constructor(
    title: TranslationKey,
    /** destination location */
    location: LOCATION_ENUM,
    availableToRoles?: InterventionRole[]
  ) {
    super(TaskType.MoveTo, title, location, availableToRoles, false);
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    _timeJump: number
  ): ResourceId[] {
    return this.getAllocatedResourcesId(state);
  }
}
