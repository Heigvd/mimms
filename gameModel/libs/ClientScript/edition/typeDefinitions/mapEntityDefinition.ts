// EVALUATION_PRIORITY 0

import { Uid } from '../../game/common/interfaces';
import { MapEntityDescriptor } from '../../game/common/mapEntities/mapEntityDescriptor';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { generateId } from '../../tools/helper';
import {
  ALL_EDITABLE,
  Definition,
  MapToFlatType,
  ValidationResult,
} from '../typeDefinitions/definition';

type MapEntityDefinition = Definition<MapEntityDescriptor>;

export type FlatMapEntity = MapToFlatType<MapEntityDescriptor, 'mapEntity'>;

export function toFlatMapEntity(mapEntity: MapEntityDescriptor, parentId: Uid): FlatMapEntity {
  const { mapObjects: obj, ...flatMapEntity } = mapEntity;

  return {
    ...flatMapEntity,
    superType: 'mapEntity',
    parent: parentId,
  };
}

export function fromFlatMapEntity(fMapEntity: FlatMapEntity): MapEntityDescriptor {
  const { superType: s, parent: p, ...mapEntity } = fMapEntity;
  return {
    ...mapEntity,
    mapObjects: [],
  };
}

export function getMapEntityDefinition(): MapEntityDefinition {
  return {
    type: 'mapEntity',
    getDefault: () => ({
      type: 'mapEntity',
      activableType: 'mapEntity',
      uid: generateId(10),
      index: 0,
      tag: 'Map Entity ' + generateId(3),
      activeAtStart: false, // OK?
      binding: LOCATION_ENUM.custom, // TODO figure out depending o where created
      buildStatus: 'built',
      mapObjects: [],
    }),
    validator: validateMapEntity,
    view: {
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      tag: ALL_EDITABLE,
      activeAtStart: ALL_EDITABLE,
      binding: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      buildStatus: ALL_EDITABLE, // TODO figure out
      mapObjects: ALL_EDITABLE,
    },
  };
}

// TODO complete
function validateMapEntity(mapEntity: MapEntityDescriptor): ValidationResult {
  const result: ValidationResult = {
    success: true,
    messages: [],
  };

  if (mapEntity?.mapObjects?.length < 1) {
    result.messages.push({
      isTranslateKey: false,
      logLevel: 'WARN',
      message: `The map entity '${mapEntity?.tag}' has no defined geometry`,
    });
  } else {
    mapEntity?.mapObjects?.forEach(_mo => {
      // TODO check that all of its points falls in the extent of the map configuration
    });
  }

  return result;
}
