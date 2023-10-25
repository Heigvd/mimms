import { getCurrentState } from "../game/mainSimulationLogic";
import { PreTriageResult } from "../game/pretri/triage";

export function getAllPatients() {
	let patientNumber = 1;
	const patients = getCurrentState().getInternalStateObject().patients;
	const pretris = getCurrentState().getInternalStateObject().pretriageResults;
	const response: { n: number; data: { id: string; categorization: PreTriageResult<string> | undefined; }; id: string; }[] = [];
	patients.forEach((patient) => {
		const patientId = patient.id;
		if (patientId) {
			response.push({n: patientNumber, data: {id: patientId, categorization: pretris[patientId]}, id: patientId});		
			patientNumber++;
		}
	})
	return response;
}