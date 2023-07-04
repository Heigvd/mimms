import { logger } from "../../tools/logger";
import { getDefaultBag, getMultiplayerMode, getRealLifeRole } from "./gameMaster";

interface ActAsPatient {
	type: 'ActAsPatient';
	patientId: string;
}

interface ActAsCharacter {
	type: 'ActAsCharacter';
	profileId: string;
}

interface ActAsObserver {
	type: 'ActAsObserver';
}

interface ExaminePatient {
	type: 'ExaminePatient';
	patientId: string;
}

export function actAsCharacterPayload(profileId: string): ActAsCharacter {
	return {
		type: 'ActAsCharacter',
		profileId: btoa(profileId),
	}
}

function isActAsCharacter(data: unknown): data is ActAsCharacter {
	if (typeof data === 'object' && data != null) {
		if ('type' in data) {
			if ((data as { type: string }).type === 'ActAsCharacter') {
				// type is fine
				if ('profileId' in data) {
					if ((data as { profileId: string }).profileId) {
						return true;
					}
				}
			}
		}
	}
	return false;
}


export function actAsObserverPayload(): ActAsObserver {
	return {
		type: 'ActAsObserver',
	}
}

function isActAsObserver(data: unknown): data is ActAsObserver {
	if (typeof data === 'object' && data != null) {
		if ('type' in data) {
			if ((data as { type: string }).type === 'ActAsObserver') {
				// type is fine
				return true;
			}
		}
	}
	return false;
}

export function actAsPatientPayload(patientId: string): ActAsPatient {
	return {
		type: 'ActAsPatient',
		patientId: btoa(patientId),
	}
}

function isActAsPatient(data: unknown): data is ActAsPatient {
	if (typeof data === 'object' && data != null) {
		if ('type' in data) {
			if ((data as { type: string }).type === 'ActAsPatient') {
				// type is fine
				if ('patientId' in data) {
					if ((data as { patientId: string }).patientId) {
						return true;
					}
				}
			}
		}
	}
	return false;
}

export function examinePatientPayload(patientId: string): ExaminePatient {
	return {
		type: 'ExaminePatient',
		patientId: btoa(patientId),
	}
}

function isExaminePatient(data: unknown): data is ExaminePatient {
	if (typeof data === 'object' && data != null) {
		if ('type' in data) {
			if ((data as { type: string }).type === 'ExaminePatient') {
				// type is fine
				if ('patientId' in data) {
					if ((data as { patientId: string }).patientId) {
						return true;
					}
				}
			}
		}
	}
	return false;
}

export async function processQrCode(rawData: string) {
	const mode = getMultiplayerMode();
	if (mode != 'REAL_LIFE') {
		return;
	}
	
	const bagId = getDefaultBag();
	const bagScript = bagId ? `, ${JSON.stringify(bagId)}` : '';

	const role = getRealLifeRole();
	try {
		const data = JSON.parse(rawData);
		if (isActAsCharacter(data)) {
			if (role === 'NONE' || !role) {
				const profileId = atob(data.profileId);
				return APIMethods.runScript(
					`EventManager.instantiateCharacter(${JSON.stringify(profileId)}${bagScript});
					Variable.find(gameModel, 'realLifeRole').setValue(self, 'HEALTH_SQUAD');`, {});
			}
		} else if (isActAsPatient(data)) {
			if (role === 'NONE' || !role) {
				const patientId = atob(data.patientId);
				const patientExists = !!Variable.find(gameModel, 'patients').getProperties()['A-5'];
				if (patientExists) {
					return APIMethods.runScript(
						`Variable.find(gameModel, "currentPatient").setValue(self, "${patientId}");
						 Variable.find(gameModel, "whoAmI").setValue(self, "${patientId}");
				 		 Variable.find(gameModel, 'realLifeRole').setValue(self, 'PATIENT');
						`
						, {});
				}
			}
		} else if (isActAsObserver(data)) {
			if (role === 'NONE' || !role) {
				const profileId = Variable.find(gameModel, 'defaultProfile').getValue(self);
				return APIMethods.runScript(
					`EventManager.instantiateCharacter(${JSON.stringify(profileId)}${bagScript});
					Variable.find(gameModel, 'realLifeRole').setValue(self, 'OBSERVER');`, {});
			}
		} else if (isExaminePatient(data)) {
			if (role === 'HEALTH_SQUAD') {
				const patientId = atob(data.patientId);
				const patientExists = Variable.find(gameModel, 'patients');
				if (patientExists) {
					return APIMethods.runScript(
						`Variable.find(gameModel, "currentPatient").setValue(self, "${patientId}");`
						, {});
				}
			}
		}
	} catch(e) {
		logger.info(e);
	}
}


