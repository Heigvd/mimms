import { HumanResourceType, VehicleType } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { TranslationKey } from '../baseTypes';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export const EvacuationSquadTypeArray = ['AmbulanceDriverHealer', 'Helicopter'] as const;
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
   * Resources needed to perform an evacuation.
   * <p>
   * Each resource is mandatory. The type of the resource is picked among the qualified types.
   * order from most to least favorite
   */
  resourcesTypesRequirements: {
    vehicleTypes: VehicleType[];
    /**
     * Each sub array describes the requirements for one driver
     */
    driverTypes: HumanResourceType[][];
    /**
     * Each sub array describes the requirements for one healer
     */
    healerTypes: HumanResourceType[][];
  };

  /**
   * The time needed to load the patient into the vehicle. Must be given in minute.
   */
  loadingTime: number;

  /**
   * The time needed to un-load the patient from the vehicle. Must be given in minute.
   */
  unloadingTime: number;

  /**
   * The average speed of the vehicle. Must be given in km/h.
   */
  speed: number;

  /**
   * The vehicle icon to display
   */
  vehicleIcon: string;

  /**
   * Translation to designate the main vehicle
   */
  mainVehicleTranslation: TranslationKey;

  /**
   * Translation to designate the main vehicle
   */
  mainVehicleTranslationNoun: TranslationKey;

  /**
   * Translation to indicate if there are healers
   */
  healerPresenceTranslation: TranslationKey;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

const squadDefinitions: Record<EvacuationSquadType, EvacuationSquadDefinition> = {
  AmbulanceDriverHealer: {
    uid: 'AmbulanceDriverHealer',
    location: LOCATION_ENUM.ambulancePark,
    resourcesTypesRequirements: {
      vehicleTypes: ['ambulance'],
      driverTypes: [['secouriste', 'technicienAmbulancier', 'ambulancier']],
      healerTypes: [['ambulancier', 'infirmier', 'medecinJunior', 'medecinSenior']]
    },
    loadingTime: 2,
    unloadingTime: 2,
    speed: 80,
    vehicleIcon: 'ambulance',
    mainVehicleTranslation: 'by-ambulance',
    mainVehicleTranslationNoun: 'ambulance',
    healerPresenceTranslation: 'with-healer',
  },

  Helicopter: {
    uid: 'Helicopter',
    location: LOCATION_ENUM.helicopterPark,
    resourcesTypesRequirements: {
      vehicleTypes: ['helicopter'],
      // helicopter pilot is implicit
      driverTypes: [],
      healerTypes: [['ambulancier'], ['medecinSenior']]
    },
    loadingTime: 2,
    unloadingTime: 2,
    speed: 225,
    vehicleIcon: 'helicopter',
    mainVehicleTranslation: 'by-helicopter',
    mainVehicleTranslationNoun: 'helicopter',
    healerPresenceTranslation: 'with-healers',
  },
};

export function getSquadDef(id: EvacuationSquadType): EvacuationSquadDefinition {
  return squadDefinitions[id]!;
}

export function getAllSquadDefinitions(): EvacuationSquadDefinition[] {
  return Object.values(squadDefinitions);
}

export function getNumberDriverNeeded(id: EvacuationSquadType): number {
  return getSquadDef(id)?.resourcesTypesRequirements?.driverTypes?.length || 0;
}

export function getNumberHealersNeeded(id: EvacuationSquadType): number {
  return getSquadDef(id)?.resourcesTypesRequirements?.healerTypes?.length || 0;
}

export function getTotalResourcesNeeded(id: EvacuationSquadType): number {
  const squadDef = getSquadDef(id);
  if(squadDef){
    return Object.values(squadDef.resourcesTypesRequirements).flat(1).length;
  }
  return 0;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
