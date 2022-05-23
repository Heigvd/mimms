/**
 * Server-side event manager
 */
var EventManager = ((function () {

	function lock(){
		// !!!!!!!!!!!!!! Do NOT load events before locking !!!!!!!!!!!!!!!!!

		// TODO: en fonction du mode de jeu
		// si global: NewEvent-gameId
		// si par équipe: NewEvent-teamId,
		RequestManager.lock("NewEvent-" + self.getGameId());
	}

	//returns human id
	function whoAmI () {
		return Variable.find(gameModel, 'whoAmI').getValue(self);
	}

	function sendEvent(event) {
		var events = Variable.find(gameModel, 'events');
		var instance = events.getInstance(self);

		lastEventI = Variable.find(gameModel, 'lastEventId').getInstance(self);
		lastId = lastEventI.getValue();

		var newEvent = instance.sendMessage(self.getName(), '' + lastId, JSON.stringify(event));
		// print ("NewEvent ID" + newEvent.getId());
		// Make sure newEvent got an Id
		// hack: commit request to force state machine evaluation
		//       This will flush all pending changes to DB
		//       newEvent got an ID
		RequestManager.commit();
		// print ("Post Commit NewEvent ID" + newEvent.getId());

		lastEventI.setValue(newEvent.getId());
	}

	function getEventTime(time){
		print("Time: " + time);
		if (time > 0){
			print("TheTime: " + time);
			return time;
		} else {
			var x = TimeManager.getCurrentTime();
			print("SimTime: " + x);
			return x;
		}
	}

	function buildHumanEvent(humanId, time) {
		return {
			time: getEventTime(time),
			targetType: 'Human',
			targetId: humanId,
		};
	}

	function buildCommunicationEvent(type, varRef){
		return {
			type: type,
			message: Variable.find(gameModel, varRef).getValue(self),
			time: getEventTime(time),
			sender : whoAmI()
		}
	}

	function buildRadioCreationEvent(name, channels, dfltChannel){
		return {
			type: "RadioCreation",
			time: getEventTime(),
			radioTemplate :{
				//id will be determined by event id itself
				name: name,
				availableChannels: channels,
				channel: dfltChannel
			}
		}
	}

	function buildRadioChannelUpdateEvent(id, channel){
		return {
			type: 'RadioChannelUpdate',
			time: getEventTime(),
			targetRadio: id,
			newChannel: channel
		}
	}

	function buildPhoneCreationEvent(){
		return {
			type: "PhoneCreation",
			time: getEventTime(),
			phoneTemplate :{
				//id will be determined by event id itself
				phoneName: whoAmI() + "'s phone",
			}
		}
	}

	return {
		/**
		 * object : {objectType: string, objectId: string}
		 * location: {mapId: string, x: number, y: number}
		 */
		teleport: function (object, location, time) {
			lock();
			print("Context: " + JSON.stringify(Context));
			print("Location: " + JSON.stringify(location));
			sendEvent({
				time: getEventTime(time),
				targetType: object.objectType,
				targetId: object.objectId,
				type: 'Teleport',
				location: {x: location.x, y: location.y, mapId: location.mapId }
			});
		},
		/**
		 * object : {objectType: string, objectId: string}
		 * destination: {mapId: string, x: number, y: number}
		 */
		followPath: function (object, from, destination, time) {
			lock();
			sendEvent({
				time: getEventTime(time),
				targetType: object.objectType,
				targetId: object.objectId,
				type: 'FollowPath',
				from: {x: from.x, y: from.y, mapId: from.mapId },
				destination: {x: destination.x, y: destination.y, mapId: destination.mapId }
			});
		},
		afflictPathology: function (humanId, pathologyId, blocks, time) {
			lock();
			var event = buildHumanEvent(humanId, time);
			event.type = 'HumanPathology';
			event.pathologyId = pathologyId;
			event.blocks = blocks;

			sendEvent(event);
		},
		
		/**
		 * source: {type: 'act', actId} | {type: 'itemAction', itemId, actionId}
		 */
		doHumanTreatment: function (humanId, source, blocks, time) {
			lock();
			var event = buildHumanEvent(humanId, time);
			event.type = 'HumanTreatment';
			event.source = source;
			event.blocks = blocks;

			sendEvent(event);
		},
		doHumanMeasure: function (humanId, source, time) {
			lock();
			var event = buildHumanEvent(humanId, time);
			event.type = 'HumanMeasure';
			event.source = source;

			sendEvent(event);
		},
		logMessageToPatientConsole: function (humanId, message, time) {
			lock();
			var event = buildHumanEvent(humanId, time);
			event.type = 'HumanLogMessage';
			event.message = message;

			sendEvent(event);
		},
		directCommunication: function(){
			lock();
			var event = buildCommunicationEvent('DirectCommunication', 'lastMsg');
			sendEvent(event);
		},
		radioCommunication: function(selectedRadioId, selectedChannel){
			lock();
			var event = buildCommunicationEvent('RadioCommunication', 'lastRadioMsg');
			event.senderRadioId = selectedRadioId;
			event.channel = selectedChannel;
			sendEvent(event);
		},
		radioCreation: function(name, channels, dfltChannel){
			lock();
			var event = buildRadioCreationEvent(name, channels, dfltChannel);
			sendEvent(event);
		},
		radioChannelUpdate: function(radioId, newChannelId){
			lock();
			print(radioId);
			print(newChannelId);
			var event = buildRadioChannelUpdateEvent(radioId, newChannelId);
			sendEvent(event);
		},
		phoneCommunication: function(senderPhoneId){
			lock();
			var event = buildCommunicationEvent('PhoneCommunication', 'lastPhoneMsg');
			event.recipientPhoneId = Variable.find(gameModel, 'recipientPhoneId').getValue(self);
			event.senderPhoneId = senderPhoneId;
			sendEvent(event);	
		},
		phoneCreation: function(){
			lock();
			var event = buildPhoneCreationEvent();
			sendEvent(event);
		}

	};
})());