import { triggerLogger } from '../../../../tools/logger';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ConditionBase } from '../condition';

export interface TimeCondition extends ConditionBase {
  type: 'time';
  operator: '<' | '=' | '>';
  timeSeconds: number;
}

export function evaluateTimeCondition(
  state: Readonly<MainSimulationState>,
  condition: TimeCondition
): boolean {
  const t = condition.timeSeconds;
  const simTime = state.getSimTime();
  triggerLogger.debug('Time condition', simTime, condition.operator, t);

  switch (condition.operator) {
    case '<':
      return simTime < t;
    case '=':
      return simTime === t;
    case '>':
      return simTime > t;
    default:
      triggerLogger.error('Malformed TimeCondition, bad operator', JSON.stringify(condition));
      return false;
  }
}
