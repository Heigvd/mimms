import { getDrillStatus } from '../pretri/drill';
import { FogType } from './the_world';
import { getRunningMode } from './TimeManager';

type DrillType = 'PRE-TRIAGE' | 'PRE-TRIAGE_ON_MAP' | 'LIKERT';

export function getDrillType(): DrillType {
	return Variable.find(gameModel, 'drillType').getValue(self) as DrillType;
}

type MutliplayerMode = 'REAL_LIFE' | 'SOFTWARE';

export function getMultiplayerMode(): MutliplayerMode {
	return Variable.find(gameModel, 'multiplayerMode').getValue(self) as MutliplayerMode;
}

type RealLifeRole = 'HEALTH_SQUAD' | 'PATIENT' | 'NONE' | 'OBSERVER';

export function getRealLifeRole(): RealLifeRole {
	return Variable.find(gameModel, 'realLifeRole').getValue(self) as RealLifeRole;
}

export function isDrillMode(): boolean {
	return gameModel.getProperties().getFreeForAll();
}

export function isRealLifeGame(): boolean {
	if (isDrillMode()) {
		return false;
	}
	return getMultiplayerMode() === 'REAL_LIFE';
}

export function getTimeMode(): 'LIVE_WORLD' | 'STATIC' {
	if (isDrillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'LIKERT':
				return 'STATIC';
		}
	}

	return 'LIVE_WORLD';
}

export function getGamePageId() {
	if (isDrillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return '12';
			case 'PRE-TRIAGE_ON_MAP':
				return '11';
			case 'LIKERT':
				return '26';
		}
	} else {
		// multiplayers game
		const mode = getMultiplayerMode();
		switch (mode) {
			case 'SOFTWARE':
				// always on map
				return '11';
			case 'REAL_LIFE': {
				const role = getRealLifeRole();
				switch (role) {
					case 'PATIENT':
						// stage direction
						return '31';
					case 'HEALTH_SQUAD':
						// squad page
						return '32';
					case 'OBSERVER':
						return '39';
					default:
						// scan your QR code page
						return '33';
				}
			}
		}
	}

	return '404';
}

/**
 * Does the current game mode gives an infinite number of objects?
 */
export function infiniteBags(): boolean {
	if (isDrillMode() || isRealLifeGame()) {
		// DRILL / individually or real-life game
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
	if (isDrillMode() || isRealLifeGame()) {
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
	if (isDrillMode() || isRealLifeGame()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				return Variable.find(gameModel, 'bagType').getValue(self);
		}
	}

	return undefined;
}

export function getFogType(): FogType {
	if (isDrillMode()) {
		// DRILL / individually
		switch (getDrillType()) {
			case 'PRE-TRIAGE':
				// not map, all humans are visible
				return 'NONE';
			case 'PRE-TRIAGE_ON_MAP':
				// On map -> only visible humans are visible
				return 'SIGHT';
		}
	} else {
		// multiplayers game
		const mode = getMultiplayerMode();
		switch (mode) {
			case 'SOFTWARE':
				// on map -> line of sight
				return 'SIGHT';
			case 'REAL_LIFE': {
				const role = getRealLifeRole();
				switch (role) {
					case 'PATIENT':
						// patients see nothing
						return 'FULL';
					case 'HEALTH_SQUAD':
					case 'OBSERVER':
						// health squad and observer see everything
						return 'NONE';
					default:
						// default see nothing
						return 'FULL';
				}
			}
		}
	}

	return 'SIGHT';
}

export function isInterfaceDisabled(): boolean {
	const timeMode = getRunningMode();

	if (timeMode === 'GLOBAL_PAUSE') {
		return true;
	}

	if (isDrillMode()) {
		const drillStatus = getDrillStatus();

		switch (getDrillType()) {
			case 'LIKERT':
			case 'PRE-TRIAGE':
				return drillStatus != 'ongoing';
		}
	}

	return timeMode !== 'RUNNING';
}
