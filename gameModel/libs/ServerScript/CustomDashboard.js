CustomDashboard = (function () {
  var Long = Java.type('java.lang.Long');

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

  return {
    getInstances: getInstances,
    getEventsByTeam: getEventsByTeam,
  };
})();
