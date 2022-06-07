import { generateGridMatrix } from "./Astar";
import { getBuildingInExtent, getBuildings } from "./geoData";
import { Point } from "./helper";
import { emptyFeatureCollection, FeatureCollection, getObstacleGridLayer } from "./mapLayers";

export const buildingLayer = Helpers.useRef<any>("buildingLayer", null);
export const mapRef = Helpers.useRef<any>("mapRef", null);
export const obstacleGridSource = Helpers.useRef<FeatureCollection>("obstacleGridSource", emptyFeatureCollection);

	const CELL_SIZE_METTER = 2;

export function onBuildingLayerReady(layer: any, map: any) {
	buildingLayer.current = layer;
	mapRef.current = map;
	obstacleGridSource.current = getObstacleGridLayer();

	/*
	const extent: ExtentLikeObject = layer.getSource().getExtent();
	const meterPerUnit = map.getView().getProjection().getMetersPerUnit();
	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);
	const worldWidth = extentWidth * meterPerUnit;
	const worldHeight = extentHeight * meterPerUnit;
	const cellSize = CELL_SIZE_METTER / meterPerUnit;
	const offsetPoint : Point = {x:extent[0],y:extent[1]}	
	obstacleGrid.current = generateGridMatrix(getBuildings(),worldHeight, worldWidth, cellSize, offsetPoint);
*/
}