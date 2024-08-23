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

  return {
    getInstances: getInstances,
    getEventsByTeam: getEventsByTeam,
    getStoredStatesByTeam: getStoredStatesByTeam,
  };
})();
