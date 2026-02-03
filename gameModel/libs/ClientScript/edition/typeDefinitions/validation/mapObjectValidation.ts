import {
  LineMapObject,
  MapObject,
  PointMapObject,
  PolygonMapObject,
} from '../../../game/common/mapEntities/mapEntityDescriptor';
import { getMapConfig, MapConfig } from '../../../gameMap/utils/mapConfig';
import { isPointOutOfExtent } from '../../../gameMap/utils/mapUtils';
import { LocationValidationContext, LocationValidationMessage } from './validationContext';

export function pointMapObjectValidator(
  point: PointMapObject,
  ctx: LocationValidationContext
): LocationValidationMessage[] {
  if (isPointOutOfView([point.geometry])) {
    return [getOutOfViewValidationMessage(point, ctx)];
  }

  return [];
}

export function lineMapObjectValidator(
  line: LineMapObject,
  ctx: LocationValidationContext
): LocationValidationMessage[] {
  if (isPointOutOfView(line.geometry)) {
    return [getOutOfViewValidationMessage(line, ctx)];
  }

  return [];
}

export function polygonMapObjectValidator(
  polygon: PolygonMapObject,
  ctx: LocationValidationContext
): LocationValidationMessage[] {
  if (isPointOutOfView(polygon.geometry.flatMap(points => points))) {
    return [getOutOfViewValidationMessage(polygon, ctx)];
  }

  return [];
}

function isPointOutOfView(points: PointLikeObject[]): boolean {
  const mapConfig: MapConfig = getMapConfig();
  return points.some(point => isPointOutOfExtent(point, mapConfig.extent));
}

function getOutOfViewValidationMessage(
  mapObject: MapObject,
  ctx: LocationValidationContext
): LocationValidationMessage {
  return {
    id: 'out-of-sight-' + mapObject.uid,
    level: 'ERROR',
    title: 'Location outside the selected area',
    description:
      'One or more locations are outside the defined area on the map.<br/>Verify that all geometries are fully included within the selected area.',
    validationContext: ctx,
  };
}
