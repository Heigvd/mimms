import { FogType } from "./the_world";




export function getGamePageId() {
	if (gameModel.getProperties().getFreeForAll()){
		// DRILL / individually
		const drillType = Variable.find(gameModel, 'drillType').getValue(self);
		if (drillType === 'PRE-TRIAGE'){
			return "12";
		} else if (drillType === "PRE-TRIAGE_ON_MAP"){
			return "11";
		}
	} else {
		// multiplayers game
		// always on map
		return "11";
	}

	return "404";
}


export function getFogType() : FogType {
	if (gameModel.getProperties().getFreeForAll()){
		// DRILL / individually
		const drillType = Variable.find(gameModel, 'drillType').getValue(self);
		if (drillType === 'PRE-TRIAGE'){
			// not map, all humans are visible
			return 'NONE';
		} else if (drillType === "PRE-TRIAGE_ON_MAP"){
			// On map -> only visible humans are visible
			return "SIGHT";
		}
	} else {
		// multiplayers game
		// always on map
		return "SIGHT";
	}

	return "SIGHT";
}
