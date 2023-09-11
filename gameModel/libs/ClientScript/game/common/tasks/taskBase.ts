import { taskLogger } from "../../../tools/logger";
import { getTranslation } from "../../../tools/translation";
import { Actor } from "../actors/actor";
import { SimTime, TaskId, TranslationKey } from "../baseTypes";
import { OneMinuteDuration } from "../constants";
import { IClonable } from "../interfaces";
import { AddRadioMessageLocalEvent, AllResourcesReleaseLocalEvent, CategorizePatientLocalEvent, TaskStatusChangeLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as PatientState from "../simulationState/patientStateAccess";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";

/** The statuses represent the steps of a task evolution */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled';

// -------------------------------------------------------------------------------------------------
// Base
// -------------------------------------------------------------------------------------------------

/**
 * Base class for a task
 */
export abstract class TaskBase implements IClonable {

  private static IdSeed = 1000;
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    this.Uid = TaskBase.IdSeed++;
    this.status = 'Uninitialized';
  }

  /** Its short name */
  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  /** Its description to give more details */
  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  // TODO to be refined with kinds
  /** The minimum resources needed for the task to be performed */
  public getNbMinResources(): number {
    return this.nbMinResources;
  }

  // TODO to be refined with kinds
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
  public abstract isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean;

  /** Update the state */
  public abstract update(state: Readonly<MainSimulationState>): void;

  public abstract clone(): this;
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
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  protected abstract dispatchInProgressEvents(state: Readonly<MainSimulationState>): void;

  public update(state: Readonly<MainSimulationState>): void {
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
          this.dispatchInProgressEvents(state);
        }

        // no evolution if not enough resources

        break;
      }

      case 'OnGoing': {
        if (enoughResources) {
          taskLogger.debug('task : dispatch local events to update the state');

          this.dispatchInProgressEvents(state);
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
          this.dispatchInProgressEvents(state);
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

// -------------------------------------------------------------------------------------------------
// PreTriage
// -------------------------------------------------------------------------------------------------

/**
 * Default behaviour of a task
 */
export class PreTriageTask extends DefaultTask {

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number,
    readonly zone: string, // TODO see how represent it
    readonly feedbackAtEnd : TranslationKey,
  ) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean {
    return state.areZonesAlreadyDefined();
  }

  protected dispatchInProgressEvents(state: Readonly<MainSimulationState>): void {
    // check if we have the capacity to do something
    if (!TaskState.hasEnoughResources(state, this)) {
      return;
    }

    const nbCurrentResources = ResourceState.getAllocatedResources(state, this.Uid, 'ambulancier').length;

    const durationSinceLastUpdate = state.getSimTime() - (this.lastUpdateSimTime ?? 0);
    // fixme : see if ok the first time it runs (and so lastUpdateSimTime is null)

    const nbMinutesToProcess = Math.floor(durationSinceLastUpdate / OneMinuteDuration);

    const progressionCapacity = nbMinutesToProcess * Math.min(nbCurrentResources, this.nbMaxResources);

    taskLogger.debug("update task for a capacity of " + progressionCapacity + "(duration : " + durationSinceLastUpdate
      + " aka nbMinutes : " + nbMinutesToProcess + ", nbCurrentResources : " + nbCurrentResources + ")");

    let nbPatientsForPreTriage = PatientState.countNbPatientsForPreTriage(state, this.zone);

    for (let i = 0; i < progressionCapacity && nbPatientsForPreTriage > 0; i++) {
        // FIXME ?!? which parent event id ?!?
      localEventManager.queueLocalEvent(new CategorizePatientLocalEvent(0, state.getSimTime(), this.zone));
      nbPatientsForPreTriage--;
    }

    if (nbPatientsForPreTriage === 0) {
      // FIXME which  parent event id ?!?
      localEventManager.queueLocalEvent(new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed'));
      localEventManager.queueLocalEvent(new AllResourcesReleaseLocalEvent(0, state.getSimTime(), this.Uid));
      // FIXME See to whom and from whom
      state.getAllActors().forEach(actor => {
        localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(0, state.getSimTime(), actor!.Uid, 'resources', this.feedbackAtEnd));
      });
    }
  }

  override clone(): this { 
    const clone = new PreTriageTask(this.title, this.description, this.nbMinResources, this.nbMaxResources, this.zone, this.feedbackAtEnd);
    clone.status = this.status;
    return clone as this;
  }

}
