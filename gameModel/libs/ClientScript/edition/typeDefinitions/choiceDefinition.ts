import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition } from '../typeDefinitions/definition';

type ChoiceDefinition = Definition<ChoiceDescriptor>;

export function getChoiceDefinition(): ChoiceDefinition {
  return {
    type: 'choice',
    getDefault: () => ({
      type: 'choice',
      uid: generateId(10),
      activableType: 'choice',
      activeAtStart: true,
      defaultEffect: '',
      description: 'description',
      effects: [],
      title: 'title',
      parent: 'no parent',
      placeHolder: 'no placeholder', // should there be a default one ?
      tag: 'define tag',
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      defaultEffect: ALL_EDITABLE,
      description: ALL_EDITABLE,
      effects: {
        parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
        impacts: ALL_EDITABLE,
        tag: ALL_EDITABLE,
        uid: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      },
      title: ALL_EDITABLE,
      parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      placeHolder: ALL_EDITABLE,
      tag: ALL_EDITABLE,
    },
  };
}
