import { getDirectMessagesFrom } from "./communication";
import { computeVisionPolygon, getBuildingInExtent } from "./geoData";
import { getHumans, lineOfSightRadius } from "./the_world";
import { whoAmI } from "./WegasHelper";


const left = 2485071.58;
const bottom = 1075346.31;
const right = 2828515.82;
const top = 1299941.79

export function getFogOfWarLayer() {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);

	const layer = {
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
					]
				]
			}
		]
	};

	const hole: [number, number][] = []
	layer.features[0].coordinates.push(hole)


	const visionPoints = me?.lineOfSight || [];

	visionPoints.forEach(point => {
		hole.push([point.x, point.y])
	})

	if (visionPoints[0] != null) {
		hole.push(hole[0])
	}

	return layer;

}


export function getBubbleLayer() {
	const humans = getHumans();

	return {
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
}

export function getHumanLayer() {
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

export function getDebugBuildingLayer() {
	const hId = whoAmI();
	const humans = getHumans();
	const me = humans.find(h => h.id === hId);
	const myLocation = me?.location;

	const layer = {
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
				coordinates: [building]
			}
		} as never))

	}
	return layer;

}

export function getEmptyLayer() {
	return {
		"type": "FeatureCollection",
		"name": "empty",
		"features": []
	};
}