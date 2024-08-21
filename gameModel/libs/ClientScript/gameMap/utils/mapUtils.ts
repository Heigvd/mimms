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

/*
 * Computes centroid of polygon shape
 * source https://www.spatialanalysisonline.com/HTML/centroids_and_centers.htm
 * assumption : every vertice is non null and has defined x,y coordinates
 */
export function getPolygonCentroid(vertices: PointLikeObject[]): PointLikeObject {
  const centroid: PointLikeObject = [0, 0];
  const vertexCount: number = vertices.length;

  let area: number = 0;
  let x0: number = 0; // Current vertex X
  let y0: number = 0; // Current vertex Y
  let x1: number = 0; // Next vertex X
  let y1: number = 0; // Next vertex Y
  let a: number = 0; // Partial signed area
  let i: number = 0; // Counter

  for (; i < vertexCount - 1; ++i) {
    x0 = vertices[i]![0];
    y0 = vertices[i]![1];
    x1 = vertices[i + 1]![0];
    y1 = vertices[i + 1]![1];

    a = x0 * y1 - x1 * y0;

    area += a;

    centroid[0] += (x0 + x1) * a;
    centroid[1] += (y0 + y1) * a;
  }

  // Do last vertex separately to avoid performing an expensive
  // modulus operation in each iteration.
  x0 = vertices[i]![0];
  y0 = vertices[i]![1];
  x1 = vertices[0]![0];
  y1 = vertices[0]![1];

  a = x0 * y1 - x1 * y0;

  area += a;
  centroid[0] += (x0 + x1) * a;
  centroid[1] += (y0 + y1) * a;
  area *= 0.5;

  centroid[0] /= 6 * area;
  centroid[1] /= 6 * area;

  return centroid;
}

/*
 * Computes middle point of string shape composed of 2 vertices
 */
export function getLineStringMiddlePoint(vertices: PointLikeObject[]): PointLikeObject {
  return [(vertices[0]![0] + vertices[1]![0]) / 2.0, (vertices[0]![1] + vertices[1]![1]) / 2.0];
}
