import { knownLanguages } from '../../../tools/translation';
import { HospitalId, PatientUnitId } from '../baseTypes';

export enum HospitalProximity {
  Regional = 0,
  National = 1,
  International = 2,
}

export interface PatientUnitDefinition {
  index: number;
  name: Partial<Record<knownLanguages, string>>;
}

export interface HospitalDefinition {
  index: number;
  fullName: string;
  shortName: string;
  preposition: Record<knownLanguages, string>;
  distance: number;
  proximity: HospitalProximity;
  units: Record<PatientUnitId, number> /* available capacity in each unit */;
}

export interface HospitalsConfigVariableDefinition {
  hospitals: Record<HospitalId, HospitalDefinition>;
  patientUnits: Record<PatientUnitId, PatientUnitDefinition>;
}

/* old ones */

export type PatientUnitTypology = string;

interface PatientUnitTypeOld {
  typology: PatientUnitTypology;
  description?: string;
}

interface PatientUnitDefinitionOld {
  placeType: PatientUnitTypeOld;
  availableCapacity: number;
}

export interface HospitalDefinitionOld {
  hospitalId: HospitalId;
  fullName: string;
  shortName: string;
  nameAsDestination: Record<knownLanguages, string>;
  description?: string;
  proximity: HospitalProximity;
  distance: number;
  units: PatientUnitDefinitionOld[];
}
