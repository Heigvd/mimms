import { Parented, SuperTyped, Uid } from '../../game/common/interfaces';
import { filterRecord } from '../../tools/helper';

/**
 * Given a flat structure of parented elements, removes all children entries and self
 * The input is modified
 * Returns the ids of the removed elements
 */
export function removeRecursively<T extends Parented>(id: Uid, data: Record<Uid, T>): Set<Uid> {
  const parentList: Uid[] = [id];
  const removed: Set<Uid> = new Set<Uid>();

  while (parentList.length > 0) {
    const parent = parentList.pop()!;
    const toRemove = [parent];
    Object.entries(data)
      .filter(([_uid, obj]) => obj.parent === parent)
      .forEach(([uid, _obj]) => {
        toRemove.push(uid);
        parentList.push(uid);
      });
    toRemove.forEach(uid => {
      delete data[uid];
      removed.add(uid);
    });
  }
  return removed;
}

/**
 * Given a flat structure of parented elements, find all siblings including self
 */
export function getSiblings<T extends Parented & SuperTyped>(
  id: Uid,
  data: Record<Uid, T>
): Record<Uid, T> {
  const target = data[id];
  return filterRecord(data, e => e.parent === target?.parent && e.superType == target?.superType);
}
