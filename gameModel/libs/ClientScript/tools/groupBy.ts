/**
 * Group elements of an array using a discriminant function
 * @param array input array
 * @param getGroupId function that gets a group id from a given element
 * @returns a record grouped by ids
 */
export function group<K extends number | string | symbol, V>(
  array: Readonly<V[]>,
  getGroupId: (elem: V) => K,
): Record<K, V[]> {
  return array.reduce<Record<K, V[]>>((map, elem) => {
    const id = getGroupId(elem);
    if (!map[id]) {
      map[id] = [];
    }
    map[id]!.push(elem);
    return map;
  }, {} as Record<K, V[]>);
}
