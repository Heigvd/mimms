import { Actor } from "../actors/actor";
import { ActorId, ResourceId } from "../baseTypes";
import { IClonable } from "../interfaces";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { Resource } from "./resource";

/***
 * A resource group is a set of resources 
 * that is owned by one or more actors of the simulation
 */
export class ResourceGroup implements IClonable{

	private owners : Record<ActorId, boolean> = {};
	private resources : Record<ResourceId, boolean> = {};

	public addResource(r : Resource){
		this.resources[r.Uid] = true;
	}

	public removeResource(r : Resource) {
		delete this.resources[r.Uid];
	}

	public addOwner(actorId : ActorId) : ResourceGroup{
		this.owners[actorId] = true;
		return this;
	}

	public hasOwner(actorId: ActorId): boolean {
		return this.owners[actorId];
	}

	public hasResource(resource: Resource) : boolean {
		return this.resources[resource.Uid];
	}

	clone(): this {
		const rg = new ResourceGroup();
		rg.owners = {...this.owners};
		rg.resources = {...this.resources};
		return rg as this;
	}

}

export function isManagedBy(state : Readonly<MainSimulationState>, resource: Resource, actorId: ActorId) {
	const rg = state.getResourceGroupByActorId(actorId);
	if(rg){
		return rg.hasResource(resource);
	}
	return false;
}

/**
 * Fetches the resource group in the state if existing.
 * Else it creates a new one and adds it to the state
 */
export function getOrCreateResourceGroup(state: MainSimulationState, actorId: ActorId) : ResourceGroup {

	let group = state.getResourceGroupByActorId(actorId);
	if(!group){

		group = new ResourceGroup().addOwner(actorId);
		state.getInternalStateObject().resourceGroups.push(group)
	}

	return group;
}