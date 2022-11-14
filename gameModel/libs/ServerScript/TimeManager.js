/**
 * Server-side time manager
 */
var TimeManager = ((function () {


	function runForAllTeams(fn) {
		self.getGame().getTeams().stream().map(function (team) {
			return team.getAnyLivePlayer();
		}).forEach(function (player) {
			if (player) {
				fn(player);
			}
		});
	}

	var KEEPALIVE_DELAY_S = 30; // 30 seconds

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

	function computeRawSimulationTime(player) {
		return computeEpochSimulationTime(player, new Date().getTime());
	}

	function computeEffectiveSimulationTime(player) {
		var thePlayer = player || self;
		if (Variable.find(gameModel, 'running_global').getValue(thePlayer)) {
			// Is globally running

			var realLifeTime = MimmsHelper.isRealLifeGame();
			if (realLifeTime) {
				return computeRawSimulationTime(thePlayer);
			}

			if (Variable.find(gameModel, 'running').getValue(thePlayer)) {
				// Is locally running
				var replayMode = Variable.find(gameModel, 'replay').getValue(thePlayer);
				var currentRawSimTime = computeRawSimulationTime(thePlayer);

				if (replayMode) {
					// in replay mode, auto stop if limit has been reached
					var replayUpTo = Variable.find(gameModel, 'upTo_inSim_ref').getValue(thePlayer);
					if (currentRawSimTime < replayUpTo) {
						return currentRawSimTime;
					} else {
						return replayUpTo;
					}
				}

				var keepalive = Variable.find(gameModel, "keepalive").getValue(thePlayer);

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
			Variable.find(gameModel, "keepalive").setValue(thePlayer, currentInSim);
		},
		/**
		 * The team stops the simulation
		 */
		pause: function (player) {
			var thePlayer = player || self;
			var currentInSim = computeEffectiveSimulationTime(player)
			print("Time: ", currentInSim);
			Variable.find(gameModel, 'running').setValue(thePlayer, false);
			Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, currentInSim);
		},
		/**
		 * Trainer starts the simulation for all teams
		 */
		globalStart: function () {
			var shouldRun = MimmsHelper.shouldRunScenarioOnFirstStart();
			runForAllTeams(function (player) {
				if (shouldRun) {
					EventManager.runScenario(player);
				}

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
		/**
		 * Team enters "replay" mode
		 */
		enterReplay: function (player) {
			var thePlayer = player || self;
			// make sure to pause the simulation
			TimeManager.pause(thePlayer);
			var simTime = Variable.find(gameModel, 'inSim_ref').getValue(thePlayer);

			Variable.find(gameModel, 'upTo_inSim_ref').setValue(thePlayer, simTime);
			Variable.find(gameModel, 'replay').setValue(thePlayer, true);
			Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, 0);
		},
		/**
		 * Team quits the "replay" mode
		 */
		quitReplay: function (player) {
			var thePlayer = player || self;
			// make sure to pause the simulation
			TimeManager.pause(thePlayer);
			var simTime = Variable.find(gameModel, 'upTo_inSim_ref').getValue(thePlayer);

			Variable.find(gameModel, 'upTo_inSim_ref').setValue(thePlayer, 0);
			Variable.find(gameModel, 'replay').setValue(thePlayer, false);
			Variable.find(gameModel, 'inSim_ref').setValue(thePlayer, simTime);
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
			Variable.find(gameModel, "keepalive").setValue(thePlayer, currentInSim);
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
			var isInReplay = Variable.find(gameModel, 'replay').getValue(thePlayer);
			if (isInReplay) {
				print("Cannot fast forward while in replay mode");
				return;
			}
			var parse = /^(\d+)([smhd])?$/;
			var parsed = parse.exec(value);
			if (parsed) {
				if (parsed.length > 1) {
					var number = +parsed[1];
					print(number)
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
						throw "Please do not go backward";
					}
				}
			} else {
				throw "Unparseable value" + value;
			}
		}
	};
})());