import { triggerLogger } from '../../../tools/logger';
import { Typed, Uid } from '../interfaces';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionCondition, evaluateActionCondition } from './implementation/actionCondition';
import { ChoiceCondition, evaluateChoiceCondition } from './implementation/choiceCondition';
import { evaluateTimeCondition, TimeCondition } from './implementation/timeCondition';
import { TriggerCondition } from './implementation/triggerCondition';

export interface ConditionBase extends Typed {}

export type ActivableStatus = 'active' | 'inactive';

export type ChoiceActionStatus = ActivableStatus | 'completed once' | 'ongoing' | 'never planned';

export type Condition = TimeCondition | ActionCondition | ChoiceCondition | TriggerCondition;

export function evaluateCondition(state: MainSimulationState, condition: Condition) {
  switch (condition.type) {
    case 'Time':
      return evaluateTimeCondition(state, condition);
    case 'Action':
      return evaluateActionCondition(state, condition);
    case 'Choice':
      return evaluateChoiceCondition(state, condition);
    case 'Trigger':
      return evaluateActivable(state, condition.triggerId, condition.operator);
    default:
      triggerLogger.warn('Unknown condition type', condition);
      return false;
  }
}

export function evaluateActivable(
  state: MainSimulationState,
  uid: Uid,
  status: ActivableStatus
): boolean {
  switch (status) {
    case 'active':
      return state.getActivable(uid).active;
    case 'inactive':
      return !state.getActivable(uid).active;
  }
}
