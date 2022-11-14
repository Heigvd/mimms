/**
 * Server-side event manager
 */
var EventManager = ((function () {

	function lock(player) {
		var thePlayer = player || self;
		// !!!!!!!!!!!!!! Do NOT load events before locking !!!!!!!!!!!!!!!!!

		RequestManager.lock("NewEvent-" + thePlayer.getTeamId());
	}

	function sendEvent(payload, time, player) {
		lock();
		var thePlayer = player || self;
		var realTime = getEventTime(time, thePlayer);

		var events = Variable.find(gameModel, 'events');
		var instance = events.getInstance(thePlayer);

		lastEventI = Variable.find(gameModel, 'lastEventId').getInstance(thePlayer);
		lastId = lastEventI.getValue();

		var event = {
			time: realTime,
			payload: payload,
		}

		var newEvent = instance.sendMessage(thePlayer.getName(), '' + lastId, JSON.stringify(event));
		// print ("NewEvent ID" + newEvent.getId());
		// Make sure newEvent got an Id
		// hack: commit request to force state machine evaluation
		//       This will flush all pending changes to DB
		//       newEvent got an ID
		RequestManager.commit();
		// print ("Post Commit NewEvent ID" + newEvent.getId());

		lastEventI.setValue(newEvent.getId());
	}

	function getEventTime(time, player) {
		if (time > 0) {
			return time;
		} else {
			var x = TimeManager.getCurrentTime(player);
			return x;
		}
	}


	function getParsedPatients() {
		var list = [];

		Variable.find(gameModel, 'patients').getProperties().entrySet().stream().forEach(function (entry) {
			var patientId = entry.getKey();
			var raw = entry.getValue();
			var data = JSON.parse(raw);

			list.push({
				id: patientId,
				data: data
			})
		});

		return list;
	}
	function revivePayload(emitter, patientId, event) {
		var payload = {};

		for (var key in event.payload) {
			payload[key] = event.payload[key];
		}

		payload.emitterCharacterId = emitter.emitterCharacterId;
		payload.emitterPlayerId = emitter.emitterPlayerId;

		payload.targetId = patientId;

		return payload;
	}

	function runScenario(player) {
		lock();
		var thePlayer = player || self;

		var alreadyDone = Variable.find(gameModel, "scenarioRevived").getValue(thePlayer);
		if (!alreadyDone) {
			var emitter = {
				emitterCharacterId: "",
				emitterPlayerId: thePlayer.getId(),
			};
			var patients = getParsedPatients();
			for (var i in patients){
				var patient = patients[i];
				var events = patient.data.scriptedEvents;
				if (events) {
					for (var j in events) {
						var event = events[j];
						var payload = revivePayload(emitter, patient.id, event);
						sendEvent(payload, event.time, thePlayer);
					}
				}

			}

			Variable.find(gameModel, "scenarioRevived").setValue(thePlayer, true);
		}
	}

	return {
		runScenario: runScenario,
		postEvent: function (payload, time) {
			sendEvent(payload, time);
		},
	};
})());