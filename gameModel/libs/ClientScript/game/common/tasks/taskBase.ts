import { taskLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { Actor, InterventionRole } from '../actors/actor';
import { TaskId, TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as TaskState from '../simulationState/taskStateAccess';

/** The statuses represent the steps of a task evolution */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled';

const baseSeed = 4000;

// -------------------------------------------------------------------------------------------------
// Base
// -------------------------------------------------------------------------------------------------

/**
 * Base class for a task
 */
export abstract class TaskBase {
  private static IdSeed = baseSeed;
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  protected constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey, // currently not used
    readonly nbMinResources: number,
    readonly nbMaxResources: number, // currently not used
    /** the actor role owner of the task */
    readonly ownerRole: InterventionRole,
    /** the locations where the task can take place */
    readonly availableToLocations: LOCATION_ENUM[] = [],
    /** which roles can order the task */
    readonly availableToRoles: InterventionRole[] = []
  ) {
    this.Uid = TaskBase.IdSeed++;
    this.status = 'Uninitialized';
  }

  static resetIdSeed() {
    this.IdSeed = baseSeed;
  }

  /** Its short name */
  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  /** Its description to give more details */
  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  // TODO to be refined with types
  /** The minimum resources needed for the task to be performed */
  public getNbMinResources(): number {
    return this.nbMinResources;
  }

  // TODO to be refined with types
  /** The maximum useful resources. More would be useless */
  public getNbMaxResources(): number {
    return this.nbMaxResources;
  }

  /** The status represents its step of evolution */
  public getStatus(): TaskStatus {
    return this.status;
  }

  // FIXME : can it really be done here ? Or should we localEventManager.queueLocalEvent(..)
  public setStatus(status: TaskStatus): void {
    this.status = status;
  }

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  // TODO see where it can go
  // Note : based on cancel method on actionBase
  public cancel(): boolean {
    if (this.status === 'Cancelled') {
      taskLogger.warn('This action was cancelled already');
    } else if (this.status === 'Completed') {
      taskLogger.error('This action is completed, it cannot be cancelled');
      return false;
    }

    // TODO some way ResourceState.releaseAllResources(state, this);
    this.setStatus('Cancelled');
    return true;
  }

  /** Is the task ready for an actor to allocate resources to start it. */
  public isAvailable(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>,
    location: Readonly<LOCATION_ENUM>
  ): boolean {
    return (
      this.isRoleWiseAvailable(actor.Role) &&
      this.isLocationWiseAvailable(location) &&
      this.isAvailableCustom(state, actor, location)
    );
  }

  protected isRoleWiseAvailable(role: InterventionRole): boolean {
    if (!this.availableToRoles || this.availableToRoles.length === 0) {
      return true;
    }

    return this.availableToRoles.includes(role);
  }

  protected isLocationWiseAvailable(location: LOCATION_ENUM): boolean {
    if (!this.availableToLocations || this.availableToLocations.length === 0) {
      return true;
    }

    return this.availableToLocations.includes(location);
  }

  /**
   * Override adds additional conditions for this task availability
   *
   * @param _state
   * @param _actor
   * @param _location
   *
   * @see isAvailable
   */
  // to override when needed
  protected isAvailableCustom(
    _state: Readonly<MainSimulationState>,
    _actor: Readonly<Actor>,
    _location: Readonly<LOCATION_ENUM>
  ): boolean {
    return true;
  }

  /** Update the state */
  public update(state: Readonly<MainSimulationState>, timeJump: number): void {
    const enoughResources = TaskState.hasEnoughResources(state, this);

    switch (this.status) {
      case 'Cancelled':
      case 'Completed': {
        taskLogger.debug('no more evolution when the task is cancelled or completed');

        // no more evolution
        break;
      }

      case 'Uninitialized': {
        if (enoughResources) {
          taskLogger.debug('task status : Uninitialized -> OnGoing');

          this.status = 'OnGoing';
          this.dispatchInProgressEvents(state, timeJump);
        }

        // no evolution if not enough resources

        break;
      }

      case 'OnGoing': {
        if (enoughResources) {
          taskLogger.debug('task : dispatch local events to update the state');

          this.dispatchInProgressEvents(state, timeJump);
        } else {
          taskLogger.debug('task status : OnGoing -> Paused');

          this.status = 'Paused';
        }
        break;
      }

      case 'Paused': {
        if (enoughResources) {
          taskLogger.debug('task status : Paused -> OnGoing');

          this.status = 'OnGoing';
          this.dispatchInProgressEvents(state, timeJump);
        }
        break;
      }

      default: {
        taskLogger.error('Undefined status. Cannot update task');

        break;
      }
    }
  }

  protected abstract dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): void;
}
