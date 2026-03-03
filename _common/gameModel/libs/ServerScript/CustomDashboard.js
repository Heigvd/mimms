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
        byTeamEvents[teamId] = { events: box.getEvents(), eventBoxId: box.getId() };
      });

    return byTeamEvents;
  }

  function getGameStateByTeam() {
    var gameStates = getInstances('gameState');

    var byTeamGameState = [];
    gameStates
      .entrySet()
      .stream()
      .forEach(function (entry) {
        var teamId = entry.getKey();
        var gameStateVar = entry.getValue();
        var teamGameState = {
          id: teamId,
          gameState: gameStateVar.getValue(),
        };
        byTeamGameState.push(teamGameState);
      });

    return byTeamGameState;
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
    getGameStateByTeam: getGameStateByTeam,
    getGameState: getGameState,
    setGameState: setGameState,
  };
})();
