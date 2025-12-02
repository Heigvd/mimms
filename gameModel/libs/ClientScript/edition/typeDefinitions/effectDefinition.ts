// TODO def? and from/to flat

import { Effect } from '../../game/common/impacts/effect';
import { Uid } from '../../game/common/interfaces';
import { generateId } from '../../tools/helper';
import { MapToFlatType } from '../typeDefinitions/definition';

export type FlatEffect = MapToFlatType<Effect, 'effect'>;

// TODO that is quick and dirty coded. Do we need a real definition here ?

export function getDefaultEffect(parentId: Uid): Effect {
  return {
    type: 'effect',
    tag: 'New effect',
    parent: parentId,
    uid: generateId(10),
    index: 0,
    impacts: [],
  };
}

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
