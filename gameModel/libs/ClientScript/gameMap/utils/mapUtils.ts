import { FeatureCollection } from '../../gameMap/types/featureTypes';
import { Point } from '../../map/point2D';

/**
 * Convert Point to PointLikeObject
 * @param {Point} point Point to be converted
 */
export function pointToPointLike(point: Point): PointLikeObject {
  return [point.x, point.y];
}

/**
 * Convert PointLikeObject to Point
 * @param {PointLikeObject} point PointLikeObject to be converted
 */
export function pointLikeToPoint(point: PointLikeObject): Point {
  return { x: point[0], y: point[1] };
}

/**
 * Get an empty featureCollection object
 * @param {string} [name] Name for the featureCollection
 */
export function getEmptyFeatureCollection(name?: string): FeatureCollection {
  return {
    type: 'FeatureCollection',
    name: `${name}`,
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::2056' } },
    features: [],
  };
}
