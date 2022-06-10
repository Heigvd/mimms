import { syncWorld } from "./the_world";

const timeLogger = Helpers.getLogger("TimeManager");

let delta_epoch: number | undefined = undefined;
let currentTime_s = 0;

//export const [getWorldTime, setWorldTimeState] = Helpers.getState(() => ({time: 0}));

interface TimeState {
	time: number;
}

type WorldTimeSetter = (s: TimeState | ((old: TimeState) => TimeState)) => void;

let setWorldTimeState: WorldTimeSetter = () => { };

export function getWorldTime(): TimeState {
	timeLogger.log("GetWorld Time:", JSON.stringify(Context));
	return Context.worldTime?.state || { time: 0 };
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

export function isRunning() {
	return Variable.find(gameModel, 'running').getValue(self);
}


export function computeCurrentSimulationTime() {
	const inSim_ref = Variable.find(gameModel, 'inSim_ref').getValue(self);
	timeLogger.debug("Compute new inSim Time", { delta_epoch });
	if (delta_epoch != null) {
		if (isRunning()) {
			const epoch_ref = Variable.find(gameModel, 'epoch_ref').getValue(self);
			const currentLocalTime_epoch = new Date().getTime();
			const currentInSim_s = inSim_ref + (currentLocalTime_epoch - epoch_ref + delta_epoch) / 1000;
			timeLogger.debug("Compute new inSim Time", { inSim_ref, currentLocalTime_epoch, epoch_ref, delta_epoch, currentInSim_s });
			return Math.floor(currentInSim_s);
		}
	}
	// not running, or delta not set
	return inSim_ref;
}

export function getCurrentSimulationTime() {
	return currentTime_s;
}

export function updateInSimCurrentTime() {
	currentTime_s = computeCurrentSimulationTime();
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



export function registerSetStateAndThrottle(setTime: WorldTimeSetter) {
	setWorldTimeState = setTime;
	if (isRunning()) {
		timeLogger.debug("Time Machine: is running", new Date().toLocaleString());
		updateInSimCurrentTime();
		if (timerRef.intervalId == null) {
			syncWorld();
			timeLogger.log("Init World interval interval");
			timerRef.intervalId = setInterval(() => {
				if (!isRunning()){
					stopInterval();
				}
				updateInSimCurrentTime();
				syncWorld();
				timeLogger.info("Time Machine: tick to ", currentTime_s);
				setWorldTimeState({ time: currentTime_s });
			}, 1000);
		}
	} else {
		timeLogger.log("Time Machine: is not running: ", new Date().toLocaleString());
		updateInSimCurrentTime();
		const currentTime = getWorldTime().time;
		if (currentTime !== currentTime_s) {
			//setWorldTimeState({time: currentTime_s});    
		}
		stopInterval();
		syncWorld();
	}
	return currentTime_s;
}


