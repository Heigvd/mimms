import { HumanBody } from '../../../HUMAn/human';
import { PreTriageResult } from '../../pretri/triage';
import { MainSimulationState } from './mainSimulationState';
import { Location, PatientId } from '../baseTypes';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export type PatientState = {
	patientId: PatientId;
	humanBody : HumanBody;
	location : Location | undefined;
	preTriageResult: PreTriageResult<string> | undefined;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function getNextNonPreTriagedPatient(state: Readonly<MainSimulationState>): PatientState | undefined {
	const internalState = state.getInternalStateObject();
	return internalState.patients.find(patient => patient.preTriageResult === undefined);
}

export function getNonPreTriagedPatientsSize(state: Readonly<MainSimulationState>): number {
	const internalState = state.getInternalStateObject();
	return internalState.patients.filter(patient => patient.preTriageResult === undefined).length;
}

export function getPreTriagedAmountByCategory(state: Readonly<MainSimulationState>): Record<string, number> {
	const internalState = state.getInternalStateObject();
	const amountsByCategory: Record<string, number> = {};

	internalState.patients
		.map(patient => patient.preTriageResult?.categoryId)
		.filter(categoryId => categoryId != null)
		.forEach(category => {
			if (category! in amountsByCategory) {
				amountsByCategory[category!] += 1;
			} else {
				amountsByCategory[category!] = 1;
			}
		});

	return amountsByCategory;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
