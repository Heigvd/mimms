import { ResourceType } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { TranslationKey } from '../baseTypes';

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
   * The number of drivers needed
   */
  infoNbDrivers: number;

  /**
   * The number of healers needed
   */
  infoNbHealers: number;

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
  AmbulanceDriver: {
    uid: 'AmbulanceDriver',
    location: LOCATION_ENUM.ambulancePark,
    // List of the resources.
    // One line for one resource. The type of the resource is chosen among the list.
    // The first is the favorite, the last is the last choice.
    neededResources: [
      { qualifiedTypes: ['ambulance'] },
      { qualifiedTypes: ['secouriste', 'technicienAmbulancier', 'ambulancier'] },
    ],
    loadingTime: 2,
    unloadingTime: 2,
    speed: 80,
    vehicleIcon: 'ambulance',
    infoNbDrivers: 1,
    infoNbHealers: 0,
    mainVehicleTranslation: 'by-ambulance',
    mainVehicleTranslationNoun: 'ambulance',
    healerPresenceTranslation: 'without-healer',
  },

  AmbulanceDriverHealer: {
    uid: 'AmbulanceDriverHealer',
    location: LOCATION_ENUM.ambulancePark,
    // List of the resources.
    // One line for one resource. The type of the resource is chosen among the list.
    // The first is the favorite, the last is the last choice.
    neededResources: [
      { qualifiedTypes: ['ambulance'] },
      { qualifiedTypes: ['secouriste', 'technicienAmbulancier', 'ambulancier'] },
      { qualifiedTypes: ['ambulancier', 'infirmier', 'medecinJunior', 'medecinSenior'] },
    ],
    loadingTime: 2,
    unloadingTime: 2,
    speed: 80,
    vehicleIcon: 'ambulance',
    infoNbDrivers: 1,
    infoNbHealers: 1,
    mainVehicleTranslation: 'by-ambulance',
    mainVehicleTranslationNoun: 'ambulance',
    healerPresenceTranslation: 'with-healer',
  },

  Helicopter: {
    uid: 'Helicopter',
    location: LOCATION_ENUM.helicopterPark,
    // List of the resources.
    // One line for one resource. The type of the resource is chosen among the list.
    // The first is the favorite, the last is the last choice.
    neededResources: [
      { qualifiedTypes: ['helicopter'] },
      { qualifiedTypes: ['ambulancier'] },
      { qualifiedTypes: ['medecinSenior'] },
    ],
    loadingTime: 2,
    unloadingTime: 2,
    speed: 225,
    vehicleIcon: 'helicopter',
    infoNbDrivers: 1,
    infoNbHealers: 2,
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
