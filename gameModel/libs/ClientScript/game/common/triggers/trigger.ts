import { ViewConfig } from '../../../edition/typeDefinitions/definition';
import { triggerLogger } from '../../../tools/logger';
import { getTriggers } from '../../loaders/triggerLoader';
import { convertToLocalEvents, Impact } from '../impacts/impact';
import { IActivableDescriptor, IDescriptor, Indexed, Typed } from '../interfaces';
import { ChangeActivableStatusLocalEvent, LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Condition, evaluateCondition } from './condition';

/**
 * A trigger is a collection of conditions and impacts.
 * When simulation progresses each active trigger has its conditions evaluated.
 * The conditions are linked with an operator AND/OR.
 * If the conditions are evaluated to true, the impacts are evaluated.
 */
export interface Trigger extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  type: 'trigger';
  activableType: 'trigger';
  comment?: string; // free text
  accessLevel: ViewConfig; // if the scenarist can see / edit
  mandatory: boolean;
  deactivateItself: boolean;
  operator: 'OR' | 'AND'; // operator between conditions
  conditions: Condition[];
  impacts: Impact[];
}

export function getSortedTriggers(): Trigger[] {
  return getTriggers().sort(compareTriggers);
}

export function compareTriggers(a: Trigger, b: Trigger): number {
  const idxA = a.index + (a.mandatory ? 0 : 1000000);
  const idxB = b.index + (b.mandatory ? 0 : 1000000);

  if (idxA === idxB) {
    return a.uid.localeCompare(b.uid);
  }

  return idxA - idxB;
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
    triggerLogger.info(`trigger '${trigger.uid}' is deactivated`);
    return false;
  }

  triggerLogger.error('trigger conditions are erroneously defined : ', JSON.stringify(trigger));
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

function evaluateTrigger(state: Readonly<MainSimulationState>, trigger: Trigger): LocalEventBase[] {
  if (evaluateTriggerConditions(state, trigger)) {
    triggerLogger.info(`trigger '${trigger.uid}' is triggered`);
    const impacts: LocalEventBase[] = evaluateTriggerImpacts(state, trigger);

    if (trigger.deactivateItself) {
      impacts.push(
        new ChangeActivableStatusLocalEvent({
          parentEventId: state.getLastEventId(),
          parentTriggerId: trigger.uid,
          simTimeStamp: state.getSimTime(),
          target: trigger.uid,
          option: 'deactivate',
        })
      );
    }

    return impacts;
  }
  return [];
}

export function evaluateAllTriggers(state: Readonly<MainSimulationState>): LocalEventBase[] {
  const triggers: Trigger[] = getSortedTriggers();
  return triggers.flatMap((trigger: Trigger) => evaluateTrigger(state, trigger));
}

export function getTriggersVariable(): SObjectDescriptor {
  return Variable.find(gameModel, 'triggers_data');
}
