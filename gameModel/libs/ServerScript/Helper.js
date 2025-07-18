/**
 * Server-side time manager
 */
var MimmsHelper = (function () {
  function isDrillMode() {
    return Variable.find(gameModel, 'gameMode').getValue(self) === 'pretriMode';
  }

  function getDrillType() {
    return Variable.find(gameModel, 'drillType').getValue(self);
  }

  function getPlayers() {
    return self.getGame().getPlayers();
  }

  function charactersInfo() {
    var allCharactersByTeamId = Variable.getInstancesByKeyId(
      Variable.find(gameModel, 'characters')
    );
    return allCharactersByTeamId;
  }

  // TODO better metric, see issue https://github.com/Heigvd/mimms/issues/59
  function simRefs() {
    return Variable.getInstancesByKeyId(Variable.find(gameModel, 'inSim_ref'));
  }

  return {
    isDrillMode: isDrillMode,
    getDrillType: getDrillType,
    getPlayers: getPlayers,
    charactersInfo: charactersInfo,
    getEndTimes: simRefs,
  };
})();

/**
 * Server-side multiplayer manager
 */
var MultiplayerHelper = (function () {
  function getTeams() {
    var teams = gameModel.getTeams();
    return teams;
  }

  function getMultiplayerMatrix() {
    var matrixByTeams = Variable.getInstancesByKeyId(Variable.find(gameModel, 'multiplayerMatrix'));
    return matrixByTeams;
  }

  function registerSelf() {
    const currentPlayerId = self.getId();
    const playableRoles = {
      AL: true,
      ACS: true,
      MCS: true,
      EVASAN: true,
      LEADPMA: true,
    };

    if (currentPlayerId) {
      const playerMatrix = {
        id: currentPlayerId,
        ready: false,
        roles: playableRoles,
      };
      Variable.find(gameModel, 'multiplayerMatrix')
        .getInstance(self)
        .setProperty(currentPlayerId.toString(), JSON.stringify(playerMatrix));
    }
  }

  function updatePlayerMatrix(teamId, playerId, playerMatrix) {
    var player = inferPlayer(teamId);

    Variable.find(gameModel, 'multiplayerMatrix')
      .getInstance(player)
      .setProperty(playerId, playerMatrix);
  }

  return {
    registerSelf: registerSelf,
    getMultiplayerMatrix: getMultiplayerMatrix,
    getTeams: getTeams,
    updatePlayerMatrix: updatePlayerMatrix,
  };
})();
