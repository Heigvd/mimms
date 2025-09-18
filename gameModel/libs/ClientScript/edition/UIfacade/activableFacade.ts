/***
 * Read queries on activable descriptor objects
 */

import { isActivableDescriptor, Uid } from '../../game/common/interfaces';
import { entries } from '../../tools/helper';
import { FlatActivable } from '../controllers/dataController';
import { getFlatObjects } from '../UIfacade/genericConfigFacade';

export type ActivableTypeNames = FlatActivable['activableType'];

// TODO more filtering might be needed if some elements are non impactable by scenarist

export function getActivableOfType(aType: ActivableTypeNames | 'all'): Record<Uid, FlatActivable> {
  const result: Record<Uid, FlatActivable> = {};
  entries(getFlatObjects()).forEach(([id, obj]) => {
    if (isActivableDescriptor(obj) && (aType === obj.activableType || aType === 'all')) {
      result[id] = obj;
    }
  });

  return result;
}

export function getActivableSelection(
  aType: ActivableTypeNames,
  parentId?: Uid
): { label: string; value: string }[] {
  const items = getActivableOfType(aType);
  return Object.values(items)
    .filter(item => !parentId || item.parent == parentId)
    .map(item => {
      return { label: item.tag, value: String(item.uid) };
    });
}

export function getActivableTag(aType: ActivableTypeNames, id: Uid): string {
  const item = getActivableOfType(aType)[id];

  if (item) {
    return item.tag;
  }

  return '';
}
