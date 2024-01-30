/*
interface Data {
	notCategorized: number,
	underCategorized: number,
	overCategorized : number;
	correct: number;
}
*/

// type PerTarget = Record<string, FullEvent<CategorizeEvent>>;

function getEvents(inboxInstance /*: SInboxInstance*/) /*: FullEvent<EventPayload>[] */ {
	var rawMessages = Java.from(inboxInstance.getMessages());
	var events = [];
	for (var i in rawMessages) {
		var message = rawMessages[i];
		var json = I18n.t(message.getBody());
		var event = JSON.parse(json);

		event.id = message.getId();
		event.timestamp = message.getTime();

		events.push(event);
	}
	return events;
}

function getDashboard() {
	var events = getEvents(Variable.find(gameModel, 'events').getInstance(self));
	return getPretriage(events);
}

function objectValues(object) {
	var values = [];
	for (var k in object) {
		values.push(object[k]);
	}
	return values;
}

function getPretriage(events) {
	var nbPatients = 0;
	var presetId = Variable.find(gameModel, 'patientSet').getValue(self);

	if (presetId) {
		var presetString = Variable.find(gameModel, 'drill_Presets').getProperties()[presetId];
		if (presetString) {
			var preset = JSON.parse(presetString);
			if (preset) {
				nbPatients = Object.keys(preset.patients).length;
			}
		}
	}
	if (nbPatients == 0) {
		// fall back on all patients
		nbPatients = Variable.find(gameModel, 'patients').getInternalProperties().length;
	}

	var perPatients = objectValues(
		events
			.filter(function (event) {
				return event.payload.type === 'Categorize';
			})
			.sort(function (a, b) {
				return a.time - b.time;
			})
			.reduce(function (acc, event) {
				acc[event.payload.targetId] = event;
				return acc;
			}, {}),
	);

	return perPatients.reduce(
		function (acc, cur) {
			if (cur.payload.category === cur.payload.autoTriage.categoryId) {
				acc.correct++;
			} else if (cur.payload.severity < cur.payload.autoTriage.severity) {
				acc.underCategorized++;
			} else if (cur.payload.severity > cur.payload.autoTriage.severity) {
				acc.overCategorized++;
			}

			return acc;
		},
		{
			notCategorized: nbPatients - perPatients.length,
			correct: 0,
			underCategorized: 0,
			overCategorized: 0,
		},
	);
}

// DO NOT USE Helper.getDrillType()
// It may not have been initialized yet
var drillType = Variable.find(gameModel, 'drillType').getValue(self);

if (drillType === 'LIKERT') {
	var max = 60 * Variable.find(gameModel, 'patients').getProperties().size();
	WegasDashboard.registerVariable('likert', {
		kind: 'number',
		mapFn: function (teamId, data) {
			var counter = 0;
			var patients = data.getProperties().entrySet();
			patients.forEach(function (pData) {
				var parsed = JSON.parse(pData.getValue());
				for (var key in parsed.clinical) {
					for (var key2 in parsed.clinical[key]) {
						if (parsed.clinical[key][key2]) {
							counter++;
						}
					}
				}
				for (var key in parsed.physio) {
					for (var key2 in parsed.physio[key]) {
						if (parsed.physio[key][key2]) {
							counter++;
						}
					}
				}
			});
			return counter / max;
		},
		formatter: function (num) {
			return (num * 100).toFixed(2) + '%';
		},
	});
} else {
	// teamId => {correct: number, etc.}
	var catCache = {};

	WegasDashboard.registerVariable('events', {
		label: 'Not categorized',
		section: 'Pre-Triage',
		id: 'not_categorized',
		kind: 'number',
		mapFn: function (teamId, events) {
			var cache = catCache[teamId];
			if (!cache) {
				cache = getPretriage(getEvents(events));
				catCache[teamId] = cache;
			}
			return cache.notCategorized;
		},
		sortable: true,
	});

	WegasDashboard.registerVariable('events', {
		label: 'Correct',
		section: 'Pre-Triage',
		id: 'correct',
		kind: 'number',
		mapFn: function (teamId, events) {
			var cache = catCache[teamId];
			if (!cache) {
				cache = getPretriage(getEvents(events));
				catCache[teamId] = cache;
			}
			return cache.correct;
		},
		sortable: true,
	});

	WegasDashboard.registerVariable('events', {
		label: 'Over categorized',
		section: 'Pre-Triage',
		id: 'Overcategorized',
		kind: 'number',
		mapFn: function (teamId, events) {
			var cache = catCache[teamId];
			if (!cache) {
				cache = getPretriage(getEvents(events));
				catCache[teamId] = cache;
			}
			return cache.overCategorized;
		},
		sortable: true,
	});

	WegasDashboard.registerVariable('events', {
		label: 'Under categorized',
		section: 'Pre-Triage',
		id: 'undercategorized',
		kind: 'number',
		mapFn: function (teamId, events) {
			var cache = catCache[teamId];
			if (!cache) {
				cache = getPretriage(getEvents(events));
				catCache[teamId] = cache;
			}
			return cache.underCategorized;
		},
		sortable: true,
	});

	//inSim_ref
	//getCurrentTime

	WegasDashboard.registerVariable('inSim_ref', {
		//section: 'time',
		label: 'End time',
		id: 'time at end',
		formatter: function (seconds) {
			//quick and dirty to hour min sec
			var hours = Math.floor(seconds / 3600);
			var minutes = Math.floor((seconds % 3600) / 60);
			var sec = seconds % 60;

			var output = '';
			output += (hours < 10 ? '0' : '') + hours;
			output += ':' + (minutes < 10 ? '0' : '') + minutes;
			output += ':' + (sec < 10 ? '0' : '') + sec;
			return output;
		},

		sortable: true,
	});

	/*
	WegasDashboard.registerVariable('epoch_ref', {
		section: 'truc'
	});

	WegasDashboard.registerVariable('epoch_ref', {
		id: "trutrucucuc",
		section: 'truc'
	});
	*/

	WegasDashboard.setSectionLabel('Chose', 'truc');

	WegasDashboard.registerVariable('running');

	WegasDashboard.registerVariable('keepalive');
}
