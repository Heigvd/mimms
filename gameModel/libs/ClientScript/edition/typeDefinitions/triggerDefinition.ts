import { Trigger } from '../../game/common/triggers/trigger';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition } from '../typeDefinitions/definition';

type TriggerDefinition = Definition<Trigger>;

export function getTriggerDefinition(): TriggerDefinition {
  return {
    type: 'trigger',
    getDefault: () => ({
      type: 'trigger',
      uid: generateId(10),
      activableType: 'trigger',
      conditions: [],
      impacts: [],
      operator: 'AND',
      priority: 0,
      activeAtStart: true,
      repeatable: true,
      tag: 'TODO some default tag',
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      conditions: ALL_EDITABLE,
      impacts: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      repeatable: ALL_EDITABLE,
      priority: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      tag: ALL_EDITABLE,
    },
  };
}
