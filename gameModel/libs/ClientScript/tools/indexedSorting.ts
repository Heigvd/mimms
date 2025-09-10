import { Indexed } from '../game/common/interfaces';

export type OperationType = 'UP' | 'DOWN' | 'TOP' | 'BOTTOM';

/**
 * Recomputes consecutive indexes starting from 0
 */
function recomputeIndexes<T extends Indexed>(data: Record<string, T>): T[] {
  const values = Object.values(data);
  values.sort((a, b) => a.index - b.index);
  let i = 0;
  values.forEach(v => (v.index = i++));
  return values;
}

export function moveElement<T extends Indexed>(
  targetId: string,
  data: Record<string, T>,
  operation: OperationType
): void {
  if (!data[targetId]) {
    // TODO warning
    return;
  }
  const target = data[targetId]!;
  const sorted = recomputeIndexes(data);

  switch (operation) {
    case 'BOTTOM':
      target.index = -1;
      // shift all indexes to have a 0-n indexing
      sorted.forEach(e => e.index++);
      break;
    case 'TOP':
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

export function sortIndexed<T extends Indexed>(data: Record<string, T>): T[] {
  return Object.values(data).sort((a, b) => a.index - b.index);
}
