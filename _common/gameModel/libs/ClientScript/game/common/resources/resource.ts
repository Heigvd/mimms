import { getContextUidGenerator } from '../../executionContext/gameExecutionContextController';
import { ResourceId, TaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ResourceType } from './resourceType';

const RESOURCE_SEED_ID: ResourceId = 7000;

/**
 * A resource is someone / something at disposal of actors to perform tasks.
 */
export class Resource {
  public readonly Uid: ResourceId;

  /** What is it for a resource (fixed through time) */
  public readonly type: ResourceType;

  /** Where is the resource currently */
  public currentLocation: LOCATION_ENUM;

  /** What the resource do currently */
  public currentActivity: TaskId | null;

  /** Resource is cumulating time across time-jumps to accomplish a task */
  public carryoverWorkTime: number;

  /** Time the resource spent in a row assigned to a task without being able to work */
  public cumulatedIdleTime: number;

  constructor(
    type: Resource['type'],
    currentLocation: Resource['currentLocation'] = LOCATION_ENUM.remote,
    currentActivity: Resource['currentActivity'] = null
  ) {
    this.Uid = getContextUidGenerator().getNext('Resource', RESOURCE_SEED_ID);
    this.type = type;
    this.currentLocation = currentLocation;
    this.currentActivity = currentActivity;
    this.carryoverWorkTime = 0;
    this.cumulatedIdleTime = 0;
  }

  /** Forget what the resource did so far, typically when it starts a new activity */
  public resetTimeCounters(): void {
    this.carryoverWorkTime = 0;
    this.cumulatedIdleTime = 0;
  }
}
