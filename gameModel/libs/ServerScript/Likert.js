
var demographics = [
	'gender',
	'age',
	'fmh',
	'fmhInternalMedicine',
	'fmhAnesthesiology',
	'fmhIntensiveMedicine',
	'fmhOther',
	'fmhOtherDetails',
	'afc',
	'afcIntraHosp',
	'afcExtraHosp',
	'ySinceDiploma',
	'yPreHospXp',
]

function shouldExtract(owner) {
	if (gameModel.getType().toString() === 'PLAY') {
		// real game
		var isPlayer = owner.getJSONClassName() === 'Player';

		if (isPlayer) {
			return owner.getParentType() !== 'DebugTeam';
		} else {
			return owner.getJSONClassName() !== 'DebugTeam';
		}
	} else {
		// dev mode -> extract all playes, included debug team/players
		return true;
	}
}

function getLickerData() {
	var result = {};
	var instancesMap = Variable.getInstances(Variable.find(gameModel, "likert"));


	instancesMap.entrySet().forEach(function (entry) {
		if (shouldExtract(entry.getKey())) {
			var teamId = entry.getKey().getId();
			var properties = entry.getValue().getProperties();
			result[teamId] = {};
			properties.entrySet().forEach(function (pEntry) {
				var patientId = pEntry.getKey();
				var data = JSON.parse(pEntry.getValue());
				result[teamId][patientId] = data;
			});
		}
	});

	var demo = {};

	for (var i in demographics) {
		var demoVarName = demographics[i];
		var instancesMap = Variable.getInstances(Variable.find(gameModel, demoVarName));

		instancesMap.entrySet().forEach(function (entry) {
			if (shouldExtract(entry.getKey())) {
				// demographic variables always owned by players
				var teamId = entry.getKey().getParentId();
				var variableInstance = entry.getValue();
				demo[teamId] = demo[teamId] || {};
				demo[teamId][demoVarName] = variableInstance.getValue();
			}
		});
	}



	return { data: result, demographics: demo };
}

