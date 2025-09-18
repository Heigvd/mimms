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
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' }, // actually never displayed
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      activableType: { basic: 'hidden', advanced: 'hidden', expert: 'visible' }, // actually never displayed
      activeAtStart: ALL_EDITABLE, // actually always displayed
      tag: ALL_EDITABLE, // actually always displayed
      comment: ALL_EDITABLE, // actually always displayed
      accessLevel: { basic: 'hidden', advanced: 'editable', expert: 'editable' }, // TODO
      mandatory: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      repeatable: ALL_EDITABLE, // actually always displayed
      operator: ALL_EDITABLE, // actually always displayed
      conditions: ALL_EDITABLE, // actually always displayed
      impacts: ALL_EDITABLE, // actually always displayed
    },
  };
}
