import { getDirectMessagesFrom } from "./communication";
import { mapRefs } from "./map/layersData";
import { getBuildingInExtent } from "./map/lineOfSight";
import { getHumans, lineOfSightRadius, paths } from "./the_world";
import { whoAmI } from "./WegasHelper";

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

export function getCurrentMapId(): string | undefined {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);
	//TODO why is this called every second ?
	return me?.location?.mapId || '';
}


export function getFogOfWarLayer(mapId: string): FeatureCollection {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);
	
	const initialMap = mapRefs.current[mapId];
	if (initialMap) {

		/*
		const extent = initialMap.getView().calculateExtent();
		const width = extent[2] - extent[0];
		const height = extent[3] - extent[1];

		const left = extent[0] - width;
		const top = extent[1] - height;
		const right = extent[2] + width;
		const bottom = extent[3] + height;*/

		const left = 0;
		const top = 100000000;
		const right = 100000000;
		const bottom = 0;

		const layer: FeatureCollection = {
			"type": "FeatureCollection",
			"name": "fogOfWar",
			//"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4326" } },
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


let gridDebug: FeatureCollection = {
	"type": "FeatureCollection",
	"name": "obstacle layer",
	"features": []
};

export function setDebugGrid(fc : FeatureCollection){
	gridDebug = fc;
}
export function getGridDebug(): FeatureCollection {
	return gridDebug;
}

export function getCellStyle(feature: any): LayerStyleObject {

	const style : LayerStyleObject = {
		fill: {
			type: 'FillStyle',
			color: feature.getProperties().color,
		},
		stroke: {
			type: 'StrokeStyle',
			color: 'white',
			width:0.5
		},
		zIndex: feature.getProperties().zindex
	}
	return style;
}


export function addSquareFeature(collection: FeatureCollection, minX: number, minY: number, maxX: number, maxY: number, properties : Record<string, string>) {
	collection.features.push({
		type: 'Feature',
		properties: properties,
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
				color: "red",
			}
		}
		source.features.push(newFeature);
	});

	return source;
}