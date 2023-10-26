/**
 * The resources are split into several types
 * which determine the ability of the resource to perform a task.
 */

// TODO See which translations are OK

export type ResourceType = HumanResourceType | MaterialResourceType;

export type HumanResourceType =
	'secouriste'
	| 'technicienAmbulancier'
	| 'ambulancier'
	| 'infirmier'
	| 'medecinJunior'
	| 'medecinSenior';

export type MaterialResourceType = 'ambulance' | 'helicopter' | 'PMA';

/**
 * Combination of a type and an associated number of resources
 */
export type ResourceTypeAndNumber = {
	type: ResourceType;
	nb: number;
}

export const HumanResourceTypeArray: HumanResourceType[] = ['secouriste', 'technicienAmbulancier', 'ambulancier', 'infirmier', 'medecinJunior', 'medecinSenior'];