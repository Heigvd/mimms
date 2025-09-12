import { Parented, SuperTyped } from '../../game/common/interfaces';
import { MapObject } from '../../game/common/mapEntities/mapEntityDescriptor';

export type FlatMapObject = MapObject & Parented & SuperTyped & { superType: 'geometry' };

export function toFlatMapObject(obj: MapObject): FlatMapObject {
  return {
    ...obj,
    superType: 'geometry',
    parent: '',
  };
}

export function fromFlatMapObject(flat: FlatMapObject): MapObject {
  const { superType: _ignored, parent: _ignore, ...obj } = flat;
  return obj;
}

// XGO TODO make definition (see other definition files)
