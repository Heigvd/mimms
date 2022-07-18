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
	};
	return events;
}



function getDashboard() {
	var events = getEvents(Variable.find(gameModel, "events").getInstance(self));
	return getPretirage(events);

}


function objectValues(object) {
	var values = [];
	for (var k in object) {
		values.push(object[k]);
	}
	return values;
}

function getPretirage(events) {
	var nbPatients = Variable.find(gameModel, 'patients').getInternalProperties().length;

	var perPatients = objectValues(events.filter(function (event) {
		return event.payload.type === 'Categorize'
	})
		.sort(function (a, b) { return a.time - b.time })
		.reduce(function (acc, event) {
			acc[event.payload.targetId] = event;
			return acc;
		}, {}));


	return perPatients.reduce(function (acc, cur) {
		if (cur.payload.category === cur.payload.autoTriage.categoryId) {
			acc.correct++;
		} else if (cur.payload.severity < cur.payload.autoTriage.severity) {
			acc.underCategorized++;
		} else if (cur.payload.severity > cur.payload.autoTriage.severity) {
			acc.overCategorized++;
		}

		return acc;
	}, {
		notCategorized: nbPatients - perPatients.length,
		correct: 0,
		underCategorized: 0,
		overCategorized: 0,
	});
}

var drillType = Variable.find(gameModel, 'drillType').getValue(self);


if (drillType === 'LICKERT') {
	var max = 60 * Variable.find(gameModel, 'patients').getProperties().size();
	WegasDashboard.registerVariable('lickert', {
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
		formatter: function(num){
			return (num*100).toFixed(2) + "%";
		}
	})


} else {

	WegasDashboard.registerVariable("events", {
		label: 'Pre-Tri',
		kind: 'object',
		mapFn: function (teamId, events) {
			return getPretirage(getEvents(events));
		},
		formatter: function (data) {
			return Object.entries(data).map(function (entry) {
				return "<strong>" + entry[0] + ":</strong> " + entry[1];
			}).join("<br />");
		}
	});


	WegasDashboard.registerVariable('inSim_ref');
	WegasDashboard.registerVariable('epoch_ref');
	WegasDashboard.registerVariable('running');

	WegasDashboard.registerVariable('keepalive');

}