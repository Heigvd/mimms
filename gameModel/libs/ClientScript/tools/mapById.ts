export interface MappableById<K extends string | number> {
  id(): K;
}

export function mapById<K extends string | number, V extends MappableById<K>>(array: V[]): Record<K, V[]> {

  const val = array.reduce<Record<K, V[]>>((map, act) =>{

    const id = act.id();
    if(!map[id]){
      map[id] = []
    }
    map[id]!.push(act);
    return map;
  }, {} as Record<K, V[]>);

  return val;
}