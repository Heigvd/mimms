import { ActionId, ResourceId, TaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ResourceType } from './resourceType';

const RESOURCE_SEED_ID: ResourceId = 7000;

/**
 * A resource is someone / something at disposal of actors to perform tasks.
 * <p>
 * A resource is owned by an actor and can be assigned to an activity by this actor.
 * <p>
 * The kind allows to know which tasks the resource can perform and with which skill level.
 */
export class Resource {
  private static idProvider: ResourceId = RESOURCE_SEED_ID;

  public static resetIdSeed() {
    Resource.idProvider = RESOURCE_SEED_ID;
  }

  public readonly Uid: ResourceId;

  /** What is it for a resource (fixed through time) */
  public readonly type: ResourceType;

  /** Where is the resource currently */
  public currentLocation: LOCATION_ENUM;

  /** What the resource do currently */
  public currentActivity: TaskId | null;

  /** Resource is cumulating time across time-jumps to accomplish a task */
  public cumulatedUnusedTime: number;

  /** action id the has reserved this resource. 0 if the resource is not reserved */
  public reservationActionId: ActionId | undefined;

  constructor(
    type: Resource['type'],
    currentLocation: Resource['currentLocation'] = LOCATION_ENUM.remote,
    currentActivity: Resource['currentActivity'] = null
  ) {
    this.Uid = ++Resource.idProvider;
    this.type = type;
    this.currentLocation = currentLocation;
    this.currentActivity = currentActivity;
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
