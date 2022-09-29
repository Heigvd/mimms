import { initEmitterIds } from "./baseEvent";
import { getSendEventServerScript } from "./EventManager";
import { compare, pickRandom } from "../../tools/helper";
import { reviveScriptedEvent } from "./scenario";
import { getCurrentPatientBody, getInstantiatedHumanIds, TeleportEvent } from "./the_world";
import { getCurrentSimulationTime } from "./TimeManager";
import { getBodyParam, getSortedPatientIds } from "../../tools/WegasHelper";
import { getPatientPreset } from "../../edition/patientPreset";
import { drillLogger } from "../../tools/logger";


interface DrillStatus {
	status: 'not_started' | 'ongoing' | 'completed' | 'validated';
}

export function getDrillStatus(): DrillStatus['status'] {
	return Variable.find(gameModel, 'drillStatus').getProperty(self, 'status') as DrillStatus['status'];
}

function getSetDrillStatusScript(status: DrillStatus['status']) : string {
	return `Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', '${status}');`;
}

export function setDrillStatus(status: DrillStatus['status']) {
	const script = getSetDrillStatusScript(status);
	APIMethods.runScript(script, {});
}

export function isCurrentPatientCategorized() {
	const current = getCurrentPatientBody();
	return current?.category != null;
}

function getCurrentPresetSortedPatientIds(): string[]{
	const presetId = Variable.find(gameModel, 'patientSet').getValue(self);
	if(presetId){
		const preset = getPatientPreset(presetId);
		if(preset){
			return Object.keys(preset.patients).sort(compare);
		}
		drillLogger.warn('preset with id ' + presetId + ' not found');
	}
	drillLogger.warn('could not get current preset id, variable patientSet is not set');

	return [];
}

export function selectNextPatient() {
	const status = getDrillStatus();
	if (status === 'not_started' || status === 'ongoing') {
		const allIds = getCurrentPresetSortedPatientIds();//getSortedPatientIds();
		wlog(allIds);
		const processed = getInstantiatedHumanIds();

		const ids = allIds.filter(id => !processed.includes(id));

		wlog(ids);
		const patientId = pickRandom(ids);

		if (patientId) {
			const param = getBodyParam(patientId);
			if (param != null) {
				const emitter = initEmitterIds();

				const delay = 60;
				const currentTime = getCurrentSimulationTime();

				const script = param.scriptedEvents || [];
				const times = script.reduce<{ min: number, max: number }>((times, current) => {
					return {
						min: Math.min(times.min, current.time),
						max: Math.max(times.max, current.time),
					};
				}, { min: Infinity, max: currentTime + delay });

				const toPost: string[] = [getSetDrillStatusScript('ongoing')];

				const teleport: TeleportEvent = {
					...emitter,
					type: 'Teleport',
					targetType: 'Human',
					targetId: patientId,
					location: {
						mapId: "the_world",
						x: 0,
						y: 0,
					},
				};

				// the_world ignore not located humans
				toPost.push(getSendEventServerScript(teleport, currentTime));

				toPost.push(...script.map(sEvent => {
					const rEvent = reviveScriptedEvent(emitter, patientId, sEvent);
					return getSendEventServerScript(rEvent, currentTime + sEvent.time - times.min);
				}));


				toPost.push(`Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');`);

				//toPost.push(`TimeManager.fastForward('${times.max - currentTime}s');`);

				wlog("EVENTS: ", toPost.join("\n"));
				APIMethods.runScript(toPost.join(""), {});
			}
		} else {
			APIMethods.runScript( getSetDrillStatusScript('completed') +`Variable.find(gameModel, 'currentPatient').setValue(self, '');`, {});
		}
	}
}