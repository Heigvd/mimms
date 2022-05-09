import { Point } from "./helper";
import {
	afflictPathology, BlockName, BodyEffect, BodyState,
	computeState, createHumanBody, doItemActionOnHumanBody,
	enableCoagulation,
	enableLungsVasoconstriction,
	enableVasoconstriction,
	Environnment, HumanBody, HumanMeta
} from "./HUMAn";
import { ActDefinition, ActionBodyEffect, AfflictedPathology, HumanAction, ItemDefinition } from "./pathology";
import { getAct, getActs, getItem, getPathology, setCompensationModel, setSystemModel } from "./registries";
import { getCurrentSimulationTime } from "./TimeManager";
import { getBodyParam, getEnv, loadCompensationModel, loadSystem, parse, whoAmI } from "./WegasHelper";
import { BaseEvent } from "./baseEvent";
import {
	DirectCommunicationEvent, RadioChannelUpdateEvent,
	RadioCreationEvent,
	RadioCommunicationEvent, PhoneCommunicationEvent,
	PhoneCreationEvent,
	processPhoneCreation,
	processDirectMessageEvent, processRadioChannelUpdate,
	processRadioCommunication, processRadioCreationEvent,
	processPhoneCommunication, clearAllCommunicationState
} from "./communication";

///////////////////////////////////////////////////////////////////////////
// Typings
///////////////////////////////////////////////////////////////////////////
const worldLogger = Helpers.getLogger("the_world");


export type Location = Point & {
	mapId: string;
}

export interface Located {
	location: Location | undefined;
	direction: Location | undefined;
}

export interface HumanHealth {
	pathologies: AfflictedPathology[];
	effects: BodyEffect[];
}

type HumanHealthState = Record<string, HumanHealth>;

export type LocationState = Located & {
	type: 'Human';
	id: string;
	time: number;
}

export interface HumanState {
	type: 'Human';
	id: string;
	time: number;
	bodyState: BodyState;
};


export interface WorldState {
	// id to human
	humans: Record<string, HumanState & Located>;

}

export type WorldObject = HumanState;

interface ObjectId {
	objectType: string;
	objectId: string;
}

interface PositionAtTime {
	time: number,
	location: Location,
	direction: Location | undefined
}

// Update-to-date locations
// key is ObjectType::ObjectId
// last exact position is "location" at "time" (teleportation)
// current move is define by "direction"
export type PositionState = Record<string, undefined | (ObjectId & PositionAtTime)>


/**
 * NONE: update everything, all the time
 * SIGHT: update only if visible (TODO: find the smarter way to compute position)
 * FULL: only update current player character (whoAmI)
 */
type FogType = 'NONE' | 'SIGHT' | 'FULL';



/**
 * Walk, drive, fly to destination
 * TODO: path to follow
 */
interface FollowPathEvent extends BaseEvent {
	type: 'FollowPath';
	from: Location;
	destination: Location;
}

/** Aka teleportation */
type TeleportEvent = BaseEvent & {
	type: 'Teleport';
	location: Location;
}

/** */
type PathologyEvent = BaseEvent & {
	type: 'HumanPathology';
	pathologyId: string;
	blocks: BlockName[],
}

type HumanTreatmentEvent = BaseEvent & {
	type: 'HumanTreatment';
	source: ({
		type: 'act',
		actId: string
	} |
	{
		type: 'itemAction',
		itemId: string;
		actionId: string;
	})
	blocks: BlockName[],
}

type Event = FollowPathEvent | TeleportEvent |
	PathologyEvent | HumanTreatmentEvent |
	DirectCommunicationEvent | RadioCommunicationEvent |
	RadioChannelUpdateEvent | RadioCreationEvent |
	PhoneCommunicationEvent |
	PhoneCreationEvent;

type EventType = Event['type'];

type EventStore = Record<string, Event[]>;

interface Snapshot<T> {
	time: number;
	state: T;
}

type Snapshots<T> = Record<string, Snapshot<T>[]>

///////////////////////////////////////////////////////////////////////////
// State & config
///////////////////////////////////////////////////////////////////////////

// const spatialIndex: PositionState = {};

const humanMetas: Record<string, HumanMeta> = {};

// object key to list of snapshots
let humanSnapshots: Snapshots<HumanState> = {};

let locationsSnapshots: Snapshots<LocationState> = {};

// current visible state
const worldState: WorldState = {
	humans: {},

};

let healths: HumanHealthState = {};

/**
 * Trace of processed events.
 * if id of message is in the map, event has already been processed
 */
let processedEvent: Record<number, boolean> = {};

let currentProcessedEvents: Event[] = [];

// const eventStore: EventStore = {};



let fogType: FogType = 'SIGHT';

// TODO: line of sight: 
export const lineOfSightRadius = 250;

const sqRadius = lineOfSightRadius * lineOfSightRadius;

///////////////////////////////////////////////////////////////////////////
// Helpers & Utils
///////////////////////////////////////////////////////////////////////////

function getObjectKey(object: ObjectId) {
	return object.objectType + "::" + object.objectId;
}


function rndInt(min: number, max: number) {
	const range = max - min;
	return Math.floor(Math.random() * range + min);
}

function randomLocation(): Location {
	return {
		mapId: 'the_world',
		x: rndInt(0, 500),
		y: rndInt(0, 500),
	};
};

function originLocation(): Location {
	return {
		mapId: 'the_world',
		x: 0,
		y: 0,
	};
};

function add(a: Point, b: Point): Point {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	}
}

function sub(a: Point, b: Point): Point {
	return {
		x: a.x - b.x,
		y: a.y - b.y
	}
}

function mul(a: Point, s: number): Point {
	return {
		x: a.x * s,
		y: a.y * s
	}
}

function norm(a: Point, b: Point): number {
	return a.x * b.x + a.y * b.y
}

function hypotSq(a: Point): number {
	return norm(a, a);
}

function proj(a: Point, b: Point): Point {
	const abProduct = norm(a, b);
	const bbProduct = norm(b, b);
	if (bbProduct > 0) {
		const k = abProduct / bbProduct;
		return mul(b, k);
	} else {
		// AB is not a segment but a point (a === b)
		return a;
	}
}

/**
 * speed: px/sec
 */
function computeCurrentLocation(location: PositionAtTime | undefined, currentTime: number, speed: number): Location | undefined {
	// TODO multi map
	worldLogger.log("ComputeCurrentLocation", { location, currentTime, speed });
	if (location != null) {
		if (location.direction != null) {
			const delta = sub(location.direction, location.location);
			const duration = currentTime - location.time;
			const fullDistance = Math.sqrt(hypotSq(delta));
			const distance = speed * duration;
			const ratio = distance > fullDistance ? 1 : distance / fullDistance;
			return {
				mapId: location.location.mapId,
				...add(mul(delta, ratio), location.location)
			};
		} else {
			return location.location;
		}
	}
}


/**
 * Is there an intersection between sebment AB and circle (c, sqrt(sqRadius))
 * 
 * (using sqRadius to prevent uselesss sqrt computation)
 */
function doIntersect(c: Point, sqRadius: number, a: Point, b: Point): boolean {
	if (a.x === b.x && a.y === b.y) {
		// A and B are the same point
		return isPointInCircle(c, sqRadius, a);
	}

	// 
	// find point of AB segment which is the nearest of point C  
	const ac_Vector = sub(c, a);
	const ab_Vector = sub(b, a);

	// Project AC on AB line
	const d = add(proj(ac_Vector, ab_Vector), a);

	const ad_Vector = sub(d, a);
	// is d on AB segment ? (thales th. against greater delta to avoid division by zero)
	const k = Math.abs(ab_Vector.x) > Math.abs(ab_Vector.y)
		? ad_Vector.x / ab_Vector.x
		: ad_Vector.y / ab_Vector.y;

	if (k <= 0) {
		// d is not on seg AB (before A)
		return isPointInCircle(c, sqRadius, a);
	} else if (k >= 1) {
		// d is not on seg AB (after B)
		return isPointInCircle(c, sqRadius, b);
	} else {
		// D is on seg AB
		return isPointInCircle(c, sqRadius, d);
	}
}


function isPointInCircle(c: Point, sqRadius: number, p: Point) {
	const deltaX = Math.abs(p.x - c.x);
	const deltaY = Math.abs(p.y - c.y);
	// sqrt(dx² + dy²) < radius 
	// => dx²+dy² < radius²
	return deltaX * deltaX + deltaY * deltaY < sqRadius;
}





function getAllEvents(): Event[] {
	const eventsInstance = Variable.find(gameModel, 'events').getInstance(self);
	const rawMessages = eventsInstance.getEntity().messages;

	const events = rawMessages.map(message => {
		const json = I18n.translate(message.body);
		const event = parse<Event>(json);
		return {
			id: message.id,
			timestamp: message.time,
			...event,
		};
	});

	return events;
}

function filterOutFutureEvents(events: Event[], time: number) {
	return events.filter(ev => ev.time <= time);
}

function compareEvent(a: Event, b: Event): number {
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

function extractNotYetProcessedEvents(events: Event[]) {
	return events.reduce<{ processed: Event[], not: Event[] }>((acc, cur) => {
		if (processedEvent[cur.id]) {
			acc.processed.push(cur);
		} else {
			acc.not.push(cur);
		}
		return acc;
	}, {
		processed: [], not: [],
	});
}

function mapLastLocationEventByObject(events: Event[]) {
	return events.reduce<Record<string, Event>>((acc, event) => {
		if (event.type === 'FollowPath' || event.type === 'Teleport') {
			const key = getObjectKey({ objectType: event.targetType, objectId: event.targetId });
			const current = acc[key];
			if (current) {
				if (compareEvent(current, event) < 0) {
					acc[key] = event;
				}
			} else {
				acc[key] = event;
			}
			return acc;
		}
		return acc;
	}, {});
}


function findNextEvent(events: Event[], currentEvent: Event, eventTypes: EventType[], target: ObjectId): Event | undefined {
	const futureEvents = events.filter(event => {
		return event.targetType === target.objectType
			&& event.targetId === target.objectId
			&& eventTypes.includes(event.type)
			&& compareEvent(event, currentEvent) > 0;
	});
	return futureEvents.sort(compareEvent)[0];
}

/**
 * Compute spatial index at given type
 */
function computeSpatialIndex(objectList: ObjectId[], time: number): PositionState {
	const spatialIndex: PositionState = {};

	const allEvents = getAllEvents();
	const events = filterOutFutureEvents(allEvents, time);
	const mappedEvent = mapLastLocationEventByObject(events);

	worldLogger.debug("Most recent location event", { mappedEvent });

	objectList.forEach((obj) => {
		worldLogger.debug("Compute Location", { obj });
		const key = getObjectKey(obj);
		const event = mappedEvent[key];
		if (event != null) {
			if (event.type === 'Teleport') {
				// object is static on this position
				event.location;
				spatialIndex[key] = {
					objectType: obj.objectType,
					objectId: obj.objectId,
					time: time,
					location: event.location,
					direction: undefined
				};
			} if (event.type === 'FollowPath') {
				// object is moving
				spatialIndex[key] = {
					objectType: obj.objectType,
					objectId: obj.objectId,
					time: event.time,
					location: event.from,
					direction: event.destination,
				};
			}
		}
	});
	return spatialIndex;
}


function initHuman(humanId: string): HumanState {
	const env = getEnv();
	const bodyParam = getBodyParam(humanId);
	const humanBody = createHumanBody(bodyParam, env);
	humanMetas[humanId] = humanBody.meta;

	worldLogger.log("Create Human:");
	worldLogger.log(" ENV:", env);
	worldLogger.log(" Param:", bodyParam);
	worldLogger.log(" human: ", humanBody.state.vitals.glasgow.total);

	return {
		type: 'Human',
		id: humanId,
		bodyState: humanBody.state,
		time: 0,
	};
}

/**
 * build state of the world at given time
 */
function rebuildState(time: number, env: Environnment) {
	worldLogger.debug("RebuildState", { time, env });
	worldLogger.debug("Humans", humanSnapshots);
	worldLogger.debug("Locations", locationsSnapshots);

	const objectList: ObjectId[] = Object.keys(locationsSnapshots).map(key => {
		const [type, id] = key.split("::");
		return {
			objectId: id,
			objectType: type,
		};
	});


	// generate missing snapshot for time
	objectList.forEach(obj => {
		const oKey = getObjectKey(obj);
		worldLogger.info("Update ", obj, oKey);

		const humanS = getMostRecentSnapshot(humanSnapshots, obj, time);
		const positionS = getMostRecentSnapshot(locationsSnapshots, obj, time);

		if (positionS.mostRecent != null && positionS.mostRecent.time < time) {
			if (positionS.mostRecent.state.direction) {
				// Object is moving
				const speed = 20; // TODO speed is dependent of HumanS
				const newLocation = computeCurrentLocation(positionS.mostRecent.state, time, speed);
				worldLogger.log("RebuildPosition: ", positionS, locationsSnapshots[oKey]);
				locationsSnapshots[oKey].splice(positionS.mostRecentIndex + 1, 0, {
					time: time,
					state: {
						...positionS.mostRecent.state,
						time: time,
						location: newLocation,
					}
				});
			}
		}


		if (humanS.mostRecent == null) {
			humanS.mostRecent = {
				time: 0,
				state: initHuman(obj.objectId),
			}
			humanSnapshots[oKey].unshift(humanS.mostRecent);
		}

		if (humanS.mostRecent != null && humanS.mostRecent.time < time) {
			//const humanState = Helpers.cloneDeep(humanS.mostRecent.state);
			const newState = computeHumanState(humanS.mostRecent.state, time, env);

			humanSnapshots[oKey].splice(humanS.mostRecentIndex + 1, 0, {
				time: time,
				state: newState,
			});

			worldLogger.debug("WorldState: ", humanSnapshots[oKey]);
		}
	});

	// update visible world
	const myHumanId = whoAmI();
	const myId = { objectId: myHumanId, objectType: 'Human' };
	const myPosition = getMostRecentSnapshot(locationsSnapshots, myId, time);


	if (myPosition.mostRecent != null) {
		const visibles: ObjectId[] = [];
		let outOfSight: ObjectId[] = [];

		if (fogType === 'NONE') {
			// no fog: update all objects
			visibles.push(...objectList);
		} else if (fogType === 'FULL') {
			// Full fog: update current human only
			visibles.push({
				objectType: 'Human',
				objectId: myHumanId,
			});
			outOfSight = objectList.filter(o => { o.objectType != 'Human' });

		} else if (fogType === 'SIGHT') {
			// Detect visible object
			Object.keys(locationsSnapshots).forEach(key => {
				const [type, id] = key.split("::");
				const oId = { objectType: type, objectId: id };
				const { mostRecent } = getMostRecentSnapshot(locationsSnapshots, oId, time);
				if (mostRecent != null && isPointInCircle(myPosition.mostRecent.state.location, sqRadius, mostRecent.state.location)) {
					visibles.push(oId);
				} else {
					outOfSight.push(oId);
				}
			});
		}

		worldLogger.info("My Position", myPosition);
		worldLogger.info("Visible", visibles);
		worldLogger.info("OutOfSight", outOfSight);

		visibles.forEach(oId => {
			const key = getObjectKey(oId);
			const location = getMostRecentSnapshot(locationsSnapshots, oId, time);
			const human = getMostRecentSnapshot(humanSnapshots, oId, time);
			worldLogger.debug("Visible@Location", key, location.mostRecent);
			worldLogger.debug("Visible@Human", key, human.mostRecent);

			if (location.mostRecent != null && human.mostRecent != null) {
				worldState.humans[key] = {
					...human.mostRecent.state,
					...location.mostRecent.state,
				}
			}
		});

		// make sure out-of-sight object or not visible
		worldLogger.info("InMemoryWorld: ", worldState);
		outOfSight.forEach(obj => {
			const oKey = getObjectKey(obj);
			//const objSpatialIndex = spatialIndex[oKey];
			const current = obj.objectType === 'Human' ? worldState.humans[oKey] : undefined;

			worldLogger.info("OutOfSight: last known position: ", current);
			if (current != null && current.location != null) {
				if (current.id != myHumanId) {
					/*if (current.direction) {
						current.location = undefined;
						current.direction = undefined;
					}*/
					if (current.direction != null) {
						// last time I saw this object, it was moving
						current.location = undefined;
						current.direction = undefined;
					} else if (isPointInCircle(myPosition.mostRecent.state.location, sqRadius, current.location)) {
						// Last known location was here but object is not here any longer
						current.location = undefined;
						current.direction = undefined;
					}
				}
			}
		});
	}
}


function getMostRecentSnapshot<T>(snapshots: Snapshots<T>, obj: ObjectId, time: number, options: {
	strictTime?: boolean;
	before?: Event;
} = {}): {
	mostRecent: Snapshot<T> | undefined,
	mostRecentIndex: number;
	futures: Snapshot<T>[],
} {
	const oKey = getObjectKey(obj);

	worldLogger.info("Update ", obj, oKey);

	let futures: Snapshot<T>[] = [];
	let index = -1;

	const oSnapshots = snapshots[oKey];

	let snapshot: Snapshot<T> | undefined = undefined;

	if (oSnapshots != null) {
		// find most recent snapshot
		for (let i = oSnapshots.length - 1; i >= 0; i--) {
			if (!!options.strictTime ? oSnapshots[i].time < time : oSnapshots[i].time <= time) {
				snapshot = oSnapshots[i];
				index = i;
				futures = oSnapshots.slice(i + 1);
				break;
			}
		}
	} else {
		snapshots[oKey] = [];
	}


	if (snapshot == undefined) {
		worldLogger.info("No Snapshot: init")
		// snapshot = { state: initObject<T>(obj), time: 0 };
	} else {
		worldLogger.info("Snapshot found at time ", snapshot.time);
	}
	if (options.before) {
		futures = futures.filter(e => e.time < before.time)
	}

	return {
		mostRecent: snapshot,
		mostRecentIndex: index,
		futures: futures,
	};
}


function computeHumanState(state: HumanState, to: number, env: Environnment) {
	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
	const meta = humanMetas[state.id];
	const newState = Helpers.cloneDeep(state);

	const from = state.bodyState.time;

	const health = healths[state.id] || { effects: [], pathologies: [] };
	for (let i = from + stepDuration; i <= to; i += stepDuration) {
		worldLogger.log("Compute Human Step ", { currentTime: newState.time, stepDuration, health });
		computeState(newState.bodyState, meta, env, stepDuration, health.pathologies, health.effects);
		worldLogger.debug("Step Time: ", newState.bodyState.time)
	}

	// last tick
	if (newState.time < to) {
		worldLogger.log("Compute Human Step ", { currentTime: newState.time, stepDuration: to - newState.bodyState.time, health });
		computeState(newState.bodyState, meta, env, to - newState.bodyState.time, health.pathologies, health.effects);
	}
	newState.time = newState.bodyState.time;
	worldLogger.debug("FinalStateTime: ", newState.time);
	return newState;
}


function processTeleportEvent(event: TeleportEvent): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.targetType, objectId: event.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextEvent(currentProcessedEvents, event, ['FollowPath', 'Teleport'], objId);

	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(locationsSnapshots, objId, event.time, { before: next });

	let currentSnapshot: { time: number; state: LocationState; };

	if (mostRecent == null || mostRecent.time < event.time) {
		currentSnapshot = {
			time: event.time,
			state: {
				type: event.targetType,
				id: event.targetId,
				time: event.time,
				location: event.location,
				direction: undefined,
			}
		}
		// register new snapshot
		worldLogger.debug("Teleport: ", locationsSnapshots[oKey]);
		locationsSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.location;
		currentSnapshot.state.direction = undefined;
	}

	// Update futures
	futures.forEach(snapshot => {
		snapshot.state.location = event.location;
		currentSnapshot.state.direction = undefined;
	});

	return false;
}


function processFollowPathEvent(event: FollowPathEvent): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.targetType, objectId: event.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextEvent(currentProcessedEvents, event, ['FollowPath', 'Teleport'], objId);


	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(locationsSnapshots, objId, event.time, { before: next });

	let currentSnapshot: { time: number; state: LocationState; };

	if (mostRecent == null || mostRecent.time < event.time) {
		// object start to move now: it's located on its starting position
		currentSnapshot = {
			time: event.time,
			state: {
				type: event.targetType,
				id: event.targetId,
				time: event.time,
				location: event.from,
				direction: event.destination,
			}
		}
		// register snapshot
		worldLogger.debug("FollowPath: ", locationsSnapshots[oKey]);
		locationsSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.from;
		currentSnapshot.state.direction = event.destination;
	}

	// Update futures
	futures.forEach(snapshot => {
		const loc = computeCurrentLocation(currentSnapshot.state, snapshot.time, 20);
		worldLogger.log("Update Future: ", { snapshot, loc });
		snapshot.state.location = loc;
		snapshot.state.location = event.destination;
	});
	return false;
}


function updateHumanSnapshots(humanId: string, time: number) {
	// Update HUMAn body states
	const objId = { objectType: 'Human', objectId: humanId };
	const oKey = getObjectKey(objId);

	const env = getEnv();
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(humanSnapshots, objId, time, { strictTime: true });

	let currentSnapshot: { time: number; state: HumanState; };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId)
		};
		humanSnapshots[oKey].unshift(mostRecent);
	}
	worldLogger.log("Update human snapshot", oKey, { mostRecent, futures });
	if (mostRecent.time < time) {
		// catch-up human state
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env)
		}
		// register new snapshot
		worldLogger.log("Update human snapshot at time ", time);
		humanSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}
	// Update futures
	futures.forEach(snapshot => {
		worldLogger.log("Update future human snapshot at time ", snapshot.time);
		const state = Helpers.cloneDeep(currentSnapshot.state)
		snapshot.state = computeHumanState(state, snapshot.time, env);

		currentSnapshot = snapshot;
	});
}

export function getHealth(humanId: string) {
	return healths[humanId] || { effects: [], pathologies: [] };
}

function processPathologyEvent(event: PathologyEvent) {
	const pathology = getPathology(event.pathologyId);
	if (pathology != null) {
		worldLogger.log("Afflict Pathology: ", { pathology, time: event.time });
		//const meta = humanMetas[event.targetId];

		// push pathology in human health state
		const p = afflictPathology(pathology, event.time, event.blocks);

		const health = getHealth(event.targetId);
		health.pathologies.push(p);
		healths[event.targetId] = health;

		updateHumanSnapshots(event.targetId, event.time);
	} else {
		worldLogger.info(`Afflict Pathology Failed: Pathology "${event.pathologyId}" does not exist`);
	}
}

function isActionBodyEffect(action: HumanAction | undefined): action is ActionBodyEffect {
	return action?.type === 'ActionBodyEffect'
}


function resolveAction(event: HumanTreatmentEvent): { source: ActDefinition | ItemDefinition; action: ActionBodyEffect } | undefined {
	if (event.source.type === 'act') {
		const act = getAct(event.source.actId);
		const action = act?.action;
		if (isActionBodyEffect(action)) {
			return {
				source: act!,
				action: action,
			};
		}
	} else if (event.source.type === 'itemAction') {
		const item = getItem(event.source.itemId);
		const action = item?.actions[event.source.actionId];
		if (isActionBodyEffect(action)) {
			return {
				source: item!,
				action: action,
			};
		}
	}

	return undefined;
}

function processHumanTreatmentEvent(event: HumanTreatmentEvent) {

	const resolvedAction = resolveAction(event);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === "ActionBodyEffect") {
			worldLogger.log("Apply Item: ", { time: event.time, source: event.source, action }, event);
			const effect = doItemActionOnHumanBody(source, action, event.blocks, event.time);
			if (effect != null) {
				const health = getHealth(event.targetId);
				health.effects.push(effect);
				healths[event.targetId] = health;

				updateHumanSnapshots(event.targetId, event.time);
			}
		} else {
			worldLogger.warn('Unhandled action type', action);
		}
	} else {
		worldLogger.warn(`Action Failed: Action "${JSON.stringify(event.source)}" does not exist`);
	}
}

function unreachable(x: never) {
	worldLogger.error("Unreachable ", x);
}

function processDirectCommunicationEvent(event: DirectCommunicationEvent): void {

	// sender always gets his own messages
	//processMessageEvent(event, event.sender);

	//check distance between sender and player
	//TODO perform for all players (supposing a change of player)
	const time = event.time;

	//could be performed with all characters if the player can change character live
	const myHumanId = whoAmI();
	const myId = { objectId: myHumanId, objectType: 'Human' };
	const myPosition = getMostRecentSnapshot(locationsSnapshots, myId, time);

	const senderId = { objectId: event.sender, objectType: 'Human' };
	const senderPosition = getMostRecentSnapshot(locationsSnapshots, senderId, time);

	let distanceSquared = Infinity;

	if (myPosition?.mostRecent?.state?.location && senderPosition?.mostRecent?.state?.location) {
		const vec = sub(myPosition.mostRecent.state.location, senderPosition.mostRecent.state.location);
		distanceSquared = norm(vec, vec);
	}

	worldLogger.debug("Computed distance : " + Math.sqrt(distanceSquared))
	if (distanceSquared < sqRadius) {
		processDirectMessageEvent(event, event.sender);
	} else {
		worldLogger.warn(`Ignoring direct comm event(${event.id}), too far :  ${Math.sqrt(distanceSquared)}`)
	}
}

function processEvent(event: Event) {
	worldLogger.debug("ProcessEvent: ", event);

	switch (event.type) {
		case 'Teleport':
			processTeleportEvent(event);
			break;
		case 'FollowPath':
			processFollowPathEvent(event);
			break;
		case 'HumanPathology':
			processPathologyEvent(event);
			break;
		case 'HumanTreatment':
			processHumanTreatmentEvent(event);
			break;
		case 'DirectCommunication':
			processDirectCommunicationEvent(event);
			break;
		case 'RadioCommunication':
			processRadioCommunication(event);
			break;
		case 'RadioChannelUpdate':
			processRadioChannelUpdate(event);
			break;
		case 'RadioCreation':
			processRadioCreationEvent(event);
			break;
		case 'PhoneCommunication':
			processPhoneCommunication(event);
			break;
		case 'PhoneCreation':
			processPhoneCreation(event);
			break;
		default:
			unreachable(event);
	}
	processedEvent[event.id] = true;
}

export function syncWorld() {
	worldLogger.log("Sync World");
	//updateInSimCurrentTime();
	const time = getCurrentSimulationTime();

	const allEvents = getAllEvents();
	const events = filterOutFutureEvents(allEvents, time);
	const mappedEvents = extractNotYetProcessedEvents(events);
	const eventsToProcess = mappedEvents.not;
	currentProcessedEvents = mappedEvents.processed;

	worldLogger.debug("ToProcess", eventsToProcess);

	const env = getEnv();

	const sortedEvents = eventsToProcess.sort(compareEvent);

	sortedEvents.forEach(e => processEvent(e));

	//const checkpoints = Helpers.uniq([...eventsToProcess.map(event => event.time), time]).sort((a, b) => a - b);

	rebuildState(time, env);

	//worldLogger.debug("World Checkpoints: ", JSON.stringify(checkpoints));
	//worldLogger.log("SnapShots Before:", (Object.entries(humanSnapshots).map(([key, list]) => key + " => " + list.map(entry => entry.time))));
	//checkpoints.forEach(checkPoint => {
	//	worldLogger.debug("World Checkpoint: ", checkPoint);
	//		rebuildState(objectList, checkPoint, env, allEvents);
	//});
	//eventsToProcess.forEach(event => {
	//	processedEvent[event.id] = true;
	//});

	//worldLogger.debug("SnapShots After:", (Object.entries(humanSnapshots).map(([key, list]) => key + " => " + list.map(entry => entry.time))));

	// TODO: clean world snapshot
	// keep all snapshots <10s
	// keep 1/10s <1min
	// keep 1/min < 1hour
	// keep 1/10min > 1hour
	//Object.keys(snapshots).forEach(key => {

	//});
}


export function getHumans() {
	return Object.values(worldState.humans).map(h => ({
		id: h.id,
		location: h.location,
		direction: h.direction,
	}));
}

export function getHuman(id: string): HumanBody | undefined {
	const human = worldState.humans[`Human::${id}`];
	const meta = humanMetas[id];
	if (human && meta) {
		return {
			meta,
			state: human.bodyState,
		}
	}

	return undefined;
}

export function handleClickOnMap(point: Point): void {
	const myId = whoAmI();
	if (myId) {
		const objectId: ObjectId = { objectType: 'Human', objectId: myId };
		const destination: Location = { ...point, mapId: 'the_world' };
		const key = getObjectKey(objectId);
		const myState = worldState.humans[key];
		const currentLocation = myState?.location;
		wlog("HandleOn: ", { objectId, destination, currentLocation, myState });
		if (currentLocation != null) {
			// Move from current location to given point
			const from: Location = { ...currentLocation, mapId: 'the_world' };
			APIMethods.runScript("EventManager.followPath(Context.objectId, Context.from, Context.destination);", { objectId, from, destination });
		} else {
			// No known location => Teleport
			APIMethods.runScript("EventManager.teleport(Context.objectId, Context.destination);", { objectId, destination });
		}
	}
}


export function getCurrentPatientBody(): HumanBody | undefined {
	const id = I18n.toString(Variable.find(gameModel, 'currentPatient'));
	return getHuman(id);
}

export function getCurrentPatientHealth(): HumanHealth | undefined {
	const id = I18n.toString(Variable.find(gameModel, 'currentPatient'));
	return getHealth(id);
}

export interface InventoryEntry {
	itemId: string;
	count: number | 'infinity';
}

/**
 * Get current character inventory.
 * 
 * TODO Event to manage inventory (Got/Consume/Transfer)
 */
export function getMyInventory(): InventoryEntry[] {
	return [
		{ itemId: 'cat', count: 'infinity' },
		{ itemId: 'bandage', count: 'infinity' },
		{ itemId: 'israeliBandage', count: 'infinity' },
		{ itemId: 'mask', count: 'infinity' },
		{ itemId: 'tube', count: 'infinity' },
		{ itemId: 'tTube', count: 'infinity' },
		{ itemId: 'oxymeter', count: 1 },
		{ itemId: 'sphygmomanometer', count: 1 },
	];
}

/**
 * Accordind to its skills, get all medical act available to current character
 */
export function getMyMedicalActs(): ActDefinition[] {
	// TODO: skills: get whoAmiI skills and fitler acts
	return getActs();
}

export function clearState() {
	processedEvent = {};
	humanSnapshots = {};
	locationsSnapshots = {};
	worldState.humans = {};
	healths = {};
	clearAllCommunicationState();
}


Helpers.registerEffect(() => {
	// Load model configuration
	enableVasoconstriction(Variable.find(gameModel, 'vasoconstriction').getValue(self));
	enableCoagulation(Variable.find(gameModel, 'coagulation').getValue(self));
	enableLungsVasoconstriction(Variable.find(gameModel, 'vasoconstrictionLungs').getValue(self));

	const system = loadSystem();
	worldLogger.log("(Init Sympathetic System: ", system);
	setSystemModel(system);

	const compensation = loadCompensationModel();
	worldLogger.log("Load Compensation Profile: ", compensation);
	setCompensationModel(compensation);

	clearState();
})



