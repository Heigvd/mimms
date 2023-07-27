
/**
 * Group elements of an array using a discriminant function
 * @param array 
 * @param getGroupId function providing a discriminant to pick the group
 * @returns 
 */
export function group<K extends number | string | symbol, V>(array: Readonly<V[]>, getGroupId : ((elem: V) => K)): Record<K,V[]> {
  const val = array.reduce<Record<K, V[]>>((map, elem) =>{

    const id = getGroupId(elem);
    if(!map[id]){
      map[id] = []
    }
    map[id]!.push(elem);
    return map;
  }, {} as Record<K, V[]>);

  return val;
}