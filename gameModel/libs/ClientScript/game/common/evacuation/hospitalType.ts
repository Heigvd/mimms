import { HospitalId } from '../baseTypes';

/**
 * Hospital details proximity
 */
export enum HospitalProximity {
  Regional = 0,
  National,
  International,
}

/**
 * Hospital patient unit place typology
 */
export type PatientUnitTypology = string;

interface PatientUnitType {
  typology: PatientUnitTypology;
  description?: string;
}

interface PatientUnitDefinition {
  placeType: PatientUnitType;
  availableCapacity: number;
}

/**
 * Hospital definition
 */
export interface HospitalDefinition {
  hospitalId: HospitalId;
  fullName: string;
  shortName: string;
  description?: string;
  proximity: HospitalProximity;
  distance: number;
  units: PatientUnitDefinition[];
}
