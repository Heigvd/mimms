import { ActionCreationEvent } from './eventTypes';
import { HospitalId, PatientId, SimDuration } from '../baseTypes';
import { PatientUnitTypology } from '../evacuation/hospitalType';
import { EvacuationSquadType } from '../evacuation/evacuationSquadDef';

export interface EvacuationActionPayload {
  patientId: PatientId;
  hospitalId: HospitalId;
  patientUnitAtHospital: PatientUnitTypology;
  transportSquad: EvacuationSquadType;
  doResourcesComeBack?: boolean;
}

export interface EvacuationActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  evacuationActionPayload: EvacuationActionPayload;
}
