import { ActorId, ResourcePoolId } from "../baseTypes";

/**
 * Existing kinds of pool resources
 */
export type ResourceType = 'MEDICAL_STAFF' | 'AMBULANCE' | 'HELICOPTER';

/**
 * A pool resource represent how many resources are available.
 * <p>
 * A resource pool is owned by an actor.
 */
export class ResourcePool {

  private static IdSeed = 1000;
  public readonly Uid: ResourcePoolId;

  public ownerId: ActorId;
  public readonly type: ResourceType;
  public nbAvailable: number;

  constructor(ownerId: ActorId, type: ResourceType, nbAvailable: number) {
    this.ownerId = ownerId;
    this.type = type;
    this.nbAvailable = nbAvailable;

    this.Uid = ResourcePool.IdSeed++;
  }
}
