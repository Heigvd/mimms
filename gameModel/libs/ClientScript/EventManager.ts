import { EventPayload } from "./the_world";
import { parse } from "./WegasHelper";

export interface FullEvent<T extends EventPayload> {
	id: number;
	timestamp: number;
	time: number;
	payload: T;
}

export function getSendEventServerScript(payload: EventPayload, time?: number) {
	return `EventManager.postEvent(${JSON.stringify(payload)}${time != null ? `, ${time}` : ''});`;
}

export function sendEvent(payload: EventPayload) {
	APIMethods.runScript(getSendEventServerScript(payload), {});
}

export function sendEvents(payloads: EventPayload[]) {
	const script = payloads.map(payload => getSendEventServerScript(payload)).join("");
	APIMethods.runScript(script, {});
}

export function getAllEvents(): FullEvent<EventPayload>[] {
	const eventsInstance = Variable.find(gameModel, 'events').getInstance(self);
	const rawMessages = eventsInstance.getEntity().messages;

	const events = rawMessages.map(message => {
		const json = I18n.translate(message.body);
		const event = parse<FullEvent<EventPayload>>(json)!;
		event.id = message.id!;
		event.timestamp = message.time!;

		return event;
	});

	return events;
}