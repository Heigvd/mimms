import { taskLogger } from "../../../tools/logger";
import { Actor } from "../actors/actor";
import { SimTime, TaskId, TranslationKey } from "../baseTypes";
import { IClonable } from "../interfaces";
import { AddRadioMessageLocalEvent, CategorizePatientLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";

export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled'; // | undefined ?

export abstract class TaskBase implements IClonable {

  private static IdSeed = 1000;
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  protected nbCurrentResources: number;

  public constructor(
    readonly title: string,
    readonly description: string,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    this.Uid = TaskBase.IdSeed++;
    this.status = 'Uninitialized';
    this.nbCurrentResources = 0;
  }

  public getStatus(): TaskStatus {
    return this.status;
  }

  public getNbCurrentResources(): number {
    return this.nbCurrentResources;
  }

  public incrementNbResources(nb: number) : void{
    this.nbCurrentResources += nb;

    if (this.nbCurrentResources < 0) {
      taskLogger.error("Tried to set a negative amount of resources");
      this.nbCurrentResources = 0;
    }
  }

  public releaseAllResources(): void {
    this.nbCurrentResources = 0;
  }

  protected setAsCompleted(): void {
    this.releaseAllResources();
    this.status = 'Completed';
    taskLogger.debug('set as completed');
  }

  protected setAsCancelled(): void {
    this.releaseAllResources();
    this.status = 'Cancelled';
    taskLogger.debug('set as cancelled');
  }

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      taskLogger.warn('This action was cancelled already');

    } else if(this.status === 'Completed') {
      taskLogger.error('This action is completed, it cannot be cancelled');
      return false;
    }

    this.setAsCancelled();
    return true;
  }

  public abstract isAvailable(state : MainSimulationState, actor : Actor): boolean;

  public abstract update(state: Readonly<MainSimulationState>): void;

  public abstract clone(): this;

}

export abstract class DefaultTask extends TaskBase {

  public constructor(
    readonly title: string,
    readonly description: string,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  protected abstract dispatchEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {
    const isEnoughResources = this.nbCurrentResources >= this.nbMinResources;

    switch (this.status) {
      case 'Cancelled':
      case 'Completed':
        return;

      case 'Uninitialized': {
        if (!isEnoughResources) {
          break;
        } else {
          taskLogger.debug('task status : Uninitialized -> OnGoing');
          this.status = "OnGoing";
          // do not break, go to OnGoing
        }
      }
      case 'OnGoing': {
        if (isEnoughResources) {
          taskLogger.debug('task : dispatch local events to update the state');
          this.dispatchEvents(state);
        } else {
          taskLogger.debug('task status : OnGoing -> Paused');
          this.status = "Paused";
        }
        break;
      }
      case 'Paused': {
        if (isEnoughResources) {
          taskLogger.debug('task status : Paused -> OnGoing');
          this.status = "OnGoing";
        }
        break;
      }
      default:
        taskLogger.error('Undefined status cannot update task');
    }
  }
}

export class PreTriTask extends DefaultTask {

  protected lastUpdateSimTime : SimTime | undefined = undefined; // does not work

  public constructor(
    readonly title: string,
    readonly description: string,
    readonly nbMinResources: number,
    readonly nbMaxResources: number,
    readonly zone: string, // TODO see how represent it
    readonly feedbackAtEnd : TranslationKey,
  ) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  public isAvailable(state: MainSimulationState) {
    return true;
  }

  protected dispatchEvents(state: MainSimulationState): void {
    // check we have the capacity to do something
    if (this.nbCurrentResources < this.nbMinResources) {
      return;
    }

    const durationSinceLastUpdate = state.getSimTime() - (this.lastUpdateSimTime ?? 0); // does not work

    const nbMinutesToProcess = 1;  //Math.floor(durationSinceLastUpdate / OneMinuteDuration);

    const progressionCapacity = nbMinutesToProcess * Math.min(this.nbCurrentResources, this.nbMaxResources);

    taskLogger.debug("update task for a capacity of " + progressionCapacity + "(duration : " + durationSinceLastUpdate + " aka nbMinutes : " + nbMinutesToProcess + ", nbCurrentResources : " + this.nbCurrentResources + ")");

    let nbToPreTri = state.countNbPatientsForPreTri(this.zone);

    for (let i = 0; i < progressionCapacity && nbToPreTri > 0; i++) {
        // ?!? which parent event id ?!?
      localEventManager.queueLocalEvent(new CategorizePatientLocalEvent(0, state.getSimTime(), this.zone));
      nbToPreTri--;
    }

    if (nbToPreTri === 0) {
      // can we broadcast ?
      // which  parent event id ?!?
      // from whom ?
      localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(0, state.getSimTime(), state.getAllActors()[0]!.Uid, 'resources', this.feedbackAtEnd));
      this.setAsCompleted();
    }

    this.lastUpdateSimTime = state.getSimTime();
  }

  override clone(): this { 
    const clone = new PreTriTask(this.title, this.description, this.nbMinResources, this.nbMaxResources, this.zone, this.feedbackAtEnd);
    clone.status = this.status;
    return clone as this;
  }

}