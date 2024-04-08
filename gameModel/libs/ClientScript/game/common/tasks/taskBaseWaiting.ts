import { Actor, InterventionRole } from '../actors/actor';
import { TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { DefaultTask } from './taskBase';

/**
 * Default behaviour of a task
 */
export class WaitingTask extends DefaultTask {
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
      WaitingTask.ownerRole,
      executionLocations
    );
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return true;
  }

  protected dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void {
    //nothing to do while waiting
  }
}
