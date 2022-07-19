import { Point } from "./point2D";

export const buildingLayer = Helpers.useRef<any>("buildingLayer", null);
export const mapRef = Helpers.useRef<any>("mapRef", null);
export const obstacleGrid = Helpers.useRef<WorldGrid>("obstacleGridSource", {
	grid: [[]],
	cellSize: 1,
	gridWidth: 1,
	gridHeight: 1,
	offsetPoint: { x: 0, y: 0 },
	init: false,
});

const CELL_SIZE_METTER = 1;


export interface WorldGrid {
	init: boolean;
	grid: number[][];
	gridWidth: number;
	gridHeight: number;
	cellSize: number;
	offsetPoint: Point;
}

/**
 * Generates a 2d grid with numbers. Astar check if the number is lower than the obstacle density to allow moving on it.
 * @param obstacles An array of polygon
 * @param worldHeight the height of the world
 * @param worldWidth the width of the world
 * @param cellSize the width = height of one cell
 * @param getObstaclesInExtent a function that will return all the obstacles in an extent
 */
/*export function generateGridMatrix(worldHeight: number, worldWidth: number, cellSize: number, offsetPoint: Point, getObstaclesInExtent: (extent: ExtentLikeObject) => Polygons): WorldGrid {
	let grid: number[][] = [];
	const gridHeight = Math.round(worldHeight / cellSize);
	const gridWidth = Math.round(worldWidth / cellSize);

	for (let j = 0; j < gridHeight; j += 1) {
		grid[j] = [];
		for (let i = 0; i < gridWidth; i += 1) {

			const minX = i * cellSize + offsetPoint.x;
			const minY = j * cellSize + offsetPoint.y;
			const maxX = (i + 1) * cellSize + offsetPoint.x;
			const maxY = (j + 1) * cellSize + offsetPoint.y;
			const obstacles = getObstaclesInExtent([minX, minY, maxX, maxY]);

			if (obstacles.length > 0) {

				const pointA: Point = { x: minX, y: minY };
				const pointB: Point = { x: minX, y: maxY };
				const pointC: Point = { x: maxX, y: maxY };
				const pointD: Point = { x: maxX, y: minY };

				const wall1: Segment = [pointA, pointB];
				const wall2: Segment = [pointB, pointC];
				const wall3: Segment = [pointC, pointD];
				const wall4: Segment = [pointD, pointA];

				const node: Polygon = [pointA, pointB, pointC, pointD];

				for (const buildingIndex in obstacles) {
					const obstacle = obstacles[buildingIndex];
					// Is the cell inside an obstacle?
					if (
						isPointInPolygon(pointA, obstacle) ||
						isPointInPolygon(pointB, obstacle) ||
						isPointInPolygon(pointC, obstacle) ||
						isPointInPolygon(pointD, obstacle)
					) {
						grid[j][i] = 1;
						// Stop building matching
						break;
					}

					for (let pointIndex = 0; pointIndex < obstacle.length; ++pointIndex) {
						const firstPoint = obstacle[pointIndex];
						const secondPoint = obstacle[(pointIndex + 1) % obstacle.length]
						const obstacleWall: Segment = [firstPoint, secondPoint];
						// If a point of obstacle inside the cell?
						// If no, does the obstacle and the cell overlap? (ex: 6 edged star made with 2 inverted triangles)
						if (
							isPointInPolygon(firstPoint, node) ||
							lineSegmentInterception(wall1, obstacleWall) ||
							lineSegmentInterception(wall2, obstacleWall) ||
							lineSegmentInterception(wall3, obstacleWall) ||
							lineSegmentInterception(wall4, obstacleWall)) {
							grid[j][i] = 1;
							// Stop building point matching
							break;
						}
					}
					if (grid[j][i] === 1) {
						// Stop building matching
						break;
					}
				}
			}
		}
	}


	return {
		grid,
		gridWidth,
		gridHeight,
		cellSize,
		offsetPoint
	};
}*/

/**
 * Generates a 2d grid with numbers. Astar check if the number is lower than the obstacle density to allow moving on it.
 * @param obstacles An array of polygon
 * @param worldHeight the height of the world
 * @param worldWidth the width of the world
 * @param cellSize the width = height of one cell
 * @param getObstaclesInExtent a function that will return all the obstacles in an extent
 */
export function generateGridMatrix(worldHeight: number, worldWidth: number, cellSize: number, offsetPoint: Point): WorldGrid {
	const grid: number[][] = [];

	let gridHeight = Math.round(worldHeight / cellSize);
	let gridWidth = Math.round(worldWidth / cellSize);

	if (gridHeight === Infinity){
		wlog("Inifinite World !!!");
		gridHeight = 0;
	}

	if (gridWidth === Infinity){
		wlog("Inifinite World !!!");
		gridWidth = 0;
	}

	const layer = buildingLayer.current;
	const source = layer.getSource();

	console.time("genGridMatrix");
	for (let j = 0; j < gridHeight; j += 1) {
		grid[j] = [];
		for (let i = 0; i < gridWidth; i += 1) {

			const minX = i * cellSize + offsetPoint.x;
			const minY = j * cellSize + offsetPoint.y;
			const maxX = (i + 1) * cellSize + offsetPoint.x;
			const maxY = (j + 1) * cellSize + offsetPoint.y;

			const cellExtent = [minX, minY, maxX, maxY];

			source.forEachFeatureIntersectingExtent(cellExtent, () => {
				(grid[j])![i] = 1;
				return true;
			});
		}
	}

	console.timeEnd("genGridMatrix");

	return {
		init: true,
		grid,
		gridWidth,
		gridHeight,
		cellSize,
		offsetPoint,
	};
}

export function onBuildingLayerReady(layer: any, map: any) {
	buildingLayer.current = layer;
	mapRef.current = map;

	const delta = 10;

	const extent: ExtentLikeObject = layer.getSource().getExtent();
	const meterPerUnit = map.getView().getProjection().getMetersPerUnit();
	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);
	const worldWidth = extentWidth * meterPerUnit + 2*delta;
	const worldHeight = extentHeight * meterPerUnit + 2*delta;
	const cellSize = CELL_SIZE_METTER;
	const offsetPoint: Point = { x: extent[0] * meterPerUnit - delta, y: extent[1] * meterPerUnit -delta}

	if (obstacleGrid.current.init == false){
		obstacleGrid.current = generateGridMatrix(worldHeight, worldWidth, cellSize, offsetPoint);
	}
}
