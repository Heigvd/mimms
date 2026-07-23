/* eslint-disable no-var */

// Functions also used by MultiplayerHelper
var Long = Java.type('java.lang.Long');

function inferPlayer(teamId) {
  var player = undefined;
  if (teamId) {
    var team = findTeamById(teamId);
    if (team) {
      player = team.getAnyLivePlayer();
    }
  }
  return player || self;
}

function findTeamById(id) {
  var teams = self.getGame().getTeams();
  //teams.stream().forEach(function(t) {if(t.getId().equals(new Long(1087156))){team = t;}});
  return teams
    .stream()
    .filter(function (t) {
      return t.getId().equals(new Long(id));
    })
    .findFirst()
    .get();
}

/**
 * Server-side event manager
 */
var EventManager = (function () {
  function lock(player) {
    var thePlayer = player || self;
    // !!!!!!!!!!!!!! Do NOT load events before locking !!!!!!!!!!!!!!!!!

    RequestManager.lock('NewEvent-' + thePlayer.getTeamId());
  }

  /**
   * New implementation using new EventBox dedicated type
   */
  function sendNewEvent(payload, time, teamId) {
    var player = inferPlayer(teamId);

    lock(player);

    var realTime = getEventTime(time, player);

    var events = Variable.find(gameModel, 'newEvents');
    var instance = events.getInstance(player);

    var event = {
      time: realTime,
      payload: payload,
    };

    instance.sendEvent(JSON.stringify(event));
    // Make sure newEvent got an Id
    // hack: commit request to force state machine evaluation
    // This will flush all pending changes to DB
    // => the newEvent gets an ID
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

  return {
    postNewEvent: sendNewEvent,
  };
})();
