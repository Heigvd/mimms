import { MapObject } from '../../game/common/mapEntities/mapEntityDescriptor';

export function getShapeCenter(mapObject: MapObject): PointLikeObject {
  switch (mapObject.type) {
    case 'Point':
      return mapObject.geometry;
    case 'LineString':
      return getLineStringCenter(mapObject.geometry);
    case 'Polygon':
      return getPolygonCenter(mapObject.geometry);
  }
}

/*
 * Computes middle point of string shape composed of 2 vertices
 */
function getLineStringCenter(geometry: PointLikeObject[]): PointLikeObject {
  return [(geometry[0]![0] + geometry[1]![0]) / 2.0, (geometry[0]![1] + geometry[1]![1]) / 2.0];
}

/*
 * Computes centroid of polygon shape
 * source https://www.spatialanalysisonline.com/HTML/centroids_and_centers.htm
 * assumption : every vertice is non null and has defined x,y coordinates
 */
function getPolygonCenter(geometry: PointLikeObject[][]): PointLikeObject {
  const vertices = geometry[0]!;
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

/**
 * Returns the end point and rotation for a given line segment
 *
 * @param segment PointLikeObject of segment
 *
 * @returns End point and rotation of segment
 */
export function getLineEndAndRotation(segment: PointLikeObject[]): {
  end: PointLikeObject;
  rotation: number;
} {
  const start = segment[0];
  let end = segment[1];

  let rotation = 0;
  if (end && start) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    rotation = Math.atan2(dy, dx);
  }
  end = end || [0, 0];
  return { end, rotation };
}
