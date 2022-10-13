var PatientDashboard = ((function () {

	function getPatientIds() {
		var patients = Variable.find(gameModel, "patients").getInternalProperties();
		var keys = [];
		for (var k in patients) {
			keys.push(patients[k].getKey());
		}
		return keys;
	}



	function overview() {
		var patientKeys = getPatientIds();
		var patients = {};

		// get all events for all teams
		var allEventsByTeamId = Variable.getInstancesByKeyId(Variable.find(gameModel, "events"));

		// process each team events
		allEventsByTeamId.values().stream().forEach(function (rawEvents) {
			events = getEvents(rawEvents);

			// extract most recent Categorize event for each patient 
			var perPatients = events.filter(function (event) {
				return event.payload.type === 'Categorize'
			})
				.sort(function (a, b) { return a.time - b.time })
				.reduce(function (acc, event) {
					acc[event.payload.targetId] = event;
					return acc;
				}, {});

			for (var i in patientKeys) {
				var patient = patientKeys[i];

				var acc = patients[patient] || {};
				patients[patient] = acc;

				if (perPatients[patient]) {
					var event = perPatients[patient];
					if (event.payload.category === event.payload.autoTriage.categoryId) {
						acc.correct = (acc.correct || 0) + 1;
					} else if (event.payload.severity < event.payload.autoTriage.severity) {
						acc.underCategorized = (acc.underCategorized || 0) + 1;
					} else if (event.payload.severity > event.payload.autoTriage.severity) {
						acc.overCategorized = (acc.overCategorized || 0) + 1;
					}
				} else {
					acc.notCategorized = (acc.notCategorized || 0) + 1
				}
			}
		});

		return patients;
	}

	return {
		overview: overview,
	}
})());