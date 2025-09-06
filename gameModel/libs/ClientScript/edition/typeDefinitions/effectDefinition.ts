// TODO def? and from/to flat

import { Effect } from '../../game/common/impacts/effect';
import { Parented, SuperTyped, Uid } from '../../game/common/interfaces';
import { generateId } from '../../tools/helper';

export type FlatEffect = Effect & Parented & SuperTyped & { superType: 'effect' };

// TODO that was quick and dirty coded. Do we need a real definition here ?
export function toFlatEffect(parentId: Uid): FlatEffect {
  return {
    type: 'effect',
    superType: 'effect',
    parent: parentId,
    impacts: [],
    tag: 'New effect',
    uid: generateId(10),
    index: 0,
  };
}
