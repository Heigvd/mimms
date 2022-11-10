import { getDrillStatus } from "./drill";
import { FogType } from "./the_world";
import { getRunningMode } from "./TimeManager";

type DrillType = 'PRE-TRIAGE' | 'PRE-TRIAGE_ON_MAP' | 'LICKERT';

export function getDrillType(): DrillType {
	return Variable.find(gameModel, 'drillType').getValue(self) as DrillType;
}


function drillMode() : boolean {
	return gameModel.getProperties().getFreeForAll();
}

export function getTimeMode(): "LIVE_WORLD" | 'STATIC' {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'LICKERT':
				return "STATIC";
		}
	}

	return 'LIVE_WORLD';
}

export function getGamePageId() {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return "12";
			case 'PRE-TRIAGE_ON_MAP':
				return "11";
			case 'LICKERT':
			return '26';
		}
	} else {
		// multiplayers game
		// always on map
		return "11";
	}

	return "404";
}

/**
 * Does the current game mode gives an infinite number of objects?
 */
export function infiniteBags(): boolean {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return true;
			case 'PRE-TRIAGE_ON_MAP':
				return false;
		}
	}

	return false;
}

/**
 * Does the current game mode provide a bag automatically?
 */
export function shouldProvideDefaultBag(): boolean {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return true;
		}
	}

	return false;
}

/**
 * Does the current game mode provide a bag automatically?
 * @returns name of the bag to give or undefined
 */
export function getDefaultBag(): string | undefined {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return Variable.find(gameModel, "bagType").getValue(self);
		}
	}

	return undefined;
}

export function getFogType(): FogType {
	if (drillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				// not map, all humans are visible
				return 'NONE';
			case 'PRE-TRIAGE_ON_MAP':
				// On map -> only visible humans are visible
				return "SIGHT";
		}
	} else {
		// multiplayers game
		// always on map
		return "SIGHT";
	}

	return "SIGHT";
}



export function isInterfaceDisabled() : boolean {
	const timeMode = getRunningMode();

	if (timeMode === 'GLOBAL_PAUSE'){
		return true;
	}

	if (drillMode()) {
		const drillStatus = getDrillStatus();

		switch (getDrillType()) {
			case 'LICKERT':
			case 'PRE-TRIAGE':
				return drillStatus != 'ongoing';
		}
	}

	return timeMode !== 'RUNNING';
}
