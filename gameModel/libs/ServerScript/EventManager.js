/* eslint-disable no-var */
/**
 * Server-side event manager
 */
var EventManager = (function () {
	function lock(player) {
		var thePlayer = player || self;
		// !!!!!!!!!!!!!! Do NOT load events before locking !!!!!!!!!!!!!!!!!

		RequestManager.lock('NewEvent-' + thePlayer.getTeamId());
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
		};

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

	/**
	 * New implementation using new EventBox dedicated type
	 */
	function sendNewEvent(payload, time, player) {
		lock();
		var thePlayer = player || self;
		var realTime = getEventTime(time, thePlayer);

		var events = Variable.find(gameModel, 'newEvents');
		var instance = events.getInstance(thePlayer);

		var event = {
			time: realTime,
			payload: payload,
		};

		instance.sendEvent(JSON.stringify(event));
		// Make sure newEvent got an Id
		// hack: commit request to force state machine evaluation
		//       This will flush all pending changes to DB
		//       newEvent got an ID
		RequestManager.commit();
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

		Variable.find(gameModel, 'patients')
			.getProperties()
			.entrySet()
			.stream()
			.forEach(function (entry) {
				var patientId = entry.getKey();
				var raw = entry.getValue();
				var data = JSON.parse(raw);

				list.push({
					id: patientId,
					data: data,
				});
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

		var alreadyDone = Variable.find(gameModel, 'scenarioRevived').getValue(thePlayer);
		if (!alreadyDone) {
			var emitter = {
				emitterCharacterId: '',
				emitterPlayerId: thePlayer.getId(),
			};
			var patients = getParsedPatients();
			for (var i in patients) {
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

			Variable.find(gameModel, 'scenarioRevived').setValue(thePlayer, true);
		}
	}

	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	function generateRandomId(length) {
		var id = '';

		for (var i = 0; i < length; i++) {
			id += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return id;
	}

	function generateUniqueId() {
		var existing = Variable.find(gameModel, 'characters').getInstance(self).getProperties();
		var name = generateRandomId(3);
		var counter = 0;
		var id = 'char-' + name;

		// make sure to avoid collisions by appending numeric suffix
		while (existing.containsKey(id)) {
			counter++;
			id = 'char-' + name + '-' + counter;
		}
		return id;
	}

	function instantiateCharacter(profileId, bagId, useEventBox) {
		lock();
		var charactersDesc = Variable.find(gameModel, 'characters');
		var strProfile = charactersDesc.getProperty(profileId);

		if (strProfile) {
			var profile = JSON.parse(strProfile);
			var skillId = profile.skillId;

			var bodyFactoryParam = {
				age: 30,
				sex: Math.random() < 0.5 ? 'male' : 'female',
				bmi: 22.5,
				height_cm: 175,
				lungDepth: 1,
				scriptedEvents: [],
				description: '',
				skillId: skillId,
			};
			var id = generateUniqueId();
			var jsonParam = JSON.stringify(bodyFactoryParam);

			// persist data and set whoiAmI
			Variable.find(gameModel, 'whoAmI').setValue(self, id);
			charactersDesc.getInstance().setProperty(id, jsonParam);

			if (bagId) {
				var giveBagPayload = {
					emitterPlayerId: self.getId(),
					emitterCharacterId: id,
					type: 'GiveBag',
					targetType: 'Human',
					targetId: id,
					bagId: bagId,
				};
				if (useEventBox) {
					sendNewEvent(giveBagPayload);
				} else {
					sendEvent(giveBagPayload);
				}
			}

			return id;
		}
		return '';
	}

	return {
		instantiateCharacter: function (profileId, bagId) {
			instantiateCharacter(profileId, bagId, false);
		},
		instantiateCharacterNew: function (profileId, bagId) {
			instantiateCharacter(profileId, bagId, true);
		},
		runScenario: runScenario,
		postEvent: function (payload, time) {
			sendEvent(payload, time);
		},
		postNewEvent: function (payload, time) {
			sendNewEvent(payload, time);
		},
	};
})();
