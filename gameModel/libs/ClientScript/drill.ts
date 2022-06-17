import { initEmitterIds } from "./baseEvent";
import { getSendEventServerScript } from "./EventManager";
import { pickRandom } from "./helper";
import { reviveScriptedEvent } from "./scenario";
import { getCurrentPatientBody, getInstantiatedHumanIds, TeleportEvent } from "./the_world";
import { getCurrentSimulationTime } from "./TimeManager";
import { getBodyParam, getPatientIds } from "./WegasHelper";


export function isCurrentPatientCategorized() {
	const current = getCurrentPatientBody();
	return current?.category != null;
}

export function selectNextPatient() {

	const allIds = getPatientIds();
	const processed = getInstantiatedHumanIds();

	const ids = allIds.filter(id => !processed.includes(id));

	const patientId = pickRandom(ids);

	if (patientId) {
		const param = getBodyParam(patientId);
		if (param != null) {
			const emitter = initEmitterIds();

			const delay = 60;
			const currentTime = getCurrentSimulationTime();

			const script = param.scriptedPathologies || [];
			const times = script.reduce<{ min: number, max: number }>((times, current) => {
				return {
					min: Math.min(times.min, current.time),
					max: Math.max(times.max, current.time),
				};
			}, { min: Infinity, max: currentTime + delay });

			const toPost: string[] = [];


			const teleport: TeleportEvent = {
				...emitter,
				type: 'Teleport',
				targetType: 'Human',
				targetId: patientId,
				location: {
					mapId: "the_map",
					x: 0,
					y: 0,
				},
			};


			toPost.push(getSendEventServerScript(teleport, currentTime + times.min));

			toPost.push(...script.map(sEvent => {
				const rEvent = reviveScriptedEvent(emitter, patientId, sEvent);
				return getSendEventServerScript(rEvent, currentTime + sEvent.time - times.min);
			}));


			toPost.push(`Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');`);

			toPost.push(`TimeManager.fastForward('${times.max - currentTime}s');`);

			wlog("EVENTS: ", toPost.join("\n"));
			APIMethods.runScript(toPost.join(""), {});
		}
	}
}