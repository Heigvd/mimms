import { taskLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { getContextUidGenerator } from '../../executionContext/gameExecutionContextController';
import { Category } from '../../pretri/triage';
import { Actor, InterventionRole } from '../actors/actor';
import { PatientId, ResourceId, SubTaskId, TaskId, TranslationKey } from '../baseTypes';
import { StandardMaximumIdleTime } from '../constants';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { Resource } from '../resources/resource';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getPatientsToHealSize } from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { SubTask } from './subTask';
import { ReleaseResourcesFromTaskLocalEvent } from '../localEvents/localEventResources';

export enum TaskType {
  Waiting = 'Waiting',
  MoveTo = 'MoveTo',
  Pretriage = 'Pretriage',
  Porter = 'Porter',
  Healing = 'Healing',
  Evacuation = 'Evacuation',
}

/**
 * The statuses represent the steps of a task evolution.
 * <p>
 * A task never ends, it is 'Paused' as long as no resource is allocated to it and can restart at any time.
 */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused';

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
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  public subTasks: Record<SubTaskId, SubTaskType>;

  protected constructor(
    readonly taskType: TaskType,
    readonly title: TranslationKey,
    /** the location where the task can take place */
    readonly location: LOCATION_ENUM,
    /** which roles can order the task */
    readonly availableToRoles: InterventionRole[] = [],
    /** how long a resource allocated to the task waits for work before going back to get new orders */
    readonly maximumIdleTime: number = StandardMaximumIdleTime
  ) {
    this.Uid = getContextUidGenerator().getNext('TaskBase', TASK_SEED_ID);
    this.status = 'Uninitialized';
    this.subTasks = {};
  }

  /** Its short name */
  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  /** The status represents its step of evolution */
  public getStatus(): TaskStatus {
    return this.status;
  }

  // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
  public setStatus(status: TaskStatus): void {
    this.status = status;
  }

  /** Is the task at some location ready for some actor to allocate resources on it. */
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
    return this.availableToRoles.includes(role) || this.availableToRoles.length === 0;
  }

  // TODO Do we need an explicit method for this ?
  protected isLocationWiseAvailable(location: LOCATION_ENUM): boolean {
    return this.location === location;
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
      case 'Uninitialized': {
        if (hasAnyResource) {
          taskLogger.debug('task status : Uninitialized -> OnGoing');

          this.setStatus('OnGoing'); // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
          this.work(state, timeJump);
        }

        // no evolution if no resource
        break;
      }

      case 'OnGoing': {
        if (hasAnyResource) {
          taskLogger.debug('task : dispatch local events to update the state');

          this.work(state, timeJump);
        } else {
          taskLogger.debug('task status : OnGoing -> Paused');

          this.setStatus('Paused'); // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
        }

        break;
      }

      case 'Paused': {
        if (hasAnyResource) {
          taskLogger.debug('task status : Paused -> OnGoing');

          this.setStatus('OnGoing'); // FIXME : can it really be done here ? Or should we getLocalEventManager().queueLocalEvent(..)
          this.work(state, timeJump);
        }
        break;
      }

      default: {
        taskLogger.error('Undefined status. Cannot update task');

        break;
      }
    }
  }

  /**
   * Let the allocated resources work during the time slice, and keep track of those that could not
   */
  private work(state: Readonly<MainSimulationState>, timeJump: number): void {
    const workingResourcesId: ResourceId[] = this.dispatchInProgressEvents(state, timeJump);

    this.updateIdleResources(state, timeJump, workingResourcesId);
  }

  /**
   * A resource that cannot work on the task cumulates idle time
   */
  private updateIdleResources(
    state: Readonly<MainSimulationState>,
    timeJump: number,
    workingResourcesId: ResourceId[]
  ): void {
    const idleForTooLongResourcesId: ResourceId[] = [];

    for (const resource of ResourceState.getFreeResourcesByTask(state, this.Uid)) {
      if (workingResourcesId.includes(resource.Uid)) {
        resource.cumulatedIdleTime = 0;
        continue;
      }

      // the resource had spare time and did nothing with it, its ongoing work is lost
      resource.carryoverWorkTime = 0;
      resource.cumulatedIdleTime += timeJump;

      if (resource.cumulatedIdleTime >= this.maximumIdleTime) {
        idleForTooLongResourcesId.push(resource.Uid);
      }
    }

    if (idleForTooLongResourcesId.length > 0) {
      taskLogger.info(
        'resources idle for too long, they go back to get new orders : ',
        idleForTooLongResourcesId
      );

      getLocalEventManager().queueLocalEvent(
        new ReleaseResourcesFromTaskLocalEvent({
          parentEventId: 0, // TODO check
          source: { type: 'task', id: this.Uid },
          simTimeStamp: state.getSimTime(),
          resourcesId: idleForTooLongResourcesId,
        })
      );
    }
  }

  /**
   * Resources allocated to the task work during the time slice
   */
  protected abstract dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    timeJump: number
  ): ResourceId[];

  /*
   * Get all the resources allocated to the task
   */
  protected getAllocatedResourcesId(state: Readonly<MainSimulationState>): ResourceId[] {
    return ResourceState.getFreeResourcesByTask(state, this.Uid).map(resource => resource.Uid);
  }

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
    location: LOCATION_ENUM,
    availableToRoles?: InterventionRole[],
    maximumIdleTime?: number,
    readonly patientPriority?: Category<string>['priority']
  ) {
    super(TaskType.Healing, title, location, availableToRoles, maximumIdleTime);
  }

  protected override dispatchInProgressEvents(
    state: Readonly<MainSimulationState>,
    _timeJump: number
  ): ResourceId[] {
    const patientsToHealSize: number = getPatientsToHealSize(
      state,
      this.location,
      this.patientPriority
    );

    if (this.patientPriority != null) {
      taskLogger.info(
        'healing for priority ' + this.patientPriority + ', patients : ' + patientsToHealSize
      );
    } else {
      taskLogger.info('healing, patients : ' + patientsToHealSize);
    }

    // making progress means having someone to take care of
    if (patientsToHealSize === 0) {
      return [];
    }

    return this.getAllocatedResourcesId(state);
  }
}
