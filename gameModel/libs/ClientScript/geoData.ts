import { buildingLayer } from "./buildingData";
import { Point as XYPoint } from "./helper";

/// TYPES
type Point = [number, number]
type Polygon = Point[]
type Buildings = Polygon[]
type Segment = [Point, Point]
interface ObjectSegment {
	id: string,
	point: Point
	lastId: string,
	nextId: string
	angle: number
	squareDistance: number
	arrayLenght: number
	segment: Segment
}

export function getBuildings() {
	const buildings: Point[][] = [];
	if (buildingLayer.current != null) {
		const buildingFeatures = buildingLayer.current.getSource().getFeatures();
		const buildingPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "Polygon");
		const buildingMultiPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "MultiPolygon");

		for (const feature of buildingPolygonFeatures) {
			buildings.push(feature.getGeometry().getCoordinates()[0])
		}
		for (const feature of buildingMultiPolygonFeatures) {
			buildings.push(feature.getGeometry().getCoordinates()[0][0])
		}
	}
	return buildings;
}

export function getBuildingInExtent(extent: ExtentLikeObject) {
	const buildings: Point[][] = [];
	if (buildingLayer.current != null) {
		const buildingFeatures = buildingLayer.current.getSource().getFeaturesInExtent(extent);
		const buildingPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "Polygon");
		const buildingMultiPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "MultiPolygon");

		for (const feature of buildingPolygonFeatures) {
			buildings.push(feature.getGeometry().getCoordinates()[0])
		}
		for (const feature of buildingMultiPolygonFeatures) {
			buildings.push(feature.getGeometry().getCoordinates().flat()[0])
		}
	}
	return buildings;
}

/// LOS LAYER
function angleDistanceToXY(
	startPosition: Point,
	distance: number,
	angle: number
) {
	return {
		x: startPosition[0] + distance * Math.cos(angle),
		y: startPosition[1] + distance * Math.sin(angle),
	};
}

interface VisionPoint {
	angle: number;
	squareDistance: number;
	point: Point;
}

function lineSegmentInterception(s1: Segment, s2: Segment): Point | false {
	const p0 = s1[0], p1 = s1[1],
		p2 = s2[0], p3 = s2[1]
	const s10_x = p1[0] - p0[0], s10_y = p1[1] - p0[1],
		s32_x = p3[0] - p2[0], s32_y = p3[1] - p2[1]
	const denom = s10_x * s32_y - s32_x * s10_y
	if (denom == 0) return false // collinear
	const s02_x = p0[0] - p2[0],
		s02_y = p0[1] - p2[1]
	const s_numer = s10_x * s02_y - s10_y * s02_x
	if (s_numer < 0 == denom > 0) return false // no collision
	const t_numer = s32_x * s02_y - s32_y * s02_x
	if (t_numer < 0 == denom > 0) return false // no collision
	if (s_numer > denom == denom > 0 || t_numer > denom == denom > 0) return false // no collision
	// collision detected
	const t = t_numer / denom
	return [p0[0] + (t * s10_x), p0[1] + (t * s10_y)]
}

export function computeVisionPolygon(
	position: Point,
	buildings: Buildings,
	visionDistance: number = 100,
	nbBoundingSegments: number = 50
): VisionPoint[] {
	// Creating vision bounds
	const surroundingBuilding: Point[] = [];
	for (let i = 0; i < nbBoundingSegments; ++i) {
		const { x: x1, y: y1 } = angleDistanceToXY(
			position,
			visionDistance,
			((i) / nbBoundingSegments * 2 * Math.PI)
		);
		surroundingBuilding.push([x1, y1]);
	}

	const segments = [surroundingBuilding, ...buildings]
		.flatMap(function mapDistanceSegments(building, bi) {
			return building.map((p, i, arr) => {
				const lastIndex = (i - 1) % arr.length;
				const nextIndex = (i + 1) % arr.length;

				// const last = arr[lastIndex];
				const next = arr[nextIndex];

				const dx = p[0] - position[0];
				const dz = p[1] - position[1];
				const objectSegment: ObjectSegment = {
					id: `${bi}-${i}`,
					point: p,
					lastId: `${bi}-${lastIndex}`,
					nextId: `${bi}-${nextIndex}`,
					angle: Math.atan2(dz, dx),
					squareDistance: dx * dx + dz * dz,
					arrayLenght: arr.length,
					segment: [p,
						next]
				}
				return objectSegment;
			});
		})
		.sort(function sortDistanceSegments(a, b) {
			return a.angle - b.angle;
		})
		.reduce<{
			[id: string]: ObjectSegment;
		}>(function reduceDistanceSegments(o, item) {
			o[item.id] = item;
			return o;
		}, {});

	const visionPoints = Object.values(segments)
		.map(function mapVisionPoints(segment) {
			const segmentFromPlayer: Segment = [
				position,
				segment.point]

			const intersections = Object.values(segments)
				.map(function mapIntersections({ segment }) {
					return lineSegmentInterception(segmentFromPlayer, segment);
				})
				.filter(function filterIntersections(intersection) {
					return intersection != false;
				})
				.map(function computeIntersections(intersection) {
					const point = (intersection as Point)
					const dx = point[0] - position[0];
					const dz = point[1] - position[1];
					const squareDistance = dx * dx + dz * dz;
					const angle = Math.atan2(dz, dx);
					return {
						angle,
						squareDistance,
						point,
					};
				})
				.sort(function sortIntersections(a, b) {
					return a.squareDistance - b.squareDistance;
				});

			return intersections[0];
		})
		.filter(function filterVisionPoints(pt) {
			return pt != null;
		});
	return visionPoints;
}


export function caluculateLOS(
	position: XYPoint,
	visionDistance: number = 100,
	nbBoundingSegments: number = 50
): XYPoint[] {
	const extentAroundPlayer: ExtentLikeObject = [
		position.x - visionDistance,
		position.y - visionDistance,
		position.x + visionDistance,
		position.y + visionDistance
	]
	const buildings = getBuildingInExtent(extentAroundPlayer)
	return computeVisionPolygon([position.x, position.y], buildings, visionDistance, nbBoundingSegments)
		.map(visionPoint => ({ x: visionPoint.point[0], y: visionPoint.point[1] }));
}

interface LOSSegment {
	buildingIndex: number;
	startPointIndex: number;
	endPointIndex: number;
	angle: number;
	squareDistance: number;
}

export function isPointInPolygon(point: XYPoint, polygon: XYPoint[]) {
  // code from Randolph Franklin (found at http://local.wasp.uwa.edu.au/~pbourke/geometry/insidepoly/)
  const { x, y } = point;
  let c = false;

  polygon.forEach((p, i, arr) => {
    const p1 = p;
    const p2 = arr[(i + 1) % arr.length];

    if (
      ((p1.y <= y && y < p2.y) || (p2.y <= y && y < p1.y)) &&
      x < ((p2.x - p1.x) * (y - p1.y)) / (p2.y - p1.y) + p1.x
    ) {
      c = !c;
    }
  });

  return c;
}
