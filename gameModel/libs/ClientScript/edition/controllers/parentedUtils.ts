import { Parented, SuperTyped, Uid } from '../../game/common/interfaces';
import { group } from '../../tools/groupBy';
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

/**
 * Given a flat structure of parented element, group all siblings of same type
 * returns a record parent+supertype -> children record
 */
export function getAllSiblings<T extends Parented & SuperTyped>(
  data: Record<Uid, T>
): Record<string, T[]> {
  return group(Object.values(data), e => {
    return e.parent + e.superType;
  });
}

export function clusterSiblings<T>(siblings: T[], isSiblingFunc: (a: T, b: T) => boolean): T[][] {
  const clusters: T[][] = [];
  for (const child of Object.values(siblings)) {
    let placed = false;
    for (const cluster of clusters) {
      if (isSiblingFunc(cluster[0]!, child)) {
        placed = true;
        cluster.push(child);
        break;
      }
    }
    if (!placed) {
      // create new cluster
      clusters.push([child]);
    }
  }

  return clusters;
}
