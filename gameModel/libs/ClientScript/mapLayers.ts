import { mapRef, obstacleGrid } from "./layersData";
import { getDirectMessagesFrom } from "./communication";
import { getBuildingInExtent } from "./lineOfSight";
import { getHumans, lineOfSightRadius, paths } from "./the_world";
import { whoAmI } from "./WegasHelper";
import { PathFinder } from "./pathFinding";
import { getBodyPictoOffset } from "./graphics";

interface PointFeature {
	type: "Point";
	coordinates: PointLikeObject;
}

interface LineStringFeature {
	type: "LineString";
	coordinates: PointLikeObject[];
}

interface PolygonFeature {
	type: "Polygon";
	coordinates: PointLikeObject[][];
}

interface MultiPolygonFeature {
	type: "MultiPolygon";
	coordinates: PointLikeObject[][][];
}


type Geometry = PointFeature | LineStringFeature | PolygonFeature | MultiPolygonFeature;

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

export function getFogOfWarLayer(): FeatureCollection {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);

	const initialMap = mapRef.current;
	if (initialMap) {


		const extent = initialMap.getView().calculateExtent(initialMap.getSize());
		//wlog("extent: ", extent);
		const width = extent[2] - extent[0];
		const height = extent[3] - extent[1];

		const left = extent[0] - width;
		const top = extent[1] - height;
		const right = extent[2] + width;
		const bottom = extent[3] + height;

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
			hole.push(hole[0]!)
		}

		return layer;
	} else {
		return emptyFeatureCollection;
	}
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

export function getHumanOverlays(): OverlayItem[] {
	const humans = getHumans();

	return humans
		.flatMap(human => {
			if (human.location) {
				return [human]
			} else {
				return [];
			}
		})
		.sort((h1, h2) => {
			return h1.location!.y - h2.location!.y
		}).map((human) => {
			return {
				payload: {
					id: human.id,
				},
				overlayProps: {
					overlayId: human.id,
					className: 'human-overlay',
					position: [human.location!.x, human.location!.y],
					stopEvent: false,
					positioning: 'bottom-left',
					offset: [0, 0],
				}
			} as OverlayItem;
		});
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
	return emptyFeatureCollection;
}

export function getObstacleGridLayer(density: number = 0.5, debug?: boolean): FeatureCollection {
	if (obstacleGrid?.current == null) {
		return emptyFeatureCollection;
	}

	const {
		grid,
		gridWidth,
		gridHeight,
		cellSize,
		offsetPoint
	} = obstacleGrid.current;

	const source: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "obstacle layer",
		"features": []
	};

	function addSquareFeature(collection: FeatureCollection, minX: number, minY: number, maxX: number, maxY: number,) {
		collection.features.push({
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
	const totalCells = gridHeight * gridWidth;

	// Debug ///////////////////////////////////////
	const slices = Math.round(totalCells / 100);
	const step = 1 + Math.round((1 - Math.max(0.1, Math.min(density, 1))) * 10);
	////////////////////////////////////////////////

	for (let j = 0; j < gridHeight; j += step) {
		for (let i = 0; i < gridWidth; i += step) {

			const cellIndex = i + j * gridWidth;
			if (debug && cellIndex % slices === 0) {
				wlog(Math.round(cellIndex * 100 / totalCells) + "%");
			}

			if (grid[j]![i]) {
				const minPoint = PathFinder.gridPointToWorldPoint({ x: i, y: j }, cellSize, offsetPoint)
				const maxPoint = PathFinder.gridPointToWorldPoint({ x: i + 1, y: j + 1 }, cellSize, offsetPoint);

				/*
				// Testing
				const minCellPoint = worldPointToGridPoint(minPoint, cellSize, offsetPoint);
				const maxCellPoint = worldPointToGridPoint(maxPoint, cellSize, offsetPoint);

				const minWorldPoint = gridPointToWorldPoint(minCellPoint, cellSize, offsetPoint);
				const maxWorldPoint = gridPointToWorldPoint(maxCellPoint, cellSize, offsetPoint);

				addSquareFeature(source, minWorldPoint.x, minWorldPoint.y, maxWorldPoint.x, maxWorldPoint.y);
				*/

				addSquareFeature(source, minPoint.x, minPoint.y, maxPoint.x, maxPoint.y);
			}
		}
	}
	return source;
}

export function getPathLayer() {

	const source: FeatureCollection = {
		"type": "FeatureCollection",
		"name": "path layer",
		"features": []
	};

	Object.entries(paths.current).forEach(([k, v], i) => {
		const newFeature: AdvancedFeature = {
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: v.map(point => ([point.x, point.y]))
			},
			properties: {
				color: i === 0 ? "hotpink" : i === 1 ? "#888" : "red"
			}
		}
		source.features.push(newFeature);
	});

	return source;
}