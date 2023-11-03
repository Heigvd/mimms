import { getCurrentState } from "../game/mainSimulationLogic";
import { PreTriageResult } from "../game/pretri/triage";
import { Location } from '../game/common/baseTypes';

export function getAllPatients() {
	let patientNumber = 1;

	const patients = Object.values(getCurrentState().getInternalStateObject().patients);
	const response: { n: number; data: { id: string; categorization: PreTriageResult<string> | undefined; location: Location | undefined }; id: string; }[] = [];

	patients.forEach((patient) => {
		const patientId = patient.humanBody.id;
		if (patientId) {
			response.push({n: patientNumber, data: {id: patientId, categorization: patient.preTriageResult, location: patient.location}, id: patientId});
			patientNumber++;
		}
	})
	return response;
}