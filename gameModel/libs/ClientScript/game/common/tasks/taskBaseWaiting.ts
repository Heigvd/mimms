import { InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskBase } from './taskBase';

/**
 * Pseudo-task when the resource is waiting for another task
 */
export class WaitingTask extends TaskBase {
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
      title,
      description,
      nbMinResources,
      nbMaxResources,
      ownerRole,
      availableToLocations,
      availableToRoles
    );
  }

  protected override dispatchInProgressEvents(
    _state: Readonly<MainSimulationState>,
    _timeJump: number
  ): void {
    //nothing to do while waiting
  }
}
