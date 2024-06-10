import { HospitalId } from '../baseTypes';
import { knownLanguages } from '../../../tools/translation';

export enum HospitalProximity {
  Regional = 0,
  National,
  International,
}

export type PatientUnitTypology = string;

interface PatientUnitType {
  typology: PatientUnitTypology;
  description?: string;
}

interface PatientUnitDefinition {
  placeType: PatientUnitType;
  availableCapacity: number;
}

export interface HospitalDefinition {
  hospitalId: HospitalId;
  fullName: string;
  shortName: string;
  nameAsDestination: Record<knownLanguages, string>;
  description?: string;
  proximity: HospitalProximity;
  distance: number;
  units: PatientUnitDefinition[];
}
