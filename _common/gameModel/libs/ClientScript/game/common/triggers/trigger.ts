import { ViewConfig } from '../../../edition/typeDefinitions/definition';
import { triggerLogger } from '../../../tools/logger';
import { getTriggers } from '../../loaders/triggerLoader';
import { convertToLocalEvents, Impact } from '../impacts/impact';
import { IActivableDescriptor, IDescriptor, Indexed, Typed } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { getTriggerActivable, TriggerActivable } from '../simulationState/activableState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Condition, evaluateCondition } from './condition';
import {
  ChangeActivableStatusLocalEvent,
  IncrementCountLocalEvent,
} from '../localEvents/localEventBaseActivable';

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

function compareTriggers(a: Trigger, b: Trigger): number {
  const idxA: number = a.index + (a.mandatory ? 0 : 1000000);
  const idxB: number = b.index + (b.mandatory ? 0 : 1000000);

  if (idxA === idxB) {
    return a.uid.localeCompare(b.uid);
  }

  return idxA - idxB;
}

// Regarding only its activable state, can it be run
export function isTriggerAvailable(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): boolean {
  const triggerActivable: TriggerActivable | undefined = getTriggerActivable(state, trigger.uid);

  if (triggerActivable) {
    if (triggerActivable.active) {
      return true;
    } else {
      triggerLogger.info(`trigger '${trigger.uid}' is not active`);
      return false;
    }
  } else {
    triggerLogger.error(`trigger '${trigger.uid}' has no activable`);
    return false;
  }
}

function evaluateTriggerConditions(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): boolean {
  if (trigger.conditions.length === 0) {
    return true;
  }
  if (trigger.operator === 'AND') {
    return trigger.conditions.every(c => evaluateCondition(state, c));
  } else if (trigger.operator === 'OR') {
    return trigger.conditions.some(c => evaluateCondition(state, c));
  }

  triggerLogger.error('trigger conditions are erroneously defined : ', JSON.stringify(trigger));
  return false;
}

function evaluateTriggerImpacts(
  state: Readonly<MainSimulationState>,
  trigger: Trigger
): LocalEventBase[] {
  return trigger.impacts.flatMap((impact: Impact) =>
    convertToLocalEvents(state, impact, { type: 'trigger', id: trigger.uid })
  );
}

function evaluateTrigger(state: Readonly<MainSimulationState>, trigger: Trigger): LocalEventBase[] {
  if (isTriggerAvailable(state, trigger) && evaluateTriggerConditions(state, trigger)) {
    triggerLogger.info(`trigger '${trigger.uid}' is triggered`);

    const impacts: LocalEventBase[] = [];

    impacts.push(
      new IncrementCountLocalEvent({
        parentEventId: state.getLastEventId(),
        source: { type: 'trigger', id: trigger.uid },
        simTimeStamp: state.getSimTime(),
        target: trigger.uid,
      })
    );

    if (trigger.deactivateItself) {
      impacts.push(
        new ChangeActivableStatusLocalEvent({
          parentEventId: state.getLastEventId(),
          source: { type: 'trigger', id: trigger.uid },
          simTimeStamp: state.getSimTime(),
          target: trigger.uid,
          option: 'deactivate',
        })
      );
    }

    impacts.push(...evaluateTriggerImpacts(state, trigger));

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
