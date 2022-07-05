import { sendEvents } from "./EventManager";
import { EventPayload, PathologyEvent, ScriptedPathologyPayload, TeleportEvent } from "./the_world";
import { getPatientsBodyFactoryParamsArray } from "./WegasHelper";

export function reviveScriptedEvent(emitter: {
	emitterCharacterId: string,
	emitterPlayerId: string
}, targetId: string, scripted: ScriptedPathologyPayload): EventPayload {

	const pe: PathologyEvent = {
		...emitter,
		...scripted.payload,
		targetId: targetId,
	};
	return pe;
}


export function premiereVague() {

	const patients = getPatientsBodyFactoryParamsArray();

	const emitter = {
		emitterCharacterId: "",
		emitterPlayerId: String(self.getId()),
	};
	let x = 10;
	let y = 10;

	const events = patients.flatMap(({ id, meta }, i) => {
		if (i % 10 === 0) {
			y += 40;
			x = 10;
		}
		x += 40;
		const teleport: TeleportEvent = {
			type: 'Teleport',
			...emitter,
			targetType: 'Human',
			targetId: id,
			location: {
				mapId: "the_map",
				x: x,
				y: y,
			},
		};
		if (meta.scriptedPathologies) {
			return [teleport, ...meta.scriptedPathologies.map(ap => {
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

