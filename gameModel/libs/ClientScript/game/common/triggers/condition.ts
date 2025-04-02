// condition

import { triggerLogger } from '../../../tools/logger';
import { TemplateId } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';

interface ConditionBase {
  type: string;
}

interface TimeCondition extends ConditionBase {
  type: 'Time';
  operator: '<' | '=' | '>';
  timeSeconds: number;
}

function evaluateTimeCondition(state: MainSimulationState, condition: TimeCondition): boolean {
  const t = condition.timeSeconds;
  const simTime = state.getSimTime();
  triggerLogger.debug('times', t, simTime);
  switch (condition.operator) {
    case '<':
      return simTime < t;
    case '=':
      return simTime === t;
    case '>':
      return simTime > t;
    default:
      triggerLogger.error('Malformed TimeCondition, bad operator', condition);
      return false;
  }
}

interface ActionCondition extends ConditionBase {
  type: 'Action';
  templateId: TemplateId;
  operator: 'played' | 'not played';
  choice: ChoiceId | 'any';
}

// TODO define choice
type ChoiceId = number;

function evaluateActionCondition(state: MainSimulationState, condition: ActionCondition): boolean {
  const action = state.getAllActions().find(a => a.getTemplateId() === condition.templateId);

  if (action) {
    // TODO choice logic now suppose the 'any' operator
    if (condition.choice === 'any') {
      return action.getStatus() === 'Completed';
    }
  }
  return false;
}

export type Condition = TimeCondition | ActionCondition;

export function evaluateCondition(state: MainSimulationState, condition: Condition) {
  switch (condition.type) {
    case 'Action':
      return evaluateActionCondition(state, condition);
    case 'Time':
      return evaluateTimeCondition(state, condition);
  }
}
