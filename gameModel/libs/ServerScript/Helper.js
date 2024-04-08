/**
 * Server-side time manager
 */
var MimmsHelper = (function () {
  function isDrillMode() {
    return gameModel.getProperties().getFreeForAll();
  }

  function isRealLifeGame() {
    return (
      isDrillMode() === false &&
      Variable.find(gameModel, 'multiplayerMode').getValue(self) === 'REAL_LIFE'
    );
  }

  function getDrillType() {
    return Variable.find(gameModel, 'drillType').getValue(self);
  }

  function shouldRunScenarioOnFirstStart() {
    if (isDrillMode()) {
      // only triage on map requires to run the predefined scenario
      return getDrillType() === 'PRE-TRIAGE_ON_MAP';
    } else {
      // all multiplayer modes require to run it
      return true;
    }
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
    isRealLifeGame: isRealLifeGame,
    shouldRunScenarioOnFirstStart: shouldRunScenarioOnFirstStart,
    getPlayers: getPlayers,
    charactersInfo: charactersInfo,
    getEndTimes: simRefs,
  };
})();
