import { taskLogger } from "../../../tools/logger";
import { getTranslation } from "../../../tools/translation";
import { Actor, InterventionRole } from "../actors/actor";
import { SimTime, TaskId, TranslationKey } from "../baseTypes";
import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as TaskState from "../simulationState/taskStateAccess";


/** The statuses represent the steps of a task evolution */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled';

// -------------------------------------------------------------------------------------------------
// Base
// -------------------------------------------------------------------------------------------------

/**
 * Base class for a task
 */
export abstract class TaskBase {

  private static IdSeed = 1000;
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number,
	readonly ownerRole: InterventionRole,
    readonly executionLocations: LOCATION_ENUM[]) {
    this.Uid = TaskBase.IdSeed++;
    this.status = 'Uninitialized';
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
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
  // Note : based on cancel method on ationBase
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      taskLogger.warn('This action was cancelled already');

    } else if(this.status === 'Completed') {
      taskLogger.error('This action is completed, it cannot be cancelled');
      return false;
    }

    // TODO some way ResourceState.releaseAllResources(state, this);
    this.setStatus('Cancelled');
    return true;
  }

  /** Is the task ready for an actor to allocate resources to start it. Aka can the actor see it to allocate resources. */
  public abstract isAvailable(state : Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean;

  /** Update the state */
  public abstract update(state: Readonly<MainSimulationState>, timeJump: number): void;

}

// -------------------------------------------------------------------------------------------------
// Default
// -------------------------------------------------------------------------------------------------

/**
 * Default behaviour of a task
 */
export abstract class DefaultTask extends TaskBase {

  /** The last time that the task was updated */
  protected lastUpdateSimTime : SimTime | undefined = undefined;

  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    nbMinResources: number,
    nbMaxResources: number,
	ownerRole: InterventionRole,
    executionLocations: LOCATION_ENUM[]
) {
    super(title, description, nbMinResources, nbMaxResources, ownerRole, executionLocations);
  }

  protected abstract dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void;

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

          this.status = "OnGoing";
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

          this.status = "Paused";
        }
        break;
      }

      case 'Paused': {
        if (enoughResources) {
          taskLogger.debug('task status : Paused -> OnGoing');

          this.status = "OnGoing";
          this.dispatchInProgressEvents(state, timeJump);
        }
        break;
      }

      default: {
        taskLogger.error('Undefined status. Cannot update task');

        break;
      }
    }

    this.lastUpdateSimTime = state.getSimTime();
  }
}
