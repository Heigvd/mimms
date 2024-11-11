import { parse } from "../../../tools/WegasHelper";
import { GlobalEventId, SimTime } from "../baseTypes";
import { EventPayload, TimedEventPayload } from "./eventTypes";


/** 
 * a FullEvent is meant to be broadcasted to all opened games instances
 * it is always generated by a player action
 * 
 * TODO adpat to EventBox new type when implemented
 */
export interface FullEvent<T extends EventPayload> {
	/** backend defined id */
	id: GlobalEventId;
	/** backend defined timestamp (epoch) */
	timestamp: number;
	/** legacy for real time */
	time: SimTime;
	payload: T;
}

type EventBoxImpl = 'LEGACY' | 'NEWEVENTBOX';

/*
Toggle this value to use the old implementation or the new event box implementation 
If this value is changed:
- Close the simulation windows (main sim, etc.)
- Restart the game
- Reload the page
WARNING : Also make sure to check the server scripts if you change!
*/
export const eventBoxImplementation : EventBoxImpl = 'NEWEVENTBOX';


export function getSendEventServerScript(payload: EventPayload, time?: number) {
	const verb = eventBoxImplementation === 'NEWEVENTBOX' ? 'postNewEvent' : 'postEvent';
	return `EventManager.${verb}(${JSON.stringify(payload)}${time != null ? `, ${time}` : ''});`;
}

export function sendEvent(payload: EventPayload) : Promise<IManagedResponse> {
	return APIMethods.runScript(getSendEventServerScript(payload), {});
}

export function sendEvents(payloads: EventPayload[]) : Promise<IManagedResponse>{
	const script = payloads.map(payload => getSendEventServerScript(payload)).join("");
	return APIMethods.runScript(script, {});
}

export function getAllEvents<P extends EventPayload>(): FullEvent<P>[] {

	switch(eventBoxImplementation){
		case "LEGACY":
			return getAllEventsLegacy<P>();
		case 'NEWEVENTBOX':
			return getAllEventsNewImpl<P>();
	}
}

/**
 * Deprecated
 * Legacy events using email inbox variable
 */
function getAllEventsLegacy<P extends EventPayload>(): FullEvent<P>[] {
	const eventsInstance = Variable.find(gameModel, 'events').getInstance(self);
	const rawMessages = eventsInstance.getEntity().messages;

	const events = rawMessages.map((message : any) => {
		const json = I18n.translate(message.body);
		const event = parse<FullEvent<P>>(json)!;
		event.id = message.id!;
		event.timestamp = message.time!;

		return event;
	});

	return events;
}

/**
 * New implementation using an EventBox variable
 */
function getAllEventsNewImpl<P extends EventPayload>(): FullEvent<P>[] {
	const eventsInstance = Variable.find(gameModel, 'newEvents').getInstance(self);
	const rawEvents = eventsInstance.getEntity().events;

	const events = rawEvents.map((rawEv : any) => {
		const content = parse<{time: number, payload: P}>(rawEv.payload)!;
		const event : FullEvent<P> = {
			id: rawEv.id,
			time: content.time, // sim provided time
			payload: content.payload,
			timestamp: rawEv.timeStamp
		}
		
		return event;
	});

	return events;
}


/**
 * Legacy compare (real time in prétri)
 * @param a 
 * @param b 
 * @returns 
 */
export function compareEvent(a: FullEvent<EventPayload>, b: FullEvent<EventPayload>): number {
	if (a.time < b.time) {
		return -1;
	} else if (a.time > b.time) {
		return +1;
	} else if (a.timestamp === b.timestamp) {
		return a.id - b.id;
	} else {
		return a.timestamp - b.timestamp;
	}
}

/**
 * Main simulation compare function
 * @param a 
 * @param b 
 * @returns 
 */
export function compareTimedEvents(a: FullEvent<TimedEventPayload>, b: FullEvent<TimedEventPayload>): number {
	return a.payload.triggerTime - b.payload.triggerTime;
}

