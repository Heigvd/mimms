import { convertToLocalEvents, Impact } from '../impacts/impact';
import { IActivableDescriptor, IDescriptor, Typed } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Condition, evaluateCondition } from './condition';

/**
 * A trigger is a collection of condition and impacts
 * when simulation progresses each active trigger has its conditions evaluated
 * the conditons are linked with an operator AND/OR
 * if the conditions are evaluated to true, the impacts are evaluated
 */
export interface Trigger extends IActivableDescriptor, IDescriptor, Typed {
  type: 'trigger';
  activableType: 'trigger';
  priority: number; //TODO same as WEGAS ??
  repeatable: boolean;
  operator: 'OR' | 'AND';
  conditions: Condition[];
  impacts: Impact[];
}

function evaluateTriggerConditions(state: MainSimulationState, trigger: Trigger): boolean {
  if (state.getActivable(trigger.uid).active) {
    if (trigger.conditions.length === 0) {
      return true;
    }
    if (trigger.operator === 'AND') {
      return trigger.conditions.every(c => evaluateCondition(state, c));
    } else if (trigger.operator === 'OR') {
      return trigger.conditions.some(c => evaluateCondition(state, c));
    }
  }
  return false;
}

function evaluateTriggerImpacts(state: MainSimulationState, trigger: Trigger): LocalEventBase[] {
  return trigger.impacts.flatMap(impact => convertToLocalEvents(state, impact, trigger.uid));
}

export function evaluateTrigger(state: MainSimulationState, trigger: Trigger): LocalEventBase[] {
  if (evaluateTriggerConditions(state, trigger)) {
    if (!trigger.repeatable) {
      // TODO see if LocalEvent emitted instead, would be cleaner
      const triggerState = state.getActivable(trigger.uid);
      triggerState.active = false;
    }
    return evaluateTriggerImpacts(state, trigger);
  }
  return [];
}
