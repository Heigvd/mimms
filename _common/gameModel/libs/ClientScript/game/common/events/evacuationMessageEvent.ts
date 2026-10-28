import { HospitalId, PatientId, PatientUnitId, ResourceId, SimDuration } from '../baseTypes';
import { EvacuationSquadType } from '../evacuation/evacuationSquadDef';
import { ActionCreationEvent } from './eventTypes';

export interface EvacuationActionPayload {
  patientId: PatientId;
  hospitalId: HospitalId;
  patientUnitId: PatientUnitId;
  squad: EvacuationSquadIds;
}

export type EvacuationSquadIds = {
  type: EvacuationSquadType;
  vehicle: ResourceId;
  drivers: ResourceId[];
  healers: ResourceId[];
};

export interface EvacuationActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  evacuationActionPayload: EvacuationActionPayload;
}
