import { triggerLogger } from '../../../../tools/logger';
import { OneMinuteDuration } from '../../constants';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ConditionBase } from '../condition';

export interface TimeCondition extends ConditionBase {
  type: 'time';
  operator: '<' | '=' | '>';
  timeSeconds: number;
  zeroTimeRef: 'arrival' | 'incident';
}

export function evaluateTimeCondition(
  state: Readonly<MainSimulationState>,
  condition: TimeCondition
): boolean {
  const t = condition.timeSeconds;
  let simTime = state.getSimTime();
  if(condition.zeroTimeRef === 'incident'){
    simTime += Variable.find(gameModel, 'patients-elapsed-minutes').getValue(self) * OneMinuteDuration;
  }
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
