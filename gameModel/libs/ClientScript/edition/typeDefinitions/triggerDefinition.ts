import { Trigger } from '../../game/common/triggers/trigger';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition } from './definition';

type TriggerDefinition = Definition<Trigger>;

export function getTriggerDefinition(): TriggerDefinition {
  return {
    type: 'trigger',
    getDefault: () => ({
      type: 'trigger',
      uid: generateId(10),
      index: 0,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'TODO some default tag',
      repeatable: true,
      operator: 'AND',
      conditions: [],
      impacts: [],
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      tag: ALL_EDITABLE,
      repeatable: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      conditions: ALL_EDITABLE,
      impacts: ALL_EDITABLE,
      comment: ALL_EDITABLE,
    },
  };
}
