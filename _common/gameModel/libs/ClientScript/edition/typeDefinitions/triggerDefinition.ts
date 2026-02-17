// EVALUATION_PRIORITY 0

import { Uid } from '../../game/common/interfaces';
import { Trigger } from '../../game/common/triggers/trigger';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition, MapToFlatType } from './definition';
import { triggerValidator } from './validation/triggerValidation';
import { TriggerValidationContext } from './validation/validationContext';

type TriggerDefinition = Definition<Trigger, TriggerValidationContext>;

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
      tag: 'New trigger',
      comment: '',
      accessLevel: 'basic',
      mandatory: false,
      deactivateItself: false,
      operator: 'AND',
      conditions: [],
      impacts: [],
    }),
    validator: triggerValidator,
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
