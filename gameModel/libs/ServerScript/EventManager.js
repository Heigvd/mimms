/**
 * Server-side event manager
 */
var EventManager = ((function () {

	function lock(){
		// !!!!!!!!!!!!!! Do NOT load events before locking !!!!!!!!!!!!!!!!!

		// TODO: en fonction du mode de jeu
		// si global: NewEvent-gameId
		// si par équipe: NewEvent-teamId,
		RequestManager.lock("NewEvent-" + self.getTeamId());
	}

	function sendEvent(payload, time) {
		lock();
		var realTime = getEventTime(time);

		var events = Variable.find(gameModel, 'events');
		var instance = events.getInstance(self);

		lastEventI = Variable.find(gameModel, 'lastEventId').getInstance(self);
		lastId = lastEventI.getValue();

		var event = {
			time: realTime,
			payload: payload,
		}

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
		if (time > 0){
			return time;
		} else {
			var x = TimeManager.getCurrentTime();
			return x;
		}
	}

	return {
		postEvent: function (payload, time) {
			sendEvent(payload, time);
		},
	};
})());