// TODO See which translations are OK

/**
 * The enumeration of functions to which a resources can be assigned.
 */
export type ResourceFunction = 
	'Chauffeur'|
	'Estafette'|
	'Brancardier'|
	'Pretrieur'|
	'Trieur'|
	'SoignantFront'|
	'SoignantPMA'|
	'SoignantTransport'|
	'MedecinFront'|
	'MedecinPMA'|
	'MedecinTransport';

// TODO see how it could be automated between type and const
export const ResourceFunctionArray: ResourceFunction[] = [
	'Estafette',
	'Pretrieur',
	'Brancardier',
	'Trieur',
	'SoignantFront',
	'SoignantPMA',
	'SoignantTransport',
	'MedecinFront',
	'MedecinPMA',
	'MedecinTransport',
	'Chauffeur'
];

/* 
export enum ResourceFunction {
	'Estafette',
	'Pretrieur',
	'Brancardier',
	'Trieur',
	'SoignantFront',
	'SoignantPMA',
	'SoignantTransport',
	'MedecinFront',
	'MedecinPMA',
	'MedecinTransport',
	'Chauffeur',
}
export type ResourceNbByFunction = Record<ResourceFunction, number>;
*/