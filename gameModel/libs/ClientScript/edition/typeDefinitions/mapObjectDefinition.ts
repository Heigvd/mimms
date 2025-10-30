import { Parented, SuperTyped, Uid } from '../../game/common/interfaces';
import { MapObject } from '../../game/common/mapEntities/mapEntityDescriptor';

export type FlatMapObject = MapObject & Parented & SuperTyped & { superType: 'geometry' };

export function toFlatMapObject(obj: MapObject, parentId: Uid): FlatMapObject {
  return {
    ...obj,
    superType: 'geometry',
    parent: parentId,
  };
}

export function fromFlatMapObject(flat: FlatMapObject): MapObject {
  const { superType: _ignored, ...obj } = flat;
  return obj;
}

// XGO TODO make definition (see other definition files)
