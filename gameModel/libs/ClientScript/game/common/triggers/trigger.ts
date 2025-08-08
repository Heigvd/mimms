import { triggerLogger } from '../../../tools/logger';
import { getSortedTriggers } from '../../loaders/triggerLoader';
import { convertToLocalEvents, Impact } from '../impacts/impact';
import { IActivableDescriptor, IDescriptor, Indexed, Typed } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Condition, evaluateCondition } from './condition';

/**
 * A trigger is a collection of conditions and impacts.
 * When simulation progresses each active trigger has its conditions evaluated.
 * The conditions are linked with an operator AND/OR.
 * If the conditions are evaluated to true, the impacts are evaluated.
 */
export interface Trigger extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  type: 'trigger'; // TODO see if used or not (absent in UML)
  activableType: 'trigger';
  // TODO accessLevel (present in UML)
  // TODO mandatory (present in UML)
  repeatable: boolean; // TODO decide the naming : repeatable (like action templates) or repeats (like in UML)
  operator: 'OR' | 'AND';
  conditions: Condition[];
  impacts: Impact[];
  comment?: string;
}

function evaluateTriggerConditions(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): boolean {
  if (state.getActivable(trigger.uid)?.active) {
    if (trigger.conditions.length === 0) {
      return true;
    }
    if (trigger.operator === 'AND') {
      return trigger.conditions.every(c => evaluateCondition(state, c));
    } else if (trigger.operator === 'OR') {
      return trigger.conditions.some(c => evaluateCondition(state, c));
    }
  } else {
    triggerLogger.info(`trigger with id ${trigger.uid} is deactivated`);
    return false;
  }

  triggerLogger.warn('trigger conditions are erroneously defined : ', JSON.stringify(trigger));
  return false;
}

function evaluateTriggerImpacts(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): LocalEventBase[] {
  return trigger.impacts.flatMap((impact: Impact) =>
    convertToLocalEvents(state, impact, trigger.uid)
  );
}

export function evaluateTrigger(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): LocalEventBase[] {
  if (evaluateTriggerConditions(state, trigger)) {
    const impacts: LocalEventBase[] = evaluateTriggerImpacts(state, trigger);

    // Deactivate if not repeatable
    if (!trigger.repeatable) {
      const triggerState = state.getActivable(trigger.uid);

      if (triggerState) {
        // TODO do with LocalEvent as soon as it is available
        triggerState.active = false;
      } else {
        triggerLogger.warn(`Trigger activable with id ${trigger.uid} not found`);
      }
    }

    return impacts;
  }
  return [];
}

export function evaluateAllTriggers(state: Readonly<MainSimulationState>): LocalEventBase[] {
  const triggers: Trigger[] = getSortedTriggers();
  return triggers.flatMap((trigger: Trigger) => evaluateTrigger(state, trigger));
}
