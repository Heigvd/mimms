/**
 * Server-side time manager
 */
var TimeManager = ((function () {

	function computeCurrentInSimTime() {
		var inSim_ref = Variable.find(gameModel, 'inSim_ref').getValue(self);
		var epoch_ref = Variable.find(gameModel, 'epoch_ref').getValue(self);
		var currentEpoch = new Date().getTime();
		var delta_s = Math.floor((currentEpoch - epoch_ref) / 1000);
		return inSim_ref + delta_s;
	}

	return {
		isRunning: function () {
			return Variable.find(gameModel, 'running').getValue(self);
		},
		start: function () {
			print("Start");
			if (!TimeManager.isRunning()) {
				print("DoStart");
				var currentEpoch = new Date().getTime();
				Variable.find(gameModel, 'epoch_ref').setValue(self, currentEpoch);
				Variable.find(gameModel, 'running').setValue(self, true);
			}
		},
		pause: function () {
			if (TimeManager.isRunning()) {
				var currentInSim = computeCurrentInSimTime();
				Variable.find(gameModel, 'inSim_ref').setValue(self, currentInSim);
				Variable.find(gameModel, 'running').setValue(self, false);
			}
		},
		getCurrentTime: function(){
			if (!TimeManager.isRunning()) {
				return Variable.find(gameModel, 'inSim_ref').getValue(self);
			} else {
				return computeCurrentInSimTime();
			}
		},
		/**
		 * value: human-friendly duration (number + unit).
		 * eg. 
		 *   - "1" means 1 sec
		 *   - "1s" means 1 sec
		 * 	 - "1m" means 1 min
		 *   - "1h" means 1 hour
		 *   - "1d" menas 1 day
		 * 
		 */
		fastForward: function (value) {
			if (TimeManager.isRunning()) {
				throw "Please Pause the Game";
			} else {
				var parse = /^(\d+)([smhd])?$/;
				var parsed = parse.exec(value);
				if (parsed) {
					if (parsed.length > 1) {
						var number = +parsed[1];
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
							Variable.find(gameModel, 'inSim_ref').setValue(number);
						} else {
							throw "Please do not go backward";
						}
					}
				} else {
					throw "Unparseable value" + value;
				}
			}
		}
	};
})());