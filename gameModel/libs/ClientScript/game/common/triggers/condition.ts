import { triggerLogger } from '../../../tools/logger';
import { IDescriptor, Indexed, Typed, Uid } from '../interfaces';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionCondition, evaluateActionCondition } from './implementation/actionCondition';
import { MapEntityCondition, TriggerCondition } from './implementation/activableCondition';
import { ChoiceCondition, evaluateChoiceCondition } from './implementation/choiceCondition';
import { EmptyCondition } from './implementation/emptyCondition';
import { evaluateTimeCondition, TimeCondition } from './implementation/timeCondition';

export interface ConditionBase extends IDescriptor, Typed, Indexed {
  invert?: boolean; // The condition must NOT be met
}

export type ActivableStatus = 'active' | 'inactive';

/**
 * completed once => there exists an action or action with specific choice in the timeline that has completed
 * <p>
 * ongoing => there exists an action or action with specific choice in the timeline that is currently running
 * <p>
 * never planned => no action or action with specific choice in the timeline
 */
export type ChoiceActionStatus = ActivableStatus | 'completed once' | 'ongoing' | 'never planned';

export type Condition =
  | TimeCondition
  | ActionCondition
  | ChoiceCondition
  | TriggerCondition
  | MapEntityCondition
  | EmptyCondition;

export function evaluateCondition(state: Readonly<MainSimulationState>, condition: Condition) {
  let result = false;

  switch (condition.type) {
    case 'time':
      result = evaluateTimeCondition(state, condition);
      break;
    case 'action':
      result = evaluateActionCondition(state, condition);
      break;
    case 'choice':
      result = evaluateChoiceCondition(state, condition);
      break;
    case 'trigger':
    case 'mapEntity':
      result = evaluateActivable(state, condition.activableRef, condition.status);
      break;
    case 'empty':
      triggerLogger.error('Empty condition : This condition should not be evaluated');
      break;
    default:
      triggerLogger.error('Unknown condition type', condition);
      return false;
  }

  if (condition.type !== 'empty' && condition.invert) {
    return !result;
  }

  return result;
}

export function evaluateActivable(
  state: Readonly<MainSimulationState>,
  uid: Uid,
  status: ActivableStatus
): boolean {
  switch (status) {
    case 'active':
      return state.getActivable(uid)?.active ?? false;
    case 'inactive':
      return !(state.getActivable(uid)?.active ?? false);
  }
}

export function compareConditions(a: Condition, b: Condition): number {
  if (a.index === b.index) {
    return a.uid.localeCompare(b.uid);
  }

  return a.index - b.index;
}
