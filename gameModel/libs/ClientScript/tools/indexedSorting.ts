import { IDescriptor, Indexed, Uid } from '../game/common/interfaces';
import { sortingLogger } from './logger';

export type OperationType = 'UP' | 'DOWN' | 'TOP' | 'BOTTOM';

/**
 * Recomputes consecutive indexes starting from 0
 */
function recomputeIndexes<T extends Indexed & IDescriptor>(data: Record<Uid, T>): T[] {
  const values = Object.values(data);
  values.sort(comparator);
  let i = 0;
  values.forEach(v => (v.index = i++));
  return values;
}

/**
 * Normalizes all indexes numbered from 0 to n and moves the target element
 * down/bottom have no effect if the element is last.
 * And similarly with up/top if first
 */
export function moveElement<T extends Indexed & IDescriptor>(
  targetId: Uid,
  data: Record<Uid, T>,
  operation: OperationType
): void {
  if (!data[targetId]) {
    sortingLogger.warn(
      `Element ${targetId} is not part of ${JSON.stringify(data)} cannot perform move operation`
    );
    return;
  }
  const target = data[targetId]!;
  const sorted = recomputeIndexes(data);

  switch (operation) {
    case 'TOP':
      target.index = -1;
      // shift all indexes to have a 0-n indexing
      sorted.forEach(e => e.index++);
      break;
    case 'BOTTOM':
      target.index = sorted.length;
      break;
    case 'UP':
      if (target.index > 0) {
        const prev = sorted[target.index - 1];
        prev!.index++;
        target.index--;
      }
      break;
    case 'DOWN':
      if (target.index < sorted.length - 1) {
        const next = sorted[target.index + 1];
        next!.index--;
        target.index++;
      }
      break;
  }
}

export function sortIndexed<T extends Indexed & IDescriptor>(data: Record<Uid, T>): T[] {
  return Object.values(data).sort(comparator);
}

function comparator<T extends Indexed & IDescriptor>(a: T, b: T): number {
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  }
  return a.uid?.localeCompare(b.uid);
}

export function canMove<T extends Indexed & IDescriptor>(
  id: Uid,
  data: Record<Uid, T>,
  moveType: OperationType
): boolean {
  if (!data[id]) {
    sortingLogger.warn(`Element ${id} is not part of ${JSON.stringify(data)} cannot move`);
    return false;
  }

  // if any bigger/smaller then we can move down/up respectively
  if (moveType === 'BOTTOM' || moveType === 'DOWN') {
    return Object.values(data).some(other => comparator(other, data[id]!) > 0);
  } else {
    return Object.values(data).some(other => comparator(other, data[id]!) < 0);
  }
}
