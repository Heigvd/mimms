import { taskLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { Category } from '../../pretri/triage';
import { Actor, InterventionRole } from '../actors/actor';
import { PatientId, ResourceId, SubTaskId, TaskId, TranslationKey } from '../baseTypes';
import {
  AddRadioMessageLocalEvent,
  ReleaseResourcesFromTaskLocalEvent,
  TaskStatusChangeLocalEvent,
} from '../localEvents/localEventBase';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { Resource } from '../resources/resource';
import * as ResourceReachLogic from '../resources/resourceReachLogic';
import { CommMedia } from '../resources/resourceReachLogic';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { SubTask } from './subTask';

export enum TaskType {
  Waiting = 'Waiting',
  Pretriage = 'Pretriage',
  Porter = 'Porter',
  Healing = 'Healing',
  Evacuation = 'Evacuation',
}

/** The statuses represent the steps of a task evolution */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled';

const TASK_SEED_ID: TaskId = 4000;

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Task base
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Base class for a task
 */
export abstract class TaskBase<SubTaskType extends SubTask = SubTask> {
  private static idProvider: TaskId = TASK_SEED_ID;

  public static resetIdSeed() {
    TaskBase.idProvider = TASK_SEED_ID;
  }

  public readonly Uid: TaskId;

  protected status: TaskStatus;

  public subTasks: Record<SubTaskId, SubTaskType>;

  protected constructor(
    readonly taskType: TaskType,
    readonly title: TranslationKey,
    readonly description: TranslationKey, // currently not used
    readonly nbMinResources: number,
    readonly nbMaxResources: number, // currently not used
    /** the actor role owner of the task */
    readonly ownerRole: InterventionRole,
    /** the locations where the task can take place */
    readonly availableToLocations: LOCATION_ENUM[] = [],
    /** which roles can order the task */
    readonly availableToRoles: InterventionRole[] = [],
    readonly isStandardAssignation: boolean = true
  ) {
    this.Uid = ++TaskBase.idProvider;
    this.status = 'Uninitialized';
    this.subTasks = {};
  }

  /** Its short name */
  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  // TODO see if useful
  /** Its description to give more details */
  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  // TODO see if useful
  // TODO to be refined with types
  /** The minimum resources needed for the task to be performed */
  public getNbMinResources(): number {
    return this.nbMinResources;
  }

  // TODO see if useful
  // TODO to be refined with types
  /** The maximum useful resources. More would be useless */
  public getNbMaxResources(): number {
    return this.nbMaxResources;
  }

  /** The status represents its step of evolution */
  public getStatus(): TaskStatus {
    return this.status;
  }

  // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
  public setStatus(status: TaskStatus): void {
    this.status = status;
  }

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  // TODO see where it can go and if it is needed
  // Note : based on cancel method on actionBase
  public cancel(): boolean {
    if (this.status === 'Cancelled') {
      taskLogger.warn('This action was cancelled already');
    } else if (this.status === 'Completed') {
      taskLogger.error('This action is completed, it cannot be cancelled');
      return false;
    }

    // TODO some way ResourceState.releaseAllResources(state, this);
    this.setStatus('Cancelled'); // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
    return true;
  }

  /** Is the task at some location ready for some actor to allocate resources on it. */
  public isAvailable(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>,
    location: Readonly<LOCATION_ENUM>,
    mustCheckStandardAssignation: boolean
  ): boolean {
    return (
      this.isRoleWiseAvailable(actor.Role) &&
      this.isLocationWiseAvailable(location) &&
      this.isAvailableCustom(state, actor, location) &&
      (this.isStandardAssignation || !mustCheckStandardAssignation)
    );
  }

  /** Define if a resource at some location doing this task can be reached by a communication media. */
  public isReachable(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>,
    location: Readonly<LOCATION_ENUM>,
    commMedia: CommMedia
  ): boolean {
    return (
      this.isAvailable(state, actor, location, false) &&
      ResourceReachLogic.isReachable(location, this.taskType, commMedia)
    );
  }

  protected isRoleWiseAvailable(role: InterventionRole): boolean {
    return this.availableToRoles.includes(role) || this.availableToRoles.length === 0;
  }

  protected isLocationWiseAvailable(location: LOCATION_ENUM): boolean {
    return this.availableToLocations.includes(location) || this.availableToLocations.length === 0;
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
    const hasAnyResource = TaskState.isAtLeastOneResource(state, this);

    switch (this.status) {
      case 'Cancelled':
      case 'Completed': {
        taskLogger.debug('no more evolution when the task is cancelled or completed');

        // no more evolution
        break;
      }

      case 'Uninitialized': {
        if (hasAnyResource) {
          taskLogger.debug('task status : Uninitialized -> OnGoing');

          this.status = 'OnGoing'; // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
          this.dispatchInProgressEvents(state, timeJump);
        }

        // no evolution if no resource
        break;
      }

      case 'OnGoing': {
        if (hasAnyResource) {
          taskLogger.debug('task : dispatch local events to update the state');

          this.dispatchInProgressEvents(state, timeJump);
        } else {
          taskLogger.debug('task status : OnGoing -> Paused');

          this.status = 'Paused'; // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
        }

        break;
      }

      case 'Paused': {
        if (hasAnyResource) {
          taskLogger.debug('task status : Paused -> OnGoing');

          this.status = 'OnGoing'; // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
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

  /*
   * Cleanup sub-tasks according to new allocated resources information.
   * <p>
   * A resource that was working on a sub-task may have been unallocated to the task.
   * <p>
   * In that cas, the sub-task is stopped and everything goes as if nothing happened.
   */
  protected cleanupSubTasksFromUnallocatedResources(state: Readonly<MainSimulationState>) {
    const allocatedToTaskResources: Resource[] = ResourceState.getFreeResourcesByTask(
      state,
      this.Uid
    );

    // FIXME see if no problem removing element from the list we browse

    for (const subTask of Object.values(this.subTasks)) {
      for (const subTaskResourceId of subTask.resources) {
        if (
          allocatedToTaskResources.find(resource => resource.Uid === subTaskResourceId) ===
          undefined
        ) {
          // if a resource is no more working on the task, then delete complete sub-task
          delete this.subTasks[subTask.subTaskId];
          // no need to go through other resources
          break;
        }
      }
    }
  }

  /*
   * Get the resources that are allocated to the task, but not involved in a sub-task
   */
  protected getResourcesReadyForNewSubTask(state: Readonly<MainSimulationState>): Resource[] {
    const result: Resource[] = [];

    const allocatedToTaskResources: Resource[] = ResourceState.getFreeResourcesByTask(
      state,
      this.Uid
    );
    allocatedToTaskResources.map(resource => {
      if (!this.isResourceInvolvedInASubTask(resource.Uid)) {
        result.push(resource);
      }
    });

    return result;
  }

  /*
   * Determine if the resource is involved in a sub-task
   */
  protected isResourceInvolvedInASubTask(resourceId: number): boolean {
    return (
      Object.values(this.subTasks).find((subTask: SubTaskType) =>
        subTask.resources.find((subTaskResourceId: ResourceId) => subTaskResourceId === resourceId)
      ) !== undefined
    );
  }

  /*
   * Get the patients that are involved in a sub-task
   */
  protected getPatientsInvolvedInSubTasks(): PatientId[] {
    return Object.values(this.subTasks)
      .filter(subTask => subTask.patientId != null)
      .map(subTask => subTask.patientId!);
  }

  protected finaliseTask(state: Readonly<MainSimulationState>, feedbackRadioMessage: string) {
    getLocalEventManager().queueLocalEvent(
      new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed')
    );

    getLocalEventManager().queueLocalEvent(
      new ReleaseResourcesFromTaskLocalEvent(0, state.getSimTime(), this.Uid)
    );

    // We broadcast a message when the task is completed
    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent(
        0,
        state.getSimTime(),
        undefined,
        RadioLogic.getResourceAsSenderName(),
        undefined,
        feedbackRadioMessage,
        RadioType.RESOURCES,
        true
      )
    );
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// Healing
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// should be in its own file, but does not compile in wegas ...

/**
 * Task to treat patients.
 */
export class HealingTask extends TaskBase {
  public constructor(
    title: TranslationKey,
    description: TranslationKey,
    nbMinResources: number,
    nbMaxResources: number,
    ownerRole: InterventionRole,
    availableToLocations: LOCATION_ENUM[],
    availableToRoles?: InterventionRole[],
    readonly patientPriority?: Category<string>['priority']
  ) {
    super(
      TaskType.Healing,
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
    // no effect
    if (this.patientPriority != null) {
      taskLogger.info('healing for priority ' + this.patientPriority);
    } else {
      taskLogger.info('healing');
    }
  }
}
