// EVALUATION_PRIORITY 0

import { Effect } from '../../game/common/impacts/effect';
import { Uid } from '../../game/common/interfaces';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition, MapToFlatType } from '../typeDefinitions/definition';

type EffectDefinition = Definition<Effect>;

export type FlatEffect = MapToFlatType<Effect, 'effect'>;

export function toFlatEffect(effect: Effect, parentId: Uid): FlatEffect {
  return {
    ...effect,
    parent: parentId,
    superType: 'effect',
  };
}

export function fromFlatEffect(flatEffect: FlatEffect): Effect {
  const { superType: st, ...effect } = flatEffect;
  return {
    ...effect,
    impacts: [],
  };
}

export function getEffectDefinition(): EffectDefinition {
  return {
    type: 'effect',
    getDefault: () => ({
      type: 'effect',
      uid: generateId(10),
      index: 0,
      tag: 'New effect',
      parent: 'no parent',
      impacts: [],
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      tag: ALL_EDITABLE,
      impacts: ALL_EDITABLE,
    },
  };
}
