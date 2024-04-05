/**
 * 
 * Types relating to casuMessage HospitalRequest
 * 
 */
import { HospitalProximity } from "../simulationState/locationState";

interface PatientUnitType {
  typology: string;
  description?: string;
}

interface PatientUnitDefinition {
  placeType: PatientUnitType;
  availableCapacity: number;
}

export interface HospitalDefinition {
  fullName: string;
  shortName: string;
  description?: string;
  proximity: HospitalProximity;
  distance: number;
  units: PatientUnitDefinition[];
}