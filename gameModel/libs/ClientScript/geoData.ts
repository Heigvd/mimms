import { buildingLayer } from "./layersData";
import { Polygons, Point, Segment } from "./helper";

/// TYPES
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

export function getBuildings(): Polygons {
	const buildings: Polygons = [];
	if (buildingLayer.current != null) {
		const buildingFeatures = buildingLayer.current.getSource().getFeatures();
		const buildingPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "Polygon");
		const buildingMultiPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "MultiPolygon");

		for (const feature of buildingPolygonFeatures) {
			const coordinates = feature.getGeometry().getCoordinates()[0];
			buildings.push(coordinates.map((coord: PointLikeObject) => ({ x: coord[0], y: coord[1] })))
		}
		for (const feature of buildingMultiPolygonFeatures) {
			const coordinates = feature.getGeometry().getCoordinates().flat()[0];
			buildings.push(coordinates.map((coord: PointLikeObject) => ({ x: coord[0], y: coord[1] })))
		}
	}
	return buildings;
}

export function getBuildingInExtent(extent: ExtentLikeObject): Polygons {
	const buildings: Polygons = [];
	if (buildingLayer.current != null) {
		const buildingFeatures = buildingLayer.current.getSource().getFeaturesInExtent(extent);
		const buildingPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "Polygon");
		const buildingMultiPolygonFeatures = buildingFeatures.filter(feature => feature.getGeometry().getType() === "MultiPolygon");

		for (const feature of buildingPolygonFeatures) {
			const coordinates = feature.getGeometry().getCoordinates()[0];
			buildings.push(coordinates.map((coord: PointLikeObject) => ({ x: coord[0], y: coord[1] })))
		}
		for (const feature of buildingMultiPolygonFeatures) {
			const coordinates = feature.getGeometry().getCoordinates().flat()[0];
			buildings.push(coordinates.map((coord: PointLikeObject) => ({ x: coord[0], y: coord[1] })))
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
		x: startPosition.x + distance * Math.cos(angle),
		y: startPosition.y + distance * Math.sin(angle),
	};
}

interface VisionPoint {
	angle: number;
	squareDistance: number;
	point: Point;
}

export function lineSegmentInterception(s1: Segment, s2: Segment): Point | false {
	const p0 = s1[0], p1 = s1[1],
		p2 = s2[0], p3 = s2[1]
	const s10_x = p1.x - p0.x, s10_y = p1.y - p0.y,
		s32_x = p3.x - p2.x, s32_y = p3.y - p2.y
	const denom = s10_x * s32_y - s32_x * s10_y
	if (denom == 0) return false // collinear
	const s02_x = p0.x - p2.x,
		s02_y = p0.y - p2.y
	const s_numer = s10_x * s02_y - s10_y * s02_x
	if (s_numer < 0 == denom > 0) return false // no collision
	const t_numer = s32_x * s02_y - s32_y * s02_x
	if (t_numer < 0 == denom > 0) return false // no collision
	if (s_numer > denom == denom > 0 || t_numer > denom == denom > 0) return false // no collision
	// collision detected
	const t = t_numer / denom
	return { x: p0.x + (t * s10_x), y: p0.y + (t * s10_y) }
}

export function computeVisionPolygon(
	position: Point,
	buildings: Polygons,
	visionDistance: number = 100,
	nbBoundingSegments: number = 50
): VisionPoint[] {
	// Creating vision bounds
	const surroundingBuilding: Point[] = [];
	for (let i = 0; i < nbBoundingSegments; ++i) {
		const point = angleDistanceToXY(
			position,
			visionDistance,
			((i) / nbBoundingSegments * 2 * Math.PI)
		);
		surroundingBuilding.push(point);
	}

	const segments = [surroundingBuilding, ...buildings]
		.flatMap(function mapDistanceSegments(building, bi) {
			return building.map((p, i, arr) => {
				const lastIndex = (i - 1) % arr.length;
				const nextIndex = (i + 1) % arr.length;

				// const last = arr[lastIndex];
				const next = arr[nextIndex];

				const dx = p.x - position.x;
				const dz = p.y - position.y;
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
					const dx = point.x - position.x;
					const dz = point.y - position.y;
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


export function calculateLOS(
	position: Point,
	visionDistance: number = 100,
	nbBoundingSegments: number = 50
): Point[] {
	const extentAroundPlayer: ExtentLikeObject = [
		position.x - visionDistance,
		position.y - visionDistance,
		position.x + visionDistance,
		position.y + visionDistance
    ]

	const buildings = getBuildingInExtent(extentAroundPlayer);
	console.time("LOS");
	
	const los = computeVisionPolygon(position, buildings, visionDistance, nbBoundingSegments)
		.map(({ point }) => point);
	
	console.timeEnd("LOS");

	return los;

}

export function isPointInPolygon(point: Point, polygon: Point[]) {
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


/*
// https://stackoverflow.com/questions/66590054/quickly-merge-many-contiguous-polygons-in-javascript
export function mergePolygons(polygons: Polygons): Polygon {

	// Stage 1: O(n). Consolidate all the line segments into an array, such that you end up with an array of line segments (ie, [x0,y0,x1,y1]) representing every polygon...
	const segments = polygons.flatMap((polygon) => {
		const segmentsInPolygon: Segment[] = []
		for (let i = 0; i < polygon.length; ++i) {

			segmentsInPolygon.push([polygon[i], polygon[(i + 1) % polygon.length]])
		}
		return segmentsInPolygon;
	})

	// Stage 2: O(n log n). Sort this entire array by x0, such that the line segments are now ordered according to the x value of the beginning of the segment.
	const xSortedSegments = segments.sort((a, b) => a[0].x - b[0].x);

	// Stage 3: O(1). Beginning with the first element in the sorted array (segment 0), we can make the assumption that the segment with the leftmost x0 value has to be on the edge of the outer polygon. At this point we have segment 0's [x0,y0,x1,y1] as the starting outer edge segment.
	let lastIndex = 0;
	// Stage 4: O(log n). Now, find the corrresponding line segments that begin with the end of the previous segment. In other words, which segments connect to the current segment? This should be less than a handful, typically one or two. Searching for the matching x0 is assumed to be binary, followed by a short localized linear search for all matching [x0,y0] combinations.
	const lastSegment = xSortedSegments[lastIndex];
	const mergedPolygon: Polygon = [lastSegment[0]];

	for (let i = lastIndex + 1; i < xSortedSegments.length; ++i) {
		const newSegment = xSortedSegments[i];
		if (lastSegment[1].x === newSegment[0].x && lastSegment[1].y === newSegment[0].y) {
			mergedPolygon.push()
		}
	}

	for (let i = lastIndex + 1; i < xSortedSegments.length; ++i) {
		const newSegment = xSortedSegments[xSortedSegments.length - i];
		if (lastSegment[1].x === newSegment[0].x && lastSegment[1].y === newSegment[0].y) {
			mergedPolygon.push()
		}
	}

	return mergedPolygon;
}
*/



}
