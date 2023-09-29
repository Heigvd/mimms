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

export type MaterialResourceType = 'ambulance' | 'helicopter';

/**
 * Number of resources of each type
 */
export type ResourceNbByType = Record<ResourceType, number>;

// export const HumanResourceTypeArray = ['secouriste', 'technicienAmbulancier', 'ambulancier', 'infirmier', 'medecinJunior', 'medecinSenior'];
