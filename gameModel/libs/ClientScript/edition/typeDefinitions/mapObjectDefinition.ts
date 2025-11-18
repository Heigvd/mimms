// EVALUATION_PRIORITY 0

import { Parented, SuperTyped, Uid } from '../../game/common/interfaces';
import {
  LineMapObject,
  MapObject,
  PointMapObject,
  PolygonMapObject,
} from '../../game/common/mapEntities/mapEntityDescriptor';
import { generateId } from '../../tools/helper';
import { scenarioEditionLogger } from '../../tools/logger';
import { createOrUpdateTranslation } from '../../tools/translation';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  ToConfigurationViewType,
} from '../typeDefinitions/definition';

type MapObjectDefinition = MapToDefinition<MapObject>;
type MapObjectTypeName = MapObject['type'];

export type FlatMapObject = MapObject & Parented & SuperTyped & { superType: 'geometry' };

export function toFlatMapObject(obj: MapObject, parentId: Uid): FlatMapObject {
  return {
    ...obj,
    superType: 'geometry',
    parent: parentId,
  };
}

export function fromFlatMapObject(flat: FlatMapObject): MapObject {
  const { superType: _s, ...obj } = flat;
  return obj;
}

// XGO TODO do we need an empty map object type ?

export function getMapObjectDefinition(type: MapObjectTypeName): MapObjectDefinition {
  let definition: MapObjectDefinition;

  switch (type) {
    case 'Point':
      definition = getLineMapObjectDef();
      break;
    case 'LineString':
      definition = getLineMapObjectDef();
      break;
    case 'Polygon':
      definition = getPolygonMapObjectDef();
      break;
  }

  if (definition?.type !== type) {
    scenarioEditionLogger.error('Could not provide a type definition for type', type);
  }

  return definition;
}

type CommonView = ToConfigurationViewType<
  Pick<MapObject, 'type' | 'uid' | 'index' | 'label' | 'labelOffset' | 'parent'>
>;
function getCommonView(): CommonView {
  return {
    type: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
    uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
    index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
    label: ALL_EDITABLE,
    labelOffset: ALL_EDITABLE,
    parent: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
  };
}

type CommonDefault = Pick<MapObject, 'index' | 'uid' | 'label' | 'labelOffset' | 'parent'>;
function getCommonDefault(): CommonDefault {
  return {
    index: 0,
    uid: generateId(10),
    label: createOrUpdateTranslation('', undefined),
    labelOffset: [0, 0],
    parent: 'default-parent',
  };
}

export function getPointMapObjectDef(): Definition<PointMapObject> {
  return {
    type: 'Point',
    getDefault: () => ({
      ...getCommonDefault(),
      type: 'Point',
      icon: 'empty', // TODO some default icon or fall back as a computed round dot?
      geometry: [0, 0], // TODO inject created geometry in interface
    }),
    validator: (_point: PointMapObject) => ({ success: true, messages: [] }), // TODO warning if out of zone
    view: {
      ...getCommonView(),
      icon: ALL_EDITABLE,
      geometry: ALL_EDITABLE,
    },
  };
}

export function getLineMapObjectDef(): Definition<LineMapObject> {
  return {
    type: 'LineString',
    getDefault: () => ({
      ...getCommonDefault(),
      type: 'LineString',
      geometry: [], // TODO inject created geometry in interface
    }),
    validator: (_line: LineMapObject) => ({ success: true, messages: [] }), // TODO warning if out of zone
    view: {
      ...getCommonView(),
      geometry: ALL_EDITABLE,
    },
  };
}

export function getPolygonMapObjectDef(): Definition<PolygonMapObject> {
  return {
    type: 'Polygon',
    getDefault: () => ({
      ...getCommonDefault(),
      type: 'Polygon',
      geometry: [], // TODO inject created geometry in interface
    }),
    validator: (_polygon: PolygonMapObject) => ({ success: true, messages: [] }), // TODO warning if out of zone
    view: {
      ...getCommonView(),
      geometry: ALL_EDITABLE,
    },
  };
}
