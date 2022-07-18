import { getDrillStatus } from "./drill";
import { FogType } from "./the_world";

type DrillType = 'PRE-TRIAGE' | 'PRE-TRIAGE_ON_MAP' | 'LICKERT';

export function getDrillType(): DrillType {
	return Variable.find(gameModel, 'drillType').getValue(self) as DrillType;
}


export function getTimeMode(): "LIVE_WORLD" | 'STATIC' {
	if (gameModel.getProperties().getFreeForAll()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'LICKERT':
				return "STATIC";
		}
	}

	return 'LIVE_WORLD';
}

export function getGamePageId() {
	if (gameModel.getProperties().getFreeForAll()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return "12";
			case 'PRE-TRIAGE_ON_MAP':
				return "11";
			case 'LICKERT':
				switch (getDrillStatus()) {
					case 'not_started':
						return '22';
					case 'ongoing':
					case 'completed':
						return '17';
					case 'validated':
						return '23';
				}

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
	if (gameModel.getProperties().getFreeForAll()) {
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

export function getFogType(): FogType {
	if (gameModel.getProperties().getFreeForAll()) {
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
