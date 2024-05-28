/**
 * The resources are split into several types
 * which determine the ability of the resource to perform a task.
 */

// -------------------------------------------------------------------------------------------------
// Humans
// -------------------------------------------------------------------------------------------------

export const HumanResourceTypeArray = [
  'secouriste',
  'technicienAmbulancier',
  'ambulancier',
  'infirmier',
  'medecinJunior',
  'medecinSenior',
] as const;
// type inference
export type HumanResourceType = typeof HumanResourceTypeArray[number];

// -------------------------------------------------------------------------------------------------
// Vehicles
// -------------------------------------------------------------------------------------------------

const VehicleTypeArray = ['ambulance', 'helicopter'] as const;
// type inference
export type VehicleType = typeof VehicleTypeArray[number];

// -------------------------------------------------------------------------------------------------
// Infrastructures
// -------------------------------------------------------------------------------------------------

const InfrastructureTypeArray = ['PMA'] as const;
// type inference
export type InfrastructureType = typeof InfrastructureTypeArray[number];

// -------------------------------------------------------------------------------------------------
// All
// -------------------------------------------------------------------------------------------------

export type ResourceType = HumanResourceType | VehicleType | InfrastructureType;

export const ResourcesArray = [
  ...HumanResourceTypeArray,
  ...VehicleTypeArray,
  ...InfrastructureTypeArray,
] as const;

export type ResourceTypeAndNumber = Partial<Record<ResourceType, number>>;

// -------------------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------------------

export function isHuman(resourceType: ResourceType) {
  return Object.values(HumanResourceTypeArray).some(type => type === resourceType);
}

export function isVehicle(resourceType: ResourceType) {
  return Object.values(VehicleTypeArray).some(type => type === resourceType);
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
