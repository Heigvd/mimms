import { getDrillStatus } from '../pretri/drill';
import { FogType } from './the_world';
import { getRunningMode } from './TimeManager';

type DrillType = 'PRE-TRIAGE' | 'LIKERT';

export function getDrillType(): DrillType {
  return Variable.find(gameModel, 'drillType').getValue(self) as DrillType;
}

export function isDrillMode(): boolean {
  return Variable.find(gameModel, 'gameMode').getValue(self) === 'pretriMode';
}

export function getTimeMode(): 'LIVE_WORLD' | 'STATIC' {
  if (isDrillMode()) {
    switch (getDrillType()) {
      case 'LIKERT':
        return 'STATIC';
    }
  }

  return 'LIVE_WORLD';
}

export function getGamePageId() {
  if (isDrillMode()) {
    switch (getDrillType()) {
      case 'PRE-TRIAGE':
        return '12';
      case 'LIKERT':
        return '26';
    }
  }

  return '404';
}

/**
 * Does the current game mode gives an infinite number of objects?
 */
export function infiniteBags(): boolean {
  if (isDrillMode()) {
    switch (getDrillType()) {
      case 'PRE-TRIAGE':
        return true;
    }
  }

  return false;
}

/**
 * Does the current game mode provide a bag automatically?
 */
export function shouldProvideDefaultBag(): boolean {
  if (isDrillMode()) {
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
  if (isDrillMode()) {
    switch (getDrillType()) {
      case 'PRE-TRIAGE':
        return Variable.find(gameModel, 'bagType').getValue(self);
    }
  }

  return undefined;
}

// TODO remove entirely
export function getFogType(): FogType {
  if (isDrillMode()) {
    switch (getDrillType()) {
      case 'PRE-TRIAGE':
        // not map, all humans are visible
        return 'NONE';
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
