import { generateGridMatrix, WorldGrid } from "./Astar";
import { getBuildingInExtent } from "./geoData";
import { Point } from "./helper";

export const buildingLayer = Helpers.useRef<any>("buildingLayer", null);
export const mapRef = Helpers.useRef<any>("mapRef", null);
export const obstacleGrid = Helpers.useRef<WorldGrid>("obstacleGridSource", {
	grid: [[]],
	cellSize: 1,
	gridWidth: 1,
	gridHeight: 1,
	offsetPoint: { x: 0, y: 0 }
});

const CELL_SIZE_METTER = 2;

export function onBuildingLayerReady(layer: any, map: any) {
	buildingLayer.current = layer;
	mapRef.current = map;

	const extent: ExtentLikeObject = layer.getSource().getExtent();
	const meterPerUnit = map.getView().getProjection().getMetersPerUnit();
	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);
	const worldWidth = extentWidth * meterPerUnit;
	const worldHeight = extentHeight * meterPerUnit;
	const cellSize = CELL_SIZE_METTER;
	const offsetPoint: Point = { x: extent[0] * meterPerUnit, y: extent[1] * meterPerUnit }

	obstacleGrid.current = generateGridMatrix(worldHeight, worldWidth, cellSize, offsetPoint, getBuildingInExtent);
}