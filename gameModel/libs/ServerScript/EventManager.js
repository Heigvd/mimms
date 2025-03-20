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

  // TODO get rid of character logic for player aka whoAmI
  function instantiateCharacter(profileId, bagId) {
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
        sendNewEvent(giveBagPayload);
      }

      return id;
    }
    return '';
  }

  return {
    instantiateCharacter: instantiateCharacter,
    runScenario: runScenario,
    postNewEvent: sendNewEvent,
  };
})();
