// EVALUATION_PRIORITY 0

import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Uid } from '../../game/common/interfaces';
import { generateId } from '../../tools/helper';
import {
  ALL_EDITABLE,
  Definition,
  EXPERT_ONLY,
  MapToFlatType,
} from '../typeDefinitions/definition';

type ChoiceDefinition = Definition<ChoiceDescriptor>;

export type FlatChoice = MapToFlatType<ChoiceDescriptor, 'choice'>;

export function toFlatChoice(choice: ChoiceDescriptor, parentId: Uid): FlatChoice {
  const { effects: _ignore, ...fchoice } = choice;
  return {
    ...fchoice,
    parent: parentId,
    superType: 'choice',
  };
}

export function fromFlatChoice(fchoice: FlatChoice): ChoiceDescriptor {
  const { superType: _ignored, ...choice } = fchoice;
  return {
    ...choice,
    effects: [],
  };
}

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
      index: 0,
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      defaultEffect: ALL_EDITABLE,
      description: ALL_EDITABLE,
      effects: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      //parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      //impacts: ALL_EDITABLE,
      //tag: ALL_EDITABLE,
      //uid: { basic: 'hidden', advanced: 'visible', expert: 'visible' },

      title: ALL_EDITABLE,
      parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      placeholder: ALL_EDITABLE,
      tag: ALL_EDITABLE,
      index: EXPERT_ONLY,
    },
  };
}
