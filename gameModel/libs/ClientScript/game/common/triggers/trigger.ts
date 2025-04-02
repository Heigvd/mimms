import { triggerLogger } from '../../../tools/logger';
import { LocalEventBase } from '../localEvents/localEventBase';
import { RadioType } from '../radio/communicationType';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { IActivable, IDescriptor } from './common';
import { Condition, evaluateCondition } from './condition';
import { convertToLocalEvents, Impact } from './impact';

export interface Trigger extends IActivable, IDescriptor {
  priority: number;
  repeatable: boolean;
  operator: 'OR' | 'AND';
  conditions: Condition[];
  impacts: Impact[];
}

interface ActionTemplateDescriptor extends IActivable, IDescriptor {
  type: string;
  // TODO
}

interface ChoiceDescriptor extends IActivable, IDescriptor {
  actionRef: string;
  impacts: Impact[];
  // TODO
}

interface MapLocationDescriptor extends IActivable, IDescriptor {
  //TODO
}

function evaluateTriggerConditions(state: MainSimulationState, trigger: Trigger): boolean {
  if (trigger.active) {
    if (trigger.conditions.length === 0) {
      return true;
    }
    if (trigger.operator === 'AND') {
      triggerLogger.debug('Evaluating AND on', trigger.conditions);
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

export function evaluateTrigger(state: MainSimulationState, event: Trigger): LocalEventBase[] {
  if (evaluateTriggerConditions(state, event)) {
    if (!event.repeatable) {
      // deactivate event, TODO see if LocalEvent emitted instead
      event.active = false;
    }
    return evaluateTriggerImpacts(state, event);
  }
  return [];
}

export function getTestTriggers(): Trigger[] {
  return [
    {
      priority: 0,
      active: true,
      conditions: [
        {
          type: 'Time',
          operator: '>',
          timeSeconds: 120,
        },
      ],
      impacts: [
        {
          type: 'notification',
          role: 'AL',
          delaySeconds: 60,
          message: 'Hey this is a trigger talking to you',
        },
      ],
      operator: 'OR',
      repeatable: false,
      tag: 'Test Trigger',
      uid: 1234,
    },
    // RADIO IMPACT
    {
      priority: 0,
      active: true,
      conditions: [
        {
          type: 'Time',
          operator: '>',
          timeSeconds: 60 * 10,
        },
        {
          type: 'Time',
          operator: '<',
          timeSeconds: 60 * 13,
        },
      ],
      impacts: [
        {
          type: 'radio',
          canal: RadioType.CASU,
          delaySeconds: 0,
          message: 'Triggers can talk in the radio too',
        },
      ],
      operator: 'AND',
      repeatable: true,
      tag: 'Test Trigger',
      uid: 1234,
    },
  ];
}
