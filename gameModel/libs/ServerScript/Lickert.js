

function getLickerData() {
	var result = {};
	var instancesMap = Variable.getInstances(Variable.find(gameModel, "lickert"));


	instancesMap.entrySet().forEach(function(entry) {
		var teamId = entry.getKey().getId();
		var properties = entry.getValue().getProperties();
		result[teamId] = {};
		properties.entrySet().forEach(function(pEntry) {
			var patientId = pEntry.getKey();
			var data = JSON.parse(pEntry.getValue());
			result[teamId][patientId] = data;
		});
	});

	return result;
}

