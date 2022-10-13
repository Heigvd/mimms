import { syncWorld } from "./the_world";

const timeLogger = Helpers.getLogger("TimeManager");


const KEEPALIVE_TICK_S = 30; // 10 sec

const KEEPALIVE_DELAY_S = 60; // 30 sec

let delta_epoch: number | undefined = undefined;
let currentTime_s = 0;


export type RunningMode = 'GLOBAL_PAUSE' | 'TEAM_PAUSE' | 'RUNNING' | 'REPLAY' | 'IDLE' | 'REPLAY_DONE';

export interface TimeStatus {
	mode: RunningMode;
	currentTime: number;
}

export function initDelta_epoch() {
	const currentLocalTime_epoch = new Date().getTime();
	APIMethods.getServerTime().then(curentServerTime_epoch => {
		delta_epoch = curentServerTime_epoch - currentLocalTime_epoch;
		timeLogger.log("Sync time with server", { delta_epoch });
		updateInSimCurrentTime();
		setWorldTimeState({ time: currentTime_s });
	});
}

initDelta_epoch();

function computeEpochSimTime(epoch: number): number {
	const inSim_ref = Variable.find(gameModel, 'inSim_ref').getValue(self);
	if (delta_epoch != null) {
		const epoch_ref = Variable.find(gameModel, 'epoch_ref').getValue(self);
		/*if (epoch < epoch_ref) {
			return epoch_ref;
		}*/
		const currentInSim_s = inSim_ref + (epoch - epoch_ref + delta_epoch) / 1000;
		//wlog("TIME: ", { inSim_ref, epoch, epoch_ref, delta_epoch });
		if (currentInSim_s < 0) {
			timeLogger.error("Negative Simulation Time!!!");
			return 0;
		}
		return Math.floor(currentInSim_s);
	} else {
		return inSim_ref;
	}
}

function computeRawSimulationTime(): number {
	return computeEpochSimTime(new Date().getTime());
}


function getTimeStatus(): TimeStatus {
	const inSimRef = Variable.find(gameModel, 'inSim_ref').getValue(self);

	if (Variable.find(gameModel, 'running_global').getValue(self)) {
		// Is globally running

		if (Variable.find(gameModel, 'running').getValue(self)) {
			// Is locally running
			const replayMode = Variable.find(gameModel, 'replay').getValue(self);
			const currentRawSimTime = computeRawSimulationTime();

			if (replayMode) {
				// in replay mode, auto stop if limit has been reached
				const replayUpTo = Variable.find(gameModel, 'upTo_inSim_ref').getValue(self);
				if (currentRawSimTime < replayUpTo) {
					timeLogger.debug("Replay : ", currentRawSimTime);
					return {
						mode: 'REPLAY',
						currentTime: currentRawSimTime,
					};
				} else {
					timeLogger.debug("Replay limit reached : ", replayUpTo);
					return {
						mode: 'REPLAY_DONE',
						currentTime: replayUpTo
					};
				}
			} else {

				const keepalive = Variable.find(gameModel, "keepalive").getValue(self);

				const delta = currentRawSimTime - keepalive;

				if (delta < KEEPALIVE_DELAY_S) {
					timeLogger.debug("Keepalive is valid ", currentRawSimTime);
					return {
						mode: 'RUNNING',
						currentTime: currentRawSimTime,
					};
				} else {
					// NOT ALIVE
					return {
						mode: 'IDLE',
						currentTime: keepalive + KEEPALIVE_DELAY_S,
					}
				}
			}
		} else {
			return {
				mode: 'TEAM_PAUSE',
				currentTime: inSimRef,
			};
		}
	} else {
		return {
			mode: 'GLOBAL_PAUSE',
			currentTime: inSimRef,
		};
	}
}





export function getRunningMode(): RunningMode {
	return getTimeStatus().mode;
}















export function getCurrentSimulationTime() {
	return currentTime_s;
}

export function updateInSimCurrentTime() {
	currentTime_s = getTimeStatus().currentTime;
	return currentTime_s;
}









interface TimeState {
	time: number;
}

type WorldTimeSetter = (s: TimeState | ((old: TimeState) => TimeState)) => void;

let setWorldTimeState: WorldTimeSetter = () => { };

export function getWorldTime(): TimeState {
	return Context.worldTime?.state || { time: 0 };
}

const timerRef: {
	intervalId: number | undefined
} = { intervalId: undefined }


function stopInterval() {
	if (timerRef.intervalId) {
		wlog("Clear Interval");
		clearInterval(timerRef.intervalId);
		timerRef.intervalId = undefined;
	}
}

Helpers.registerEffect(() => {
	return stopInterval
});


/**
 * Running or replay ? 
 */
export function isRunning(): boolean {
	const status = getTimeStatus();
	return status.mode === 'REPLAY' || status.mode === 'RUNNING';
}


 timeLogger.setLevel('INFO');
export function registerSetStateAndThrottle(setTime: WorldTimeSetter) {
	setWorldTimeState = setTime;
	if (isRunning()) {
		timeLogger.info("Time Machine: is running", new Date().toLocaleString());
		updateInSimCurrentTime();
		if (timerRef.intervalId == null) {
			timeLogger.info("Init World interval interval");
			timerRef.intervalId = setInterval(() => {
				timeLogger.info("Tick");
				if (!isRunning()) {
					timeLogger.info("No longer running");
					stopInterval();
				}
				updateInSimCurrentTime();
				syncWorld();

				const ka = Variable.find(gameModel, 'keepalive').getValue(self);
				if (currentTime_s > ka + KEEPALIVE_TICK_S) {
					timeLogger.info("KeepAlive");
					APIMethods.runScript("TimeManager.keepalive()", {});
				}

				timeLogger.info("Time Machine: tick to ", currentTime_s);
				setWorldTimeState({ time: currentTime_s });
			}, 1000);
		}
	} else {
		timeLogger.info("Time Machine: is not running: ", new Date().toLocaleString());

		if (getTimeStatus().mode === 'IDLE') {
			timeLogger.warn("Player is back in town! Should revive !");
		}

		updateInSimCurrentTime();
		const currentTime = getWorldTime().time;
		if (currentTime !== currentTime_s) {
			setWorldTimeState({ time: currentTime_s });
		}
		stopInterval();
		syncWorld();
	}
	return currentTime_s;
}





