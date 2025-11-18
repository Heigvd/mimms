// EVALUATION_PRIORITY 0

import { Impact } from '../../game/common/impacts/impact';
import { Uid } from '../../game/common/interfaces';
import { Condition } from '../../game/common/triggers/condition';
import { Trigger } from '../../game/common/triggers/trigger';
import { generateId } from '../../tools/helper';
import { getConditionDefinition } from './conditionDefinition';
import {
  ALL_EDITABLE,
  Definition,
  MapToFlatType,
  mergeValidationResults,
  ValidationResult,
} from './definition';
import { getImpactDefinition } from './impactDefinition';

type TriggerDefinition = Definition<Trigger>;

export type FlatTrigger = MapToFlatType<Trigger, 'trigger'>;

export function toFlatTrigger(trigger: Trigger, parentId: Uid): FlatTrigger {
  const { conditions: c, impacts: i, ...flatTrigger } = trigger;

  return {
    ...flatTrigger,
    superType: 'trigger',
    parent: parentId,
  };
}

export function fromFlatTrigger(ftrigger: FlatTrigger): Trigger {
  const { superType: s, parent: p, ...trigger } = ftrigger;
  return {
    ...trigger,
    impacts: [],
    conditions: [],
  };
}

export function getTriggerDefinition(): TriggerDefinition {
  return {
    type: 'trigger',
    getDefault: () => ({
      type: 'trigger',
      uid: generateId(10),
      index: 0,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'trigger ' + generateId(3),
      comment: '',
      accessLevel: 'basic',
      mandatory: false,
      deactivateItself: false,
      operator: 'AND',
      conditions: [],
      impacts: [],
    }),
    validator: triggerCompleteValidator,
    view: {
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      activableType: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      tag: ALL_EDITABLE,
      comment: ALL_EDITABLE,
      accessLevel: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      mandatory: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      deactivateItself: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      conditions: ALL_EDITABLE,
      impacts: ALL_EDITABLE,
    },
  };
}

function triggerCompleteValidator(trigger: Trigger): ValidationResult {
  // for the trigger itself
  let result: ValidationResult = checkTriggerHasImpact(trigger);

  // for each condition
  trigger.conditions.forEach((cond: Condition) => {
    const validator = getConditionDefinition(cond.type).validator as (
      value: Condition
    ) => ValidationResult;
    result = mergeValidationResults(result, validator(cond));
  });

  // for each impact
  trigger.impacts.forEach((imp: Impact) => {
    const validator = getImpactDefinition(imp.type).validator as (
      value: Impact
    ) => ValidationResult;
    result = mergeValidationResults(result, validator(imp));
  });

  return result;
}

function checkTriggerHasImpact(trigger: Trigger): ValidationResult {
  let success: boolean = true;
  const messages: ValidationResult['messages'] = [];

  if (trigger.impacts.length === 0) {
    success = false;
    messages.push({
      logLevel: 'WARN',
      message: 'A trigger should have an impact',
      isTranslateKey: false,
    });
  }

  return { success, messages };
}
