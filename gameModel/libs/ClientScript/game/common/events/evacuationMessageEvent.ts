import { HospitalId, PatientId, PatientUnitId, SimDuration } from '../baseTypes';
import { EvacuationSquadType } from '../evacuation/evacuationSquadDef';
import { ActionCreationEvent } from './eventTypes';

export interface EvacuationActionPayload {
  patientId: PatientId;
  hospitalId: HospitalId;
  patientUnitId: PatientUnitId;
  transportSquad: EvacuationSquadType;
  doResourcesComeBack?: boolean;
}

export interface EvacuationActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  evacuationActionPayload: EvacuationActionPayload;
}
