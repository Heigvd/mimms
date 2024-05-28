import { ResourceType } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export const EvacuationSquadTypeArray = [
  'AmbulanceDriver',
  'AmbulanceDriverHealer',
  'Helicopter',
] as const;
export type EvacuationSquadType = typeof EvacuationSquadTypeArray[number];

/**
 * Define what can be the resources sent for evacuation
 */
export interface EvacuationSquadDefinition {
  /**
   * What is the kind of squad
   */
  uid: EvacuationSquadType;

  /**
   * Where are the resources taken from
   */
  location: LOCATION_ENUM;

  /**
   * What are the types of resources needed to perform an evacuation.
   * <p>
   * Each needed resource is mandatory. We choose the type of the resource among the qualified types.
   * sorted from favorite type to last
   */
  neededResources: {
    qualifiedTypes: ResourceType[];
  }[];
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

const squadDefinitions: Record<EvacuationSquadType, EvacuationSquadDefinition> = {
  AmbulanceDriver: {
    uid: 'AmbulanceDriver',
    location: LOCATION_ENUM.ambulancePark,
    neededResources: [
      { qualifiedTypes: ['ambulance'] },
      { qualifiedTypes: ['secouriste', 'technicienAmbulancier', 'ambulancier'] },
    ],
  },

  AmbulanceDriverHealer: {
    uid: 'AmbulanceDriverHealer',
    location: LOCATION_ENUM.ambulancePark,
    neededResources: [
      { qualifiedTypes: ['ambulance'] },
      { qualifiedTypes: ['secouriste', 'technicienAmbulancier', 'ambulancier'] },
      { qualifiedTypes: ['ambulancier', 'infirmier', 'medecinJunior', 'medecinSenior'] },
    ],
  },

  Helicopter: {
    uid: 'Helicopter',
    location: LOCATION_ENUM.helicopterPark,
    neededResources: [
      { qualifiedTypes: ['helicopter'] },
      { qualifiedTypes: ['ambulancier'] },
      { qualifiedTypes: ['medecinSenior'] },
    ],
  },
};

export function getSquadDef(id: EvacuationSquadType): EvacuationSquadDefinition {
  return squadDefinitions[id]!;
}

export function getAllSquadDefinitions(): EvacuationSquadDefinition[] {
  return Object.values(squadDefinitions);
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
