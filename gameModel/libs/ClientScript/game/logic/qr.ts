import { getMultiplayerMode, getRealLifeRole } from "./gameMaster";

interface ActAsPatient {
	type: 'ActAsPatient';
	patientId: string;
}

interface ActAsCharacter {
	type: 'ActAsCharacter';
	skillId: string;
}

interface ExaminePatient {
	type: 'ExaminePatient';
	patientId: string;
}

export function actAsCharacterPayload(skillId: string): ActAsCharacter {
	return {
		type: 'ActAsCharacter',
		skillId: btoa(skillId),
	}
}

function isActAsCharacter(data: unknown): data is ActAsCharacter {
	if (typeof data === 'object' && data != null) {
		if ('type' in data) {
			if ((data as { type: string }).type === 'ActAsCharacter') {
				// type is fine
				if ('skillId' in data) {
					if ((data as { skillId: string }).skillId) {
						return true;
					}
				}
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

export function processQrCode(rawDta: string) {
	const mode = getMultiplayerMode();
	if (mode != 'REAL_LIFE') {
		return;
	}

	const role = getRealLifeRole();
	try {
		const data = JSON.parse(rawDta);
		if (isActAsCharacter(data)) {
			if (role === 'NONE' || !role) {
				const skillId = atob(data.skillId);
				APIMethods.runScript(
					`Variable.find(gameModel, 'realLifeRole').setValue(self, 'HEALTH_SQUAD');`, {});
			}
		} else if (isActAsPatient(data)) {
			if (role === 'NONE' || !role) {
				const patientId = atob(data.patientId);
				const patientExists = Variable.find(gameModel, 'patients');
				if (patientExists) {
					APIMethods.runScript(
						`Variable.find(gameModel, "currentPatient").setValue(self, "${patientId}");
				 		 Variable.find(gameModel, 'realLifeRole').setValue(self, 'PATIENT');`
						, {});
				}
			}
		} else if (isExaminePatient(data)) {
			if (role === 'HEALTH_SQUAD') {
				const patientId = atob(data.patientId);
				const patientExists = Variable.find(gameModel, 'patients');
				if (patientExists) {
					APIMethods.runScript(
						`Variable.find(gameModel, "currentPatient").setValue(self, "${patientId}");`
						, {});
				}
			}
		}
	} catch {

	}
}


