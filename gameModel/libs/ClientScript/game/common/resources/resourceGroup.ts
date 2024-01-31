import { keys } from '../../../tools/helper';
import { InterventionRole } from '../actors/actor';
import { ActorId, ResourceId } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from './resource';

/***
 * A resource group is a set of resources
 * that is owned by one or more actors of the simulation
 */
export class ResourceGroup {
  private owners: Record<ActorId, boolean> = {};
  private resources: Record<ResourceId, boolean> = {};

  public addResource(r: Resource) {
    this.resources[r.Uid] = true;
  }

  public removeResource(r: Resource) {
    delete this.resources[r.Uid];
  }

  public addOwner(actorId: ActorId): ResourceGroup {
    this.owners[actorId] = true;
    return this;
  }

  public hasOwner(actorId: ActorId): boolean {
    return this.owners[actorId] || false;
  }

  public hasResource(resource: Resource): boolean {
    return this.resources[resource.Uid] || false;
  }

  public hasRole(state: MainSimulationState, role: InterventionRole): boolean {
    return keys(this.owners).some(actId => state.getActorById(+actId)?.Role === role);
  }
}

export function isManagedBy(
  state: Readonly<MainSimulationState>,
  resource: Resource,
  actorId: ActorId,
) {
  const rg = state.getResourceGroupByActorId(actorId);
  return rg ? rg.hasResource(resource) : false;
}

/**
 * Defines the roles that share ressources together
 * TODO that might live in another place
 */
const resourceGroupClusters: InterventionRole[][] = [['ACS', 'MCS']];

/**
 * Fetches the resource group corresponding to the actor in the state if existing.
 * Else creates a new one and adds it to the state
 */
export function getOrCreateResourceGroup(
  state: MainSimulationState,
  actorId: ActorId,
): ResourceGroup {
  // search existing
  let group = state.getResourceGroupByActorId(actorId);

  if (!group) {
    // check wether another actor shares the same group
    const actor = state.getActorById(actorId);
    const role = actor!.Role;
    const cluster = resourceGroupClusters.find(cl => cl.find(r => r === role));
    if (cluster) {
      // search for existing resource groups held by the other bound roles
      const otherRoles = cluster.filter(r => r !== role);
      for (let i = 0; i < otherRoles.length; i++) {
        const r = otherRoles[i];
        group = state.getResourceGroupByRole(r);
        if (group) {
          group.addOwner(actorId);
          break;
        }
      }
    }

    if (!group) {
      group = new ResourceGroup().addOwner(actorId);
      state.getInternalStateObject().resourceGroups.push(group);
    }
  }

  return group;
}
