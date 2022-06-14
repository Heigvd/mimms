



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
