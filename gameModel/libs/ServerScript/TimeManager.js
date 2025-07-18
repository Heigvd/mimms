/* eslint-disable no-var */
/**
 * Server-side time manager
 */
var TimeManager = (function () {
  function runForAllTeams(fn) {
    self
      .getGame()
      .getTeams()
      .stream()
      .map(function (team) {
        return team.getAnyLivePlayer();
      })
      .forEach(function (player) {
        if (player) {
          fn(player);
        }
      });
  }

  var KEEPALIVE_DELAY_S = 30; // 30 seconds

  // TODO called only once : simplify
  function computeEpochSimulationTime(player, epoch) {
    var thePlayer = player || self;
    var inSim_ref = Variable.find(gameModel, 'inSim_ref').getValue(thePlayer);
    var epoch_ref = Variable.find(gameModel, 'epoch_ref').getValue(thePlayer);

    /*if (epoch < epoch_ref) {
			return epoch_ref;
		}*/

    var delta_s = Math.floor((epoch - epoch_ref) / 1000);
    return inSim_ref + delta_s;
  }

  // TODO simplify
  function computeRawSimulationTime(player) {
    return computeEpochSimulationTime(player, new Date().getTime());
  }

  function computeEffectiveSimulationTime(player) {
    var thePlayer = player || self;
    if (Variable.find(gameModel, 'running_global').getValue(thePlayer)) {
      // Is globally running

      if (Variable.find(gameModel, 'running').getValue(thePlayer)) {
        // Is locally running
        var currentRawSimTime = computeRawSimulationTime(thePlayer);

        var keepalive = Variable.find(gameModel, 'keepalive').getValue(thePlayer);

        var delta = currentRawSimTime - keepalive;

        if (delta < KEEPALIVE_DELAY_S) {
          return currentRawSimTime;
        } else {
          // NOT ALIVE
          return keepalive + KEEPALIVE_DELAY_S;
        }
      }
    }

    return Variable.find(gameModel, 'inSim_ref').getValue(thePlayer);
  }

  return {
    /**
     * The team starts the simulation
     */
    start: function (player) {
      var thePlayer = player || self;

      //print("Start");
      var currentInSim = computeEffectiveSimulationTime(player);
      var currentEpoch = new Date().getTime();
      Variable.find(gameModel, 'epoch_ref').setValue(thePlayer, currentEpoch);
      Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, currentInSim);
      Variable.find(gameModel, 'running').setValue(thePlayer, true);
      Variable.find(gameModel, 'keepalive').setValue(thePlayer, currentInSim);
    },
    /**
     * The team stops the simulation
     */
    pause: function (player) {
      var thePlayer = player || self;
      var currentInSim = computeEffectiveSimulationTime(player);
      print('Time: ', currentInSim);
      Variable.find(gameModel, 'running').setValue(thePlayer, false);
      Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, currentInSim);
    },
    /**
     * Trainer starts the simulation for all teams
     */
    globalStart: function () {
      runForAllTeams(function (player) {
        var currentInSim = computeEffectiveSimulationTime(player);
        var currentEpoch = new Date().getTime();
        Variable.find(gameModel, 'epoch_ref').setValue(player, currentEpoch);
        Variable.find(gameModel, 'inSim_ref').setValue(player, currentInSim);
      });
      Variable.find(gameModel, 'running_global').setValue(self, true);
    },
    /**
     * Trainer stops the simulation for all teams
     */
    globalPause: function () {
      runForAllTeams(function (player) {
        var currentInSim = computeEffectiveSimulationTime(player);
        Variable.find(gameModel, 'inSim_ref').setValue(player, currentInSim);
      });

      Variable.find(gameModel, 'running_global').setValue(self, false);
    },
    toggleRunningGlobal: function () {
      if (MimmsHelper.isDrillMode()) {
        var runningGlobal = Variable.find(gameModel, 'running_global').getValue(self);
        if (runningGlobal) {
          this.globalPause();
        } else {
          this.globalStart();
        }
      }
    },
    /**
     * Restore simulation when players return
     */
    revive: function (player) {
      var thePlayer = player || self;
      var currentInSim = computeEffectiveSimulationTime(thePlayer);
      var currentEpoch = new Date().getTime();
      Variable.find(gameModel, 'epoch_ref').setValue(thePlayer, currentEpoch);
      //Variable.find(gameModel, "keepalive").setValue(thePlayer, currentInSim);
      Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, currentInSim);
    },
    /**
     * Team Indicates a player is on-line
     */
    keepalive: function (player) {
      var thePlayer = player || self;
      var currentInSim = computeEffectiveSimulationTime(thePlayer);
      Variable.find(gameModel, 'keepalive').setValue(thePlayer, currentInSim);
    },

    getCurrentTime: function (player) {
      return computeEffectiveSimulationTime(player);
    },
    /**
     * value: human-friendly duration (number + unit).
     * eg.
     *   - "1" means 1 sec
     *   - "1s" means 1 sec
     * 	 - "1m" means 1 min
     *   - "1h" means 1 hour
     *   - "1d" means 1 day
     *
     */
    fastForward: function (value, player) {
      var thePlayer = player || self;
      var parse = /^(\d+)([smhd])?$/;
      var parsed = parse.exec(value);
      if (parsed) {
        if (parsed.length > 1) {
          var number = +parsed[1];
          print(number);
          var unit = parsed[2];
          switch (unit) {
            case 'd':
              number *= 24;
            // fallsthrough
            case 'h':
              number *= 60;
            // fallsthrough
            case 'm':
              number *= 60;
            // fallsthrough
            default:
            //number = number
          }

          if (number > 0) {
            Variable.find(gameModel, 'inSim_ref').add(thePlayer, number);
            Variable.find(gameModel, 'keepalive').add(thePlayer, number);
          } else {
            throw 'Please do not go backward';
          }
        }
      } else {
        throw 'Unparseable value' + value;
      }
    },
    globalFastForward: function (value) {
      runForAllTeams(function (player) {
        TimeManager.fastForward(value, player);
      });
    },
  };
})();
