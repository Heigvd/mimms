CustomDashboard = (function () {
  function getInstances(name) {
    return Variable.getInstancesByKeyId(Variable.find(gameModel, name));
  }

  function getEventsByTeam() {
    var evtBoxes = getInstances('newEvents');

    var byTeamEvents = {};
    evtBoxes
      .entrySet()
      .stream()
      .forEach(function (entry) {
        var teamId = entry.getKey();
        var box = entry.getValue();
        byTeamEvents[teamId] = box.getEvents();
      });

    return byTeamEvents;
  }

  function getStoredStatesByTeam() {
    return getInstances('currentState');
  }

  function getGameState(teamId) {
    var player = inferPlayer(teamId);

    return Variable.find(gameModel, 'gameState').getValue(player);
  }

  function setGameState(teamId, value) {
    var player = inferPlayer(teamId);

    Variable.find(gameModel, 'gameState').setAllowedValue(player, value);
  }

  return {
    getInstances: getInstances,
    getEventsByTeam: getEventsByTeam,
    getStoredStatesByTeam: getStoredStatesByTeam,
    getGameState: getGameState,
    setGameState: setGameState,
  };
})();
