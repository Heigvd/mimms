import { Point } from "./point2D";


export const fullExtentRef = Helpers.useRef<ExtentLikeObject | null>("fullExtent", null);


export const mapResolution = Helpers.useRef<any>("mapResolution", 1);

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
export function generateGridMatrix(worldHeight: number, worldWidth: number, cellSize: number, offsetPoint: Point): WorldGrid {
	const grid: number[][] = [];

	let gridHeight = Math.round(worldHeight / cellSize);
	let gridWidth = Math.round(worldWidth / cellSize);

	if (gridHeight === Infinity) {
		wlog("Inifinite World !!!");
		gridHeight = 0;
	}

	if (gridWidth === Infinity) {
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

function extendCurrentExtent(extent: ExtentLikeObject) {
	const current = fullExtentRef.current;
	if (current == null) {
		fullExtentRef.current = extent;
	} else {
		current[0] = Math.min(current[0], extent[0]);
		current[1] = Math.min(current[1], extent[1]);
		current[2] = Math.max(current[2], extent[2]);
		current[3] = Math.max(current[3], extent[3]);
	}
}

/**
 * Meter per unit
 */
export function getMapResolution() : number {
	return mapResolution.current;
}

export function convertMeterToMapUnit(length: number){
	return length / mapResolution.current;
}

export function convertMapUnitToMeter(length: number){
	return mapResolution.current * length;
}

export function onBuildingLayerReady(layer: any, map: any) {
	buildingLayer.current = layer;
	mapRef.current = map;

	const extent: ExtentLikeObject = layer.getSource().getExtent();
	const meterPerUnit = map.getView().getProjection().getMetersPerUnit();
	mapResolution.current = meterPerUnit;

	extendCurrentExtent(extent);

	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);

	const delta = 2;
	const worldWidth = extentWidth * meterPerUnit + 2 * delta;
	const worldHeight = extentHeight * meterPerUnit + 2 * delta;
	const cellSize = CELL_SIZE_METTER;
	const offsetPoint: Point = { x: extent[0] * meterPerUnit - delta, y: extent[1] * meterPerUnit - delta }

	if (obstacleGrid.current.init == false) {
		obstacleGrid.current = generateGridMatrix(worldHeight, worldWidth, cellSize, offsetPoint);
	}
}
