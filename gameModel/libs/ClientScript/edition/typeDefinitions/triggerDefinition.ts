import { Uid } from '../../game/common/interfaces';
import { Trigger } from '../../game/common/triggers/trigger';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition, MapToFlatType } from './definition';

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
      tag: 'change the world',
      comment: '',
      accessLevel: 'basic',
      mandatory: false,
      repeatable: true,
      operator: 'AND',
      conditions: [],
      impacts: [],
    }),
    validator: _t => ({ success: true, messages: [] }), // nothing to do, it cannot be misconfigured
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
      repeatable: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      conditions: ALL_EDITABLE,
      impacts: ALL_EDITABLE,
    },
  };
}
