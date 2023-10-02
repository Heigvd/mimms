import { getEnv, getPatientsBodyFactoryParamsArray } from "../../../tools/WegasHelper";
import { BodyEffect, computeState, createHumanBody, Environnment, HumanBody } from "../../../HUMAn/human";
import { mainSimLogger } from "../../../tools/logger";
import { RevivedPathology, revivePathology } from "../../../HUMAn/pathology";



export function loadPatients(): HumanBody[] {
	const env = getEnv();

	const patients = getPatientsBodyFactoryParamsArray()
		.map((bodyFactoryParamWithId) => bodyFactoryParamWithId.meta)
		.map(bodyParam => createHumanBody(bodyParam, env));

	//TODO: do we need the patient ID?

	mainSimLogger.info('Adding', patients.length,'patients');

	return patients;
}

export function computeNewPatientsState(patients: HumanBody[], timeJump: number, env: Environnment): void {
	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
	patients.forEach(patient => {
		if (patient.meta == null)
			throw `Unable to find meta for patient`;

		const pathologies: RevivedPathology[] = [];
		const effects: BodyEffect[] = []; //not implemented yet
		const healthConditions = patient.meta.scriptedEvents;
		healthConditions!.map(healthCondition =>{
			if (healthCondition.payload.type === 'HumanPathology') {
				try {
					const pathology = revivePathology(healthCondition.payload, healthCondition.time);
					pathologies.push(pathology);
					mainSimLogger.debug('Afflict Pathology: ', { pathology, time: healthCondition.time });
				} catch {
					mainSimLogger.warn(`Afflict Pathology Failed: Pathology "${healthCondition.payload.pathologyId}" does not exist`);
				}
			}
		});

		const from = patient.state.time;
		if (effects.length === 0 && pathologies.length === 0) {
			// no need to compute state; Human is stable
			patient.state.time = from + timeJump;
			mainSimLogger.debug('Skip Human');
		} else {
			mainSimLogger.debug('Update Human');
			for (let i = stepDuration; i <= timeJump; i += stepDuration) {
				mainSimLogger.debug('Compute Human Step ', { currentTime: patient.state.time, stepDuration, pathologies });
				computeState(patient.state, patient.meta, env, stepDuration, pathologies, effects);
				mainSimLogger.debug('Step Time: ', patient.state.time);
			}

			// last tick
			if (patient.state.time < from + timeJump) {
				mainSimLogger.debug('Compute Human Step ', {
					currentTime: patient.state.time,
					stepDuration: timeJump - patient.state.time,
					pathologies,
				});
				computeState(
					patient.state,
					patient.meta,
					env,
					from + timeJump - patient.state.time,
					pathologies,
					effects,
				);
			}
			mainSimLogger.debug('FinalStateTime: ', patient.state.time);
		}

	});
}