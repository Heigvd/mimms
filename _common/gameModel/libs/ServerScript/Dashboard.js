/*
interface Data {
	notCategorized: number,
	underCategorized: number,
	overCategorized : number;
	correct: number;
}
*/

var eventsVarName = 'newEvents';

/**
 * parses the events in an event inbox
 * @return the deserialized events payloads FullEvent<EventPayload>[]
 */
function getEvents(inboxInstance /*: SEventInboxInstance */) {
  var events = [];
  var rawEvents = inboxInstance.getEvents();
  for (var i in rawEvents) {
    events.push(JSON.parse(rawEvents[i].payload));
  }
  return events;
}

function objectValues(object) {
  var values = [];
  for (var k in object) {
    values.push(object[k]);
  }
  return values;
}

function getPretriage(events) {
  var nbPatients = Variable.find(gameModel, 'patients').getInternalProperties().length;

  var perPatients = objectValues(
    events
      .filter(function (event) {
        return event.payload.type === 'Categorize';
      })
      .sort(function (a, b) {
        return a.time - b.time;
      })
      .reduce(function (acc, event) {
        acc[event.payload.targetId] = event;
        return acc;
      }, {})
  );

  return perPatients.reduce(
    function (acc, cur) {
      if (cur.payload.category === cur.payload.autoTriage.categoryId) {
        acc.correct++;
      } else if (cur.payload.severity < cur.payload.autoTriage.severity) {
        acc.underCategorized++;
      } else if (cur.payload.severity > cur.payload.autoTriage.severity) {
        acc.overCategorized++;
      }

      return acc;
    },
    {
      notCategorized: nbPatients - perPatients.length,
      correct: 0,
      underCategorized: 0,
      overCategorized: 0,
    }
  );
}

// DO NOT USE Helper.getDrillType()
// It may not have been initialized yet
var drillType = Variable.find(gameModel, 'drillType').getValue(self);

if (drillType === 'LIKERT') {
  var max = 60 * Variable.find(gameModel, 'patients').getProperties().size();
  WegasDashboard.registerVariable('likert', {
    kind: 'number',
    mapFn: function (teamId, data) {
      var counter = 0;
      var patients = data.getProperties().entrySet();
      patients.forEach(function (pData) {
        var parsed = JSON.parse(pData.getValue());
        for (var key in parsed.clinical) {
          for (var key2 in parsed.clinical[key]) {
            if (parsed.clinical[key][key2]) {
              counter++;
            }
          }
        }
        for (var key in parsed.physio) {
          for (var key2 in parsed.physio[key]) {
            if (parsed.physio[key][key2]) {
              counter++;
            }
          }
        }
      });
      return counter / max;
    },
    formatter: function (num) {
      return (num * 100).toFixed(2) + '%';
    },
  });
} else {
  // teamId => {correct: number, etc.}
  var catCache = {};

  WegasDashboard.registerVariable(eventsVarName, {
    label: 'Not categorized',
    section: 'Pre-Triage',
    id: 'not_categorized',
    kind: 'number',
    mapFn: function (teamId, events) {
      var cache = catCache[teamId];
      if (!cache) {
        cache = getPretriage(getEvents(events));
        catCache[teamId] = cache;
      }
      return cache.notCategorized;
    },
    sortable: true,
  });

  WegasDashboard.registerVariable(eventsVarName, {
    label: 'Correct',
    section: 'Pre-Triage',
    id: 'correct',
    kind: 'number',
    mapFn: function (teamId, events) {
      var cache = catCache[teamId];
      if (!cache) {
        cache = getPretriage(getEvents(events));
        catCache[teamId] = cache;
      }
      return cache.correct;
    },
    sortable: true,
  });

  WegasDashboard.registerVariable(eventsVarName, {
    label: 'Over categorized',
    section: 'Pre-Triage',
    id: 'Overcategorized',
    kind: 'number',
    mapFn: function (teamId, events) {
      var cache = catCache[teamId];
      if (!cache) {
        cache = getPretriage(getEvents(events));
        catCache[teamId] = cache;
      }
      return cache.overCategorized;
    },
    sortable: true,
  });

  WegasDashboard.registerVariable(eventsVarName, {
    label: 'Under categorized',
    section: 'Pre-Triage',
    id: 'undercategorized',
    kind: 'number',
    mapFn: function (teamId, events) {
      var cache = catCache[teamId];
      if (!cache) {
        cache = getPretriage(getEvents(events));
        catCache[teamId] = cache;
      }
      return cache.underCategorized;
    },
    sortable: true,
  });

  WegasDashboard.registerVariable('latest_pretri_time', {
    label: 'End time',
    id: 'time at end',
    formatter: function (seconds) {
      //quick and dirty to hour min sec
      var hours = Math.floor(seconds / 3600);
      var minutes = Math.floor((seconds % 3600) / 60);
      var sec = seconds % 60;

      var output = '';
      output += (hours < 10 ? '0' : '') + hours;
      output += ':' + (minutes < 10 ? '0' : '') + minutes;
      output += ':' + (sec < 10 ? '0' : '') + sec;
      return output;
    },

    sortable: true,
  });
}
