import { ActionId, ResourceId, TaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ResourceType } from './resourceType';

const RESOURCE_BASE_SEED_ID: ResourceId = 1000;

/**
 * A resource is someone / something at disposal of actors to perform tasks.
 * <p>
 * A resource is owned by an actor and can be assigned to an activity by this actor.
 * <p>
 * The kind allows to know which tasks the resource can perform and with which skill level.
 */
export class Resource {
  private static resourceIdSeed: number = RESOURCE_BASE_SEED_ID;

  static resetIdSeed() {
    Resource.resourceIdSeed = RESOURCE_BASE_SEED_ID;
  }

  public readonly Uid: ResourceId;

  /** What is it for a resource (fixed through time) */
  public readonly type: ResourceType;

  /** What the resource do currently */
  public currentActivity: TaskId | null;

  /** Where is the resource currently */
  public currentLocation: LOCATION_ENUM;

  /** Resource is cumulating time across timejumps to accomplish a task */
  public cumulatedUnusedTime: number;

  /** action id the has reserved this resource. 0 if the resource is not reserved */
  public reservationActionId: ActionId | undefined;

  constructor(
    type: Resource['type'],
    currentLocation: Resource['currentLocation'] = LOCATION_ENUM.remote,
    currentActivity: Resource['currentActivity'] = null
  ) {
    this.Uid = Resource.resourceIdSeed++;
    this.type = type;
    this.currentActivity = currentActivity;
    this.currentLocation = currentLocation;
    this.cumulatedUnusedTime = 0;
  }

  public reserve(actionId: ActionId) {
    this.reservationActionId = actionId;
  }

  public isReserved(): boolean {
    return this.reservationActionId != undefined;
  }

  public unReserve(): void {
    this.reservationActionId = undefined;
  }
}
