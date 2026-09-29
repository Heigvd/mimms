import { HospitalId, PatientId, PatientUnitId, SimDuration } from '../baseTypes';
import { EvacuationSquad } from '../evacuation/evacuationLogic';
import { ActionCreationEvent } from './eventTypes';

export interface EvacuationActionPayload {
  patientId: PatientId;
  hospitalId: HospitalId;
  patientUnitId: PatientUnitId;
  squad: EvacuationSquad;
}

export interface EvacuationActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  evacuationActionPayload: EvacuationActionPayload;
}
