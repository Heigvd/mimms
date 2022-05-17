import { getDirectMessagesFrom } from "./communication";
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
	const myLocation = me?.location;

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

	if (myLocation != null) {
		const x = myLocation.x;
		const y = myLocation.y;
		
		layer.features[0].coordinates.push([]);
		const hole = layer.features[0].coordinates[1];

		const nbPoint = 28;
		for (let i=0, angle=0;i<nbPoint;i++,angle -= 2*Math.PI / nbPoint){
			const holeX = x + Math.sin(angle) * lineOfSightRadius;
			const holeY = y + Math.cos(angle) * lineOfSightRadius;
			hole.push([holeX, holeY]);
		}
		hole.push([hole[0][0], hole[0][1]]);
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