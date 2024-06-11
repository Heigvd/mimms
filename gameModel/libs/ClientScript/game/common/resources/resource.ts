import { ResourceId, TaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ResourceType } from './resourceType';

/**
 * A resource is someone / something at disposal of actors to perform tasks.
 * <p>
 * A resource is owned by an actor and can be assigned to an activity by this actor.
 * <p>
 * The kind allows to know which tasks the resource can perform and with which skill level.
 */
export class Resource {
  private static IdSeed = 1000;
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
  public reservationActionId: number = 0;

  public reserve(actionId: number) {
    this.reservationActionId = actionId;
  }
  public isReserved(): boolean {
    return this.reservationActionId > 0;
  }
  public unReserve(): void {
    this.reservationActionId = 0;
  }

  constructor(
    type: Resource['type'],
    currentLocation: LOCATION_ENUM,
    currentActivity: Resource['currentActivity'] = null
  ) {
    this.type = type;
    this.currentActivity = currentActivity;
    this.Uid = Resource.IdSeed++;
    this.cumulatedUnusedTime = 0;
    this.currentLocation = currentLocation;
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
  }
}
