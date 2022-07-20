import { sendEvents } from "./EventManager";
import { mapRef } from "./layersData";
import { EventPayload, ScriptedEvent, TeleportEvent } from "./the_world";
import { getPatientsBodyFactoryParamsArray } from "./WegasHelper";

export function reviveScriptedEvent(emitter: {
	emitterCharacterId: string,
	emitterPlayerId: string
}, targetId: string, scripted: ScriptedEvent): EventPayload {

    const pe: EventPayload = {
		...emitter,
		...scripted.payload,
		targetId: targetId,
	};
	return pe;
}

function getFirstCoordinate() : [number, number] {
 	return mapRef.current.getView().getCenter();
}

export function premiereVague() {

	const patients = getPatientsBodyFactoryParamsArray();

	const emitter = {
		emitterCharacterId: "",
		emitterPlayerId: String(self.getId()),
	};

	const [cx,cy] = getFirstCoordinate();


	const events = patients.flatMap(({ id, meta }, i) => {
		const alpha = 3.1415092 / 3.5 * i;
		const r = 2*i;
		const y = cy + Math.sin(alpha) * r;
		const x = cx + Math.cos(alpha) * r;

		const teleport: TeleportEvent = {
			type: 'Teleport',
			...emitter,
			targetType: 'Human',
			targetId: id,
			location: {
				mapId: "the_world",
				x: x,
				y: y,
			},
		};
		if (meta.scriptedEvents) {
			return [teleport, ...meta.scriptedEvents.map(ap => {
				return reviveScriptedEvent(emitter, id, ap);
			})];
		} else {
			return [teleport];
		}
	});

	sendEvents(events);
}

export function deuxiemeVague() {
}

