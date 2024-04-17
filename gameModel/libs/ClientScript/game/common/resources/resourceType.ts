/**
 * The resources are split into several types
 * which determine the ability of the resource to perform a task.
 */

// TODO See which translations are OK

export const MaterialResourceTypeArray = ['ambulance', 'helicopter', 'PMA'] as const;
// type inference
export type MaterialResourceType = (typeof MaterialResourceTypeArray)[number];

export const HumanResourceTypeArray = [
  'secouriste',
  'technicienAmbulancier',
  'ambulancier',
  'infirmier',
  'medecinJunior',
  'medecinSenior',
] as const;

export type HumanResourceType = (typeof HumanResourceTypeArray)[number];

export type ResourceType = HumanResourceType | MaterialResourceType;

export const ResourcesArray = [...MaterialResourceTypeArray, ...HumanResourceTypeArray] as const;

export type ResourceTypeAndNumber = Partial<Record<ResourceType, number>>;
