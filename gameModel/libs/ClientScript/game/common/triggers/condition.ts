import { triggerLogger } from '../../../tools/logger';
import { Indexed, Typed, Uid } from '../interfaces';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionCondition, evaluateActionCondition } from './implementation/actionCondition';
import { MapEntityCondition, TriggerCondition } from './implementation/activableCondition';
import { ChoiceCondition, evaluateChoiceCondition } from './implementation/choiceCondition';
import { evaluateTimeCondition, TimeCondition } from './implementation/timeCondition';

export interface ConditionBase extends Typed, Indexed {
  invert?: boolean; // The condition must NOT be met
}

export type ActivableStatus =
  | 'active'
  | 'inactive';

/**
 * completed once => there exists an action or action with specific choice in the timeline that has completed
 * <p>
 * ongoing => there exists an action or action with specific choice in the timeline that is currently running
 * <p>
 * never planned => no action or action with specific choice in the timeline
 */
export type ChoiceActionStatus =
  | ActivableStatus
  | 'completed once'
  | 'ongoing'
  | 'never planned';

export type Condition =
  | TimeCondition
  | ActionCondition
  | ChoiceCondition
  | TriggerCondition
  | MapEntityCondition;

export function evaluateCondition(state: MainSimulationState, condition: Condition) {
  switch (condition.type) {
    case 'time':
      return evaluateTimeCondition(state, condition);
    case 'action':
      return evaluateActionCondition(state, condition);
    case 'choice':
      return evaluateChoiceCondition(state, condition);
    case 'trigger':
    case 'mapEntity':
      return evaluateActivable(state, condition.activableRef, condition.status);
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
      return state.getActivable(uid)?.active ?? false;
    case 'inactive':
      return !(state.getActivable(uid)?.active ?? false);
  }
}
