import { ActorId, ResourceId, TaskId } from "../baseTypes";

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
  public readonly kind: ResourceKind;

  /** The actor who manage this resource */
  public ownerId: ActorId;

  /** What the resource do currently */
  public currentActivity: TaskId | null;

  /** Where is the resource currently */
  // public currentLocation;

  constructor(kind: Resource['kind'], ownerId: Resource['ownerId'],
    currentActivity?: Resource['currentActivity']) {
    this.kind = kind;
    this.ownerId = ownerId;
    this.currentActivity = currentActivity ?? null;

    this.Uid = Resource.IdSeed++;
  }
}

/**
 * The resources are splitted into several kinds 
 * which determines the ability of the resource to perform a task.
 */
export type ResourceKind = HumanResourceKind | VehicleKind;

export const HumanResourceKindArray = ['secouriste', 'technicienAmbulancier', 'ambulancier', 'medecinJunior', 'medecinSenior'];
export type HumanResourceKind = 'secouriste' | 'technicienAmbulancier' | 'ambulancier' | 'medecinJunior' | 'medecinSenior';

export type VehicleKind = 'ambulance' | 'helicopter';