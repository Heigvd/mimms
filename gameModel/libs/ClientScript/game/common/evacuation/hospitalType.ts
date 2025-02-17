import { knownLanguages } from '../../../tools/translation';
import { HospitalId, PatientUnitId } from '../baseTypes';

// Note : we use the numerical representation so that we can easily sort them
export enum HospitalProximity {
  Regional = 1,
  National = 2,
  International = 3,
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
  distance: number /* distance from the site */;
  proximity: HospitalProximity;
  units: Record<PatientUnitId, number> /* available capacity in each unit */;
}

export interface HospitalsConfigVariableDefinition {
  hospitals: Record<HospitalId, HospitalDefinition>;
  patientUnits: Record<PatientUnitId, PatientUnitDefinition>;
}
