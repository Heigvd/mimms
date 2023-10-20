import { HumanBody } from "../../../HUMAn/human";
import { getEnv } from "../../../tools/WegasHelper";
//TODO: refactor HumanHealth logic out of the_world
import { HumanHealth } from "../../legacy/the_world";
import { doAutomaticTriage_internal, PreTriageData, PreTriageResult } from "../../pretri/triage";

export function doPatientAutomaticTriage(patient: HumanBody): PreTriageResult<string> | undefined {

	const env = getEnv();

	const health: HumanHealth = {
		pathologies: patient.revivedPathologies!,
		effects: patient.effects!
	}

	if (patient == null || health == null) {
		return undefined;
	}

	const data: PreTriageData = {
		human: patient,
		env: env,
		health: health,
		actions: [],
		console: [],
	};

	return doAutomaticTriage_internal(data);
}

export function getNextNonPretriagedPatient(patients: HumanBody[], pretriageResults: Record<string, PreTriageResult<string>>): HumanBody | undefined {
	return patients.find(patient => pretriageResults[patient.id!] === undefined);
}

export function getNonPretriagedPatientsSize(patients: HumanBody[], pretriageResults: Record<string, PreTriageResult<string>>): number {
	return patients.filter(patient => pretriageResults[patient.id!] === undefined).length;
}

export function getPretriagedAmountByCategory(pretriageResults: Record<string, PreTriageResult<string>>): Record<string, number>{
	const amountsByCategory: Record<string, number> = {};
	Object.entries(pretriageResults).forEach(([key, value]) => {
		if (value.categoryId! in amountsByCategory)
			amountsByCategory[value.categoryId!] += 1;
		else
			amountsByCategory[value.categoryId!] = 1; 
	});
	return amountsByCategory;

}