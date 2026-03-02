import {
  MapEntityDescriptor,
  MapObject,
} from '../../../game/common/mapEntities/mapEntityDescriptor';
import { LOCATION_ENUM } from '../../../game/common/simulationState/locationState';
import { getMapObjectDefinition } from '../mapObjectDefinition';
import { LocationValidationContext, LocationValidationMessage } from './validationContext';

export function mapEntityValidator(
  mapEntity: MapEntityDescriptor,
  ctx: LocationValidationContext
): LocationValidationMessage[] {
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selectedFilter = mapEntity.binding;
  extendedCtx.targetState.selected.mapEntity = mapEntity.uid;

  const result: LocationValidationMessage[] = [];

  if (mapEntity.mapObjects?.length === 0) {
    result.push({
      id: 'no-map-object-' + mapEntity.uid,
      level: 'ERROR',
      title: `Location "${mapEntity.tag}" without shape`,
      description:
        'A location is defined without an associated point, line or polygon.<br/>Each location must have a shape to be used in the simulation.',
      validationContext: extendedCtx,
    });
  }

  // Note : cannot happen through the scenario edition interface
  if (
    mapEntity.binding !== LOCATION_ENUM.custom &&
    mapEntity.binding !== LOCATION_ENUM.chantier &&
    mapEntity.activeAtStart
  ) {
    result.push({
      id: 'active-basic-location-map-object-' + mapEntity.uid,
      level: 'ERROR',
      title: 'Basic location active at start',
      description:
        'A basic location should not be active when the simulation starts.<br/>Please disable this location in the Locations tab.',
      validationContext: extendedCtx,
    });
  }

  mapEntity.mapObjects.forEach((mapObject: MapObject) => {
    const validator = getMapObjectDefinition(mapObject.type).validator as (
      values: MapObject,
      ctx: LocationValidationContext
    ) => LocationValidationMessage[];
    result.push(...validator(mapObject, extendedCtx));
  });

  return result;
}
