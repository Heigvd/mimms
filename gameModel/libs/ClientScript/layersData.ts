// Basic geometry types

import { layerDataLogger } from "./logger";
import { Point } from "./point2D";

export type Shape = Point[];
export type Polygon = Point[]
export type Polygons = Polygon[]

export const buildingLayer = Helpers.useRef<any>("buildingLayer", null);
export const mapRef = Helpers.useRef<any>("mapRef", null);
export const obstacleGrid = Helpers.useRef<WorldGrid>("obstacleGridSource", {
	init: false,
	grid: [[]],
	cellSize: 1,
	gridWidth: 1,
	gridHeight: 1,
	offsetPoint: { x: 0, y: 0 }
});

export const obstacleLayers = Helpers.useRef('obstacleRefs', {} as Record<string, ObstacleLayer>);
export const obstacleExtents = Helpers.useRef('recursiveExtents', {} as Record<ObstacleType, DiscreteExtent[]>); 
export const mapResolution = Helpers.useRef<any>("mapResolution", 1);

const CELL_SIZE_METER = 1;

export const swissDefaultProjection = 'EPSG:2056';
const gpsProjection = 'EPSG:4326';

interface ExtentState {
	extent : ExtentLikeObject | undefined,
	loadState : 'LOADED' | 'LOADING' | 'NOT LOADED'
}

export function getInitialExtentState(): ExtentState {
	//wlog('getting initial state')
	return {
		extent : undefined,
		loadState : 'NOT LOADED'
	}
}

type ExtentStateSetter = ((s : ExtentState) => void)

export function tryLoadExtentAsync(mapId : string, extentState : ExtentState, setState : ExtentStateSetter ): ExtentState {
	
	switch(extentState.loadState){
		case 'NOT LOADED':
			extentState.loadState = "LOADING"
			const req = Helpers.downloadFile(`maps/${mapId}/bbox.data`, 'TEXT');

			req.then((t) => {
				const ext = parseExtent(t);
				// convert extent to map
				const convExt = OpenLayer.transformExtent(ext, gpsProjection, swissDefaultProjection);
				extentState.extent = convExt;
				extentState.loadState = "LOADED";
				setState(extentState);
			}).catch((r) => {
				extentState.loadState = 'NOT LOADED';
				layerDataLogger.error('Error when loading extent', r);
			})
			break;
		case 'LOADING':
		case 'LOADED':
	}

	return extentState;
}

export function parseExtent(extentString: string) : ExtentLikeObject{

	const ext = extentString.split(',').map((v)=> parseFloat(v));
	return [ext[1], ext[0], ext[3], ext[2]] as ExtentLikeObject;
}

export function getMapResolution() : number {
	return mapResolution.current;
}
export function convertMeterToMapUnit(length: number){
	return length / mapResolution.current;
}
export function convertMapUnitToMeter(length: number){
	return mapResolution.current * length;
}

export interface WorldGrid {
	init: boolean;
	grid: number[][];
	gridWidth: number;
	gridHeight: number;
	cellSize: number;
	offsetPoint: Point;
}

export type ObstacleAlgo = 'None' | 'Recursive';
export enum ObstacleType {
	None = 0,
	Road = 1,
	NonWalkable = 10, // used by pathfinding algo
	Water = 20,
	Train = 30,
	Building = 100
}

/**
 * Empirically found values that yield the fastest performances
 * depending on expected geometries
 */
const obstacleSplitValues : Record<ObstacleType, number> = {
	"0" : 0,
	"1": 64,
	"10": 0,
	"100": 32,
	"20": 8,
	"30": 64 // TODO test trains
}

type ObstacleLayer = {
	layer: any,
	map: any,
	obstacleValue: ObstacleType,
	canOverride: boolean,
	cutGeometry: number,
	algo: ObstacleAlgo,
	processed: boolean
}

export class DiscreteExtent {

	minX: number;
	minY: number;
	maxX: number;
	maxY: number;

	constructor(minX : number, minY: number, maxX: number, maxY: number) {
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
		
		if(maxX - minX < 1 || maxY - minY < 1)
			throw new Error('Malformed extent : ' + this.toString());
	}

	public split(n: number): DiscreteExtent[] {
		
		const deltaX = this.maxX - this.minX;
		const deltaY = this.maxY - this.minY;

		if(deltaX < 2 && deltaY < 2)
			throw new Error('Cannot split extent');

		const ext : DiscreteExtent[] = [];

		const stepX = Math.max(deltaX / n, 1);
		const stepY = Math.max(deltaY / n, 1);

		for(let x = this.minX; x < this.maxX; x += stepX){

			const xUpper = Math.min(Math.floor(x + stepX), this.maxX);
			for(let y = this.minY; y < this.maxY; y += stepY){
				const yUpper = Math.min(Math.floor(y + stepY), this.maxY);
				if(xUpper <= this.maxX && yUpper <= this.maxY){
					ext.push(new DiscreteExtent(Math.floor(x), Math.floor(y), xUpper, yUpper));
				}
			}
		}

		return ext;
	}

	public toString(): string {
		return `x (${this.minX} -> ${this.maxX}) y(${this.minY} -> ${this.maxY})`;
	}

	public toExtentWorld(pixelToMeter: number, offset: Point, expand: number = 0): [number, number, number, number]{

		return [
			this.minX * pixelToMeter + offset.x - expand,
			this.minY * pixelToMeter + offset.y - expand,
			this.maxX * pixelToMeter + offset.x + expand,
			this.maxY * pixelToMeter + offset.y + expand
		]
	}
	
	public areaIsOne(): boolean {
		return (this.maxX - this.minX) === 1 && (this.maxY - this.minY) === 1;
	}

	public fillWithValue(grid: number[][], value: ObstacleType, canOverride: boolean): void{
		
		for(let y = this.minY; y < this.maxY; y++){
			if(!grid[y]){
				grid[y] = [];
			}
			for(let x = this.minX; x < this.maxX; x++){
				if(!grid[y][x] || canOverride){
					grid[y][x] = value;	
				}
			}
		}
	}

	public contourWorld(pixelToMeter: number, offset: Point): number[][]{

		const xmin = this.minX * pixelToMeter + offset.x;
		const xmax = this.maxX * pixelToMeter + offset.x;
		const ymin = this.minY * pixelToMeter + offset.y;
		const ymax = this.maxY * pixelToMeter + offset.y;

		return [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]];
	}

}


/**
 * Register a layer for obstacle grid computation
 * @see buildObstacleMatrix
 */
export function registerObstacleLayer(layer: any, map: any, obstacleValue: ObstacleType, canOverride: boolean, algo : ObstacleAlgo, cutGeometry?: number) {

	mapRef.current = map; // TODO better (if more than one map, havoc)
	layerDataLogger.info('Registering obstacle layer', algo, ObstacleType[obstacleValue]);
	if(cutGeometry == undefined){
		cutGeometry = obstacleSplitValues[obstacleValue];
		layerDataLogger.info(cutGeometry, ObstacleType[obstacleValue]);
	}
	const ol : ObstacleLayer = {layer, map, obstacleValue, canOverride, algo, cutGeometry, processed: false};
	const uid = buildObstacleLayerUid(ol);
	obstacleLayers.current[uid] = ol;
}

function buildObstacleLayerUid(ol : ObstacleLayer): string{

	return [
		ol.layer.get('layerId'), 
		ObstacleType[ol.obstacleValue], 
		ol.algo, 
		ol.canOverride,
		ol.cutGeometry
	].join('-');
}

/**
 * Updates the obstacle grid with a layer. Creates the grid if uninitialized.
 */
export function updateObstacleMatrixWithLayer(layer: any, map: any, obstacleValue: ObstacleType, canOverride: boolean, algo : ObstacleAlgo, cutGeometry?: number, logTime: boolean = false){

	mapRef.current = map; // TODO better (if more than one map, havoc)

	if(algo === 'None'){
		return;
	}

	if(cutGeometry == undefined){
		cutGeometry = obstacleSplitValues[obstacleValue];
		layerDataLogger.info(cutGeometry, ObstacleType[obstacleValue]);
	}

	const ol : ObstacleLayer = {layer, map, obstacleValue, canOverride, algo, cutGeometry, processed : false};
	const uid = buildObstacleLayerUid(ol);
	if(obstacleLayers.current[uid]?.processed){
		layerDataLogger.info('Already processed, ignoring', uid);
		return;
	}

	obstacleLayers.current[uid] = ol;
	layerDataLogger.info('Processing ', uid);


	if(!obstacleGrid.current.init){

		const extent = mapRef.current.getView().get('extent');
		const meterPerUnit = mapRef.current.getView().getProjection().getMetersPerUnit();
		const extentWidth = Math.abs(extent[2] - extent[0]);
		const extentHeight = Math.abs(extent[3] - extent[1]);
		const worldWidth = extentWidth * meterPerUnit;
		const worldHeight = extentHeight * meterPerUnit;
		const cellSize = CELL_SIZE_METER;
		const offsetPoint: Point = { x: extent[0] * meterPerUnit, y: extent[1] * meterPerUnit};

		const grid: number[][] = [];
		let gridHeight = Math.round(worldHeight / cellSize);
		let gridWidth = Math.round(worldWidth / cellSize);

		obstacleGrid.current = {
			init: true,
			grid,
			gridWidth,
			gridHeight,
			cellSize,
			offsetPoint,
		}
	}

	const gridHeight = obstacleGrid.current.gridHeight;
	const gridWidth = obstacleGrid.current.gridWidth;
	const cellSize = obstacleGrid.current.cellSize;
	const offsetPoint = obstacleGrid.current.offsetPoint;

	if(logTime){
		const keys = Object.values(ObstacleType).filter((v) => !isNaN(Number(v))) as ObstacleType[];
		keys.forEach((k : ObstacleType) => obstacleExtents.current[k]= [])
		layerDataLogger.info('grid size', gridWidth, gridHeight);
	}

	const mapExtent = new DiscreteExtent(0,0,gridWidth, gridHeight);

	if(logTime){
		layerDataLogger.info('******* Processing', ObstacleType[ol.obstacleValue]);
	}

	if(logTime){
		console.time('full processing one layer');
	}
	// Cut huge geometries to extent (typically rivers and lakes)
	const cutLayers = layerCut(ol, mapExtent, cellSize, offsetPoint, logTime);

	if(logTime){
		console.time("genGridMatrix");
	}

	obstacleExtents.current[ol.obstacleValue] = [];

	switch(ol.algo){
		case 'Recursive':
			recursiveMatrixFill(obstacleGrid.current.grid, cutLayers, ol, offsetPoint, cellSize, logTime);
			break;
		default: // do nothing
	}

	ol.processed = true;

	if(logTime){
		console.timeEnd("genGridMatrix");
		console.timeEnd('full processing one layer');
	}

}

/**
 * Build obstacle matrix from all the registered layers
 * @see registerObstacleLayer
 */
export function buildObstacleMatrix(logTime: boolean = false){

	if(logTime){
		console.time('FULL PROCESSING');
	}

	const extent = mapRef.current.getView().get('extent');
	const meterPerUnit = mapRef.current.getView().getProjection().getMetersPerUnit();
	const extentWidth = Math.abs(extent[2] - extent[0]);
	const extentHeight = Math.abs(extent[3] - extent[1]);
	const worldWidth = extentWidth * meterPerUnit;
	const worldHeight = extentHeight * meterPerUnit;
	const cellSize = CELL_SIZE_METER;
	const offsetPoint: Point = { x: extent[0] * meterPerUnit, y: extent[1] * meterPerUnit};

	const grid: number[][] = [];
	let gridHeight = Math.round(worldHeight / cellSize);
	let gridWidth = Math.round(worldWidth / cellSize);

	if(logTime){
		layerDataLogger.info('grid size', gridWidth, gridHeight);
	}

	obstacleGrid.current = {
		init: true,
		grid,
		gridWidth,
		gridHeight,
		cellSize,
		offsetPoint,
	}

	if(logTime){
		const keys = Object.values(ObstacleType).filter((v) => !isNaN(Number(v))) as ObstacleType[];
		keys.forEach((k : ObstacleType) => obstacleExtents.current[k]= [])
	}

	const mapExtent = new DiscreteExtent(0,0,gridWidth, gridHeight);

	const layers = Object.values(obstacleLayers.current);
	for(let k = 0; k < layers.length; k++){

		const ol = layers[k];
		layerDataLogger.info('******* Processing', ObstacleType[ol.obstacleValue]);
		if(ol.algo === 'None' || ol.processed){
			layerDataLogger.info('Ignoring ', ol);
			continue;
		}

		if(logTime){
			console.time('full processing one layer');
		}
		// Cut huge geometries to extent (typically rivers and lakes)
		const cutLayers = layerCut(ol, mapExtent, cellSize, offsetPoint, logTime);

		if(logTime){
			console.time("genGridMatrix");
		}
		obstacleExtents.current[ol.obstacleValue] = [];

		switch(ol.algo){
			case 'Recursive':
				recursiveMatrixFill(grid, cutLayers, ol, offsetPoint, cellSize, logTime);
				break;
			default: // do nothing
		}

		ol.processed = true;

		if(logTime){
			console.timeEnd("genGridMatrix");
			console.timeEnd('full processing one layer');
		}

	}

	if(logTime){
		console.timeEnd('FULL PROCESSING')
	}

}

interface SubLayer {
	// OpenLayer vector source
	vectorSource : any,
	// extent to which it is applied
	extent : DiscreteExtent
}

/**
 * Cuts down a layer to smaller parts in order to build obstacle matrices faster
 */
function layerCut(ol : ObstacleLayer, mapExtent : DiscreteExtent, cellSize: number, offsetPoint: Point, logTime: boolean): SubLayer[] {

	if(ol.cutGeometry < 1){
		//no cut, use original layer
		return [{extent: mapExtent, vectorSource: ol.layer.getSource()}];
	}

	if(logTime){
		console.time("Cut geometries");
		layerDataLogger.info('Cut factor', ol.cutGeometry);
	}

	const newVectorSources: SubLayer[] = [];
	const extents : DiscreteExtent[] = mapExtent.split(ol.cutGeometry);
	const vecSource = ol.layer?.getSource();

	for(let ext of extents){

		const cutFeatures: any[] = [];

		// extend extent by 1 pixel to avoid border crossing
		const e = ext.toExtentWorld(cellSize, offsetPoint,1);
		vecSource.forEachFeatureIntersectingExtent(e, (f:any) => {
			const g = f.getGeometry();
			let shape : any = undefined;
			switch(g.getType()){
				case 'Polygon':
					shape = Turf.polygon(g.getCoordinates());
					break;
				case 'MultiPolygon':
					shape = Turf.multiPolygon(g.getCoordinates());
					break;
				case 'LineString':
					shape = Turf.lineString(g.getCoordinates());
					break;
				case 'MultiLineString':
					shape = Turf.multiLineString(g.getCoordinates());
					break;
			}

			if(shape){
				const cutFeat = Turf.bboxClip(shape, e);
				const newFeat = new OpenLayer.format.GeoJSON().readFeatureFromObject(cutFeat);
				cutFeatures.push(newFeat);
			}else{
					// typically a Point
					cutFeatures.push(f);
			}
		});

		// build vector source with only relevant features for extent
		const vecSrc = new OpenLayer.source.VectorSource({features : cutFeatures});
		newVectorSources.push({extent: ext, vectorSource: vecSrc})
		
	}

	if(logTime){
		console.timeEnd("Cut geometries");
	}
	return newVectorSources;
}

function recursiveMatrixFill(grid: number[][], subLayers : SubLayer[], oLayer: ObstacleLayer, offset: Point, cellSize: number, debug: boolean): void{

	subLayers.forEach(sub => {
		internalRecursiveFill(grid, sub.extent, sub.vectorSource, oLayer, offset, cellSize, debug);
	})

}

function internalRecursiveFill(grid: number[][], extent: DiscreteExtent, vecSrc: any, oLayer: ObstacleLayer, offset: Point, cellSize: number, debug: boolean): void {

	let canFillAll = false;
	let hasIntersections = false;

	// TODO could inline this call for more perf
	if(extent.areaIsOne()){
		vecSrc.forEachFeatureIntersectingExtent(extent.toExtentWorld(cellSize, offset), () => {
			// TODO could implement some thickness here for lines (=> adjacent cells)
			hasIntersections = true;
			canFillAll = true;
			return true;
		});
	}else{

		vecSrc.forEachFeatureIntersectingExtent(extent.toExtentWorld(cellSize, offset), (f: any) => {
			hasIntersections = true;
			const g = f.getGeometry();
			if(!g.getType().endsWith('Polygon')){
				// if line or point do not test for intersection
				// go to next feature
				return false;
			}
			const contour = extent.contourWorld(cellSize, offset);
			if(g.intersectsCoordinate(contour[0])){
				const contourLine = Turf.lineString(contour);

				switch(g.getType()){
					case 'Polygon':
						const poly = Turf.polygon(g.getCoordinates());
						const intersection = Turf.lineIntersect(poly, contourLine);
						if(intersection.features.length === 0){
							canFillAll = true;
						}
						break;
					case 'MultiPolygon' :
						canFillAll = g.getCoordinates().some((p: any) => {
							const poly = Turf.polygon(p);
							const intersection = Turf.lineIntersect(poly, contourLine);
							if(intersection.features.length === 0){
								return true;
							}
						});
						break;
				}
				
			}
			// stop after first intersection.
			// assumption : if extent is contained => no need to continue,
			// if not, it is unlikely that another overlapping feature will cross
			// thus we can just continue splitting
			return true;

		});

	}

	if(hasIntersections){
		if(canFillAll)
		{
			extent.fillWithValue(grid, oLayer.obstacleValue, oLayer.canOverride);
			if(debug){
				obstacleExtents.current[oLayer.obstacleValue].push(extent);
			}

		}else{
			// while would be logical to split in 2
			// splitting in 4 is more efficient empirically in all cases
			const partitions = extent.split(4);
			for(let j = 0; j < partitions.length; j++){
				internalRecursiveFill(grid, partitions[j], vecSrc, oLayer, offset, cellSize, debug);
			}
		}
	
	}else {
		extent.fillWithValue(grid, 0, false);
	}

}
