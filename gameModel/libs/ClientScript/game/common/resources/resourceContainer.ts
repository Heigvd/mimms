import { InterventionRole } from "../actors/actor";
import { SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { ResourceType } from "./resourceType";

export type ResourceContainerDefinitionId = number;
/**
 * Describes the content of one container that can be requested by an actor to the emergency departement
 */
export interface ResourceContainerDefinition {
	
	/**
	 * Unique identifier
	 */
	uid: ResourceContainerDefinitionId;
	/**
	 * Displayed name
	 */
	name: TranslationKey;
	/**
	 * List of resources that will be sent
	 */
	resources : Partial<Record<ResourceType, number>>;
	/**
	 * List of actors that will be sent
	 */
	roles: InterventionRole[]
}

let idProvider = 2000;

export function resetSeedId() {
	idProvider = 2000;
}

export function buildContainerDefinition(name: TranslationKey, resources: Partial<Record<ResourceType, number>>, 
	roles: InterventionRole[] = []) : ResourceContainerDefinition {
	return {
		uid : idProvider++,
		roles : roles,
		name : name,
		resources : resources
	}
}

/**
 * Describes the availability and amount of a given container
 */
export interface ResourceContainerConfig {

	templateId : ResourceContainerDefinitionId;

	// TODO might be a function (more flexibility)
	// or keep it a time value for easier configuration ?
	// or an offset from the first METHANE ?
	/**
	 * When the resource starts to be available during the game
	 */
	availabilityTime : SimTime;

	/**
	 * Once requested, time required to get on site
	 */
	travelTime: SimDuration;

	/**
	 * the number of available containers
	 */
	amount: number;

}