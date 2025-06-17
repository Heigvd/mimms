import { triggerLogger } from '../../../tools/logger';
import { Typed, Uid } from '../interfaces';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionCondition, evaluateActionCondition } from './implementation/actionCondition';
import { ChoiceCondition, evaluateChoiceCondition } from './implementation/choiceCondition';
import { evaluateTimeCondition, TimeCondition } from './implementation/timeCondition';
import { TriggerCondition } from './implementation/triggerCondition';

export interface ConditionBase extends Typed {}

export type ActivableStatus = 'active' | 'inactive';

/**
 * completed once => there exist an action or action with specific choice in the timeline that has completed
 * ongoing => there exist an action or action with specific choice in the timeline that is currently running
 * never planned => no action or action with specific choice in the timeline
 */
export type ChoiceActionStatus = ActivableStatus | 'completed once' | 'ongoing' | 'never planned';

export type Condition = TimeCondition | ActionCondition | ChoiceCondition | TriggerCondition;

export function evaluateCondition(state: MainSimulationState, condition: Condition) {
  switch (condition.type) {
    case 'time':
      return evaluateTimeCondition(state, condition);
    case 'action':
      return evaluateActionCondition(state, condition);
    case 'choice':
      return evaluateChoiceCondition(state, condition);
    case 'trigger':
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
      return state.getActivable(uid)?.active || false;
    case 'inactive':
      return !state.getActivable(uid)?.active || false;
  }
}
