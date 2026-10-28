import { getDrillStatus } from './drill';
import { getRunningMode } from './pretriTime';

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
