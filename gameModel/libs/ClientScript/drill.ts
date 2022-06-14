import { getCurrentPatientBody } from "./the_world";


export function isCurrentPatientCategorized(){
	const current = getCurrentPatientBody();
	return current?.category != null;
}

export function selectNextPatient() {

	

	APIMethods.runScript("Variable.find(gameModel, 'currentPatient').setValue(self, 'oscar')", {});	
}