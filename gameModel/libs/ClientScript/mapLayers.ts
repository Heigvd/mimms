import { buildingLayer, mapRef } from "./layersData";
import { getDirectMessagesFrom } from "./communication";
import { computeVisionPolygon, getBuildingInExtent } from "./geoData";
import { getHumans, lineOfSightRadius } from "./the_world";
import { whoAmI } from "./WegasHelper";
import { Point } from "./helper";

interface PointFeature {
	type: "Point";
	coordinates: PointLikeObject;
}

interface PolygonFeature {
	type: "Polygon";
	coordinates: PointLikeObject[][];
}

interface MultiPolygonFeature {
	type: "MultiPolygon";
	coordinates: PointLikeObject[][][];
}


type Geometry = PointFeature | PolygonFeature | MultiPolygonFeature;

interface AdvancedFeature {
	type: 'Feature';
	properties?: { [key: string]: unknown };
	geometry: Geometry
}

type Feature = Geometry | AdvancedFeature;


interface CRS {
	type: string;
	properties: {
		name: string;
	}
}

export interface FeatureCollection {
	type: "FeatureCollection";
	name: string;
	crs?: CRS;
	features: Feature[];
}

export const emptyFeatureCollection: FeatureCollection = {
	type: "FeatureCollection",
	name: "empty collection",
	features: []
}

const left = 2485071.58;
const bottom = 1075346.31;
const right = 2828515.82;
const top = 1299941.79

export function getFogOfWarLayer(): FeatureCollection {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);

	const layer: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "fogOfWar",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::2056" } },
		"features": [
			{
				"type": "Polygon",
				"coordinates": [
					[
						[left, top],
						[left, bottom],
						[right, bottom],
						[right, top],
						[left, top]
					],
				]
			}
		]
	};

	const hole: PointLikeObject[] = [];
	(layer.features[0] as PolygonFeature).coordinates.push(hole)


	const visionPoints = me?.lineOfSight || [];

	visionPoints.forEach(point => {
		hole.push([point.x, point.y])
	})

	if (visionPoints[0] != null) {
		hole.push(hole[0])
	}

	return layer;

}


export function getBubbleLayer(): FeatureCollection {
	const humans = getHumans();

	const bubbleCollection: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "bubbles",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::2056" } },
		"features":
			humans.flatMap(human => {
				const msgs = getDirectMessagesFrom(human.id);
				if (human.location && msgs.length > 0) {
					return {
						type: 'Feature',
						properties: {
							humanId: human.id,
							text: msgs.join(" | "),
						},
						geometry: {
							type: 'Point',
							coordinates: [human.location.x, human.location.y]
						}
					}
				} else {
					return [];
				}
			})

	};
	return bubbleCollection
}

export function getHumanLayer(): FeatureCollection {
	const humans = getHumans();

	return {
		"type": "FeatureCollection",
		"name": "humans",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::2056" } },
		"features":
			humans.flatMap(human => {
				if (human.location) {
					return {
						type: 'Feature',
						properties: {
							humanId: human.id,
						},
						geometry: {
							type: 'Point',
							coordinates: [human.location.x, human.location.y]
						}
					}
				} else {
					return [];
				}
			})
	};
}

export function getDebugBuildingLayer(): FeatureCollection {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);
	const myLocation = me?.location;

	const layer: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "debugBuildings",
		"features": []
	};

	if (myLocation != null) {
		const x = myLocation.x;
		const y = myLocation.y;

		const extentAroundPlayer: ExtentLikeObject = [
			x - lineOfSightRadius,
			y - lineOfSightRadius,
			x + lineOfSightRadius,
			y + lineOfSightRadius
		]
		const buildings = getBuildingInExtent(extentAroundPlayer)
		buildings.forEach(building => layer.features.push({
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [building.map(point => ([point.x, point.y]))]
			}
		} as never))

	}
	return layer;

}

export function getEmptyLayer(): FeatureCollection {
	return {
		"type": "FeatureCollection",
		"name": "empty",
		"features": []
	};
}

export function getObstacleGridLayer(debug?: boolean): FeatureCollection {

	const map = mapRef.current;
	const layer = buildingLayer.current;

	const source: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "empty",
		"features": []
	};

	debugger;


	const extent: ExtentLikeObject = layer.getSource().getExtent();
	const meterPerUnit = map.getView().getProjection().getMetersPerUnit();
	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);
	const worldWidth = extentWidth * meterPerUnit;
	const worldHeight = extentHeight * meterPerUnit;
	const cellSize = 2 / meterPerUnit;
	const offsetPoint: Point = { x: extent[0], y: extent[1] }

	let grid: number[][] = [];
	const gridHeight = Math.round(worldHeight / cellSize);
	const gridWidth = Math.round(worldWidth / cellSize);
	const totalCells = gridHeight * gridWidth;
	const slices = Math.round(totalCells / 100);

	const ratioOfmap = 0.4; // max = 1

	for (let j = 0; j < gridHeight * ratioOfmap; j += 1) {
		grid[j] = [];
		for (let i = 0; i < gridWidth * ratioOfmap; i += 1) {

			const cellIndex = i + j * gridWidth;
			if (debug && cellIndex % slices === 0) {
				wlog(Math.round(cellIndex * 100 / totalCells) + "%");
			}

			const minX = i + offsetPoint.x;
			const minY = j + offsetPoint.y;
			const maxX = i + offsetPoint.x + cellSize;
			const maxY = j + offsetPoint.y + cellSize;

			const test = getBuildingInExtent([minX, minY, maxX, maxY])
			if (test.length > 0) {
				source.features.push({
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[minX, minY],
								[minX, maxY],
								[maxX, maxY],
								[maxX, minY],
								[minX, minY],
							]
						]
					}
				} as never)
			}
		}
	}
	return source;
}

