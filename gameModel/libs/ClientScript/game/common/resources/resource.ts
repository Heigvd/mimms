import { ActorId, ResourceId, TaskId } from '../baseTypes';
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

  /** The actor who manage this resource */
  public ownerId: ActorId;

  /** What the resource do currently */
  public currentActivity: TaskId | null;

  /** Where is the resource currently */
  // public currentLocation;

  constructor(type: Resource['type'], ownerId: Resource['ownerId'],
              currentActivity?: Resource['currentActivity']) {
    this.type = type;
    this.ownerId = ownerId;
    this.currentActivity = currentActivity ?? null;

    this.Uid = Resource.IdSeed++;
  }
}

