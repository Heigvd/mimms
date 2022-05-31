import { Point } from "./helper";


import {
	afflictPathology, BlockName, BodyEffect, BodyState,
	BodyStateKeys,
	computeState, createHumanBody, doItemActionOnHumanBody,
	enableCoagulation,
	enableLungsVasoconstriction,
	enableVasoconstriction,
	Environnment, HumanBody, HumanMeta, readKey
} from "./HUMAn";
import { ActDefinition, ActionBodyEffect, ActionBodyMeasure, AfflictedPathology, HumanAction, ItemDefinition } from "./pathology";
import { getAct, getActs, getItem, getPathology, setCompensationModel, setSystemModel } from "./registries";
import { getCurrentSimulationTime } from "./TimeManager";
import { getBodyParam, getEnv, loadCompensationModel, loadSystem, whoAmI } from "./WegasHelper";
import { initEmitterIds, TargetedEvent } from "./baseEvent";
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
import { FullEvent, getAllEvents, sendEvent } from "./EventManager";
import { Category, SystemName } from "./triage";




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

interface BaseLog {
	time: number;
}

type MessageLog = BaseLog & {
	type: 'MessageLog',
	message: string;
}

type MeasureLog = BaseLog & {
	type: 'MeasureLog',
	/**
	 * Key: metric name; value: measures value
	 */
	metrics: { metric: BodyStateKeys, value: unknown }[];
}

export type ConsoleLog = MessageLog | MeasureLog;

export interface Categorization {
	system: SystemName;
	category: Category<string>['id'];
}

export interface HumanState {
	type: 'Human';
	id: string;
	time: number;
	bodyState: BodyState;
	console: ConsoleLog[];
	category: Categorization | undefined;
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
	location: Location | undefined,
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
interface FollowPathEvent extends TargetedEvent {
	type: 'FollowPath';
	from: Location;
	destination: Location;
}

/** Aka teleportation */
interface TeleportEvent extends TargetedEvent {
	type: 'Teleport';
	location: Location;
}

/** */
interface PathologyEvent extends TargetedEvent {
	type: 'HumanPathology';
	pathologyId: string;
	blocks: BlockName[],
}

interface HumanLogMessageEvent extends TargetedEvent {
	type: 'HumanLogMessage';
	message: string;
}

interface HumanMeasureEvent extends TargetedEvent {
	type: 'HumanMeasure';
	source: ({
		type: 'act',
		actId: string
	} |
	{
		type: 'itemAction',
		itemId: string;
		actionId: string;
	})
}


interface HumanTreatmentEvent extends TargetedEvent {
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

interface CategorizeEvent extends TargetedEvent, Categorization {
	type: 'Categorize';
}


export type EventPayload = FollowPathEvent | TeleportEvent |
	PathologyEvent |
	HumanTreatmentEvent | HumanMeasureEvent |
	HumanLogMessageEvent |
	CategorizeEvent |
	DirectCommunicationEvent | RadioCommunicationEvent |
	RadioChannelUpdateEvent | RadioCreationEvent |
	PhoneCommunicationEvent |
	PhoneCreationEvent;

export type EventType = EventPayload['type'];

type EventStore = Record<string, EventPayload[]>;

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

let currentProcessedEvents: FullEvent<EventPayload>[] = [];

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
	if (location?.location != null) {
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


function isPointInCircle(c: Point | undefined, sqRadius: number, p: Point | undefined) {
	if (c == null || p == null) {
		return false;
	}
	const deltaX = Math.abs(p.x - c.x);
	const deltaY = Math.abs(p.y - c.y);
	// sqrt(dx² + dy²) < radius 
	// => dx²+dy² < radius²
	return deltaX * deltaX + deltaY * deltaY < sqRadius;
}

function filterOutFutureEvents(events: FullEvent<EventPayload>[], time: number) {
	return events.filter(ev => ev.time <= time);
}

function compareEvent(a: FullEvent<EventPayload>, b: FullEvent<EventPayload>): number {
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

function extractNotYetProcessedEvents(events: FullEvent<EventPayload>[]) {
	return events.reduce<{ processed: FullEvent<EventPayload>[], not: FullEvent<EventPayload>[] }>((acc, cur) => {
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

function mapLastLocationEventByObject(events: FullEvent<EventPayload>[]) {
	return events.reduce<Record<string, FullEvent<TeleportEvent | FollowPathEvent>>>((acc, event) => {
		if (event.payload.type === 'FollowPath' || event.payload.type === 'Teleport') {
			const key = getObjectKey({ objectType: event.payload.targetType, objectId: event.payload.targetId });
			const current = acc[key];
			if (current) {
				if (compareEvent(current, event) < 0) {
					acc[key] = event as FullEvent<TeleportEvent | FollowPathEvent>;
				}
			} else {
				acc[key] = event as FullEvent<TeleportEvent | FollowPathEvent>;
			}
			return acc;
		}
		return acc;
	}, {});
}


function findNextTargetedEvent(events: FullEvent<EventPayload>[], currentEvent: FullEvent<EventPayload>, eventTypes: EventType[], target: ObjectId): FullEvent<EventPayload> | undefined {
	const futureEvents = events
		.filter(event => {
			const cEvent = event.payload as Partial<TargetedEvent>;

			return cEvent.targetType === target.objectType
				&& cEvent.targetId === target.objectId
				&& eventTypes.includes(event.payload.type)
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
			if (event.payload.type === 'Teleport') {
				// object is static on this position
				event.payload.location;
				spatialIndex[key] = {
					objectType: obj.objectType,
					objectId: obj.objectId,
					time: time,
					location: event.payload.location,
					direction: undefined
				};
			} if (event.payload.type === 'FollowPath') {
				// object is moving
				spatialIndex[key] = {
					objectType: obj.objectType,
					objectId: obj.objectId,
					time: event.time,
					location: event.payload.from,
					direction: event.payload.destination,
				};
			}
		}
	});
	return spatialIndex;
}


function initHuman(humanId: string): HumanState {
	const env = getEnv();
	const bodyParam = getBodyParam(humanId);
	if (!bodyParam) {
		throw `InitHuman: No body param for humanId ${humanId}`;
	}
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
		console: [],
		category: undefined,
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
				if (mostRecent != null && isPointInCircle(myPosition.mostRecent!.state.location, sqRadius, mostRecent.state.location)) {
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
					} else if (isPointInCircle(myPosition.mostRecent!.state.location, sqRadius, current.location)) {
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
	before?: FullEvent<EventPayload>;
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
		futures = futures.filter(e => e.time < options.before!.time)
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


function processTeleportEvent(event: FullEvent<TeleportEvent>): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.payload.targetType, objectId: event.payload.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextTargetedEvent(currentProcessedEvents, event, ['FollowPath', 'Teleport'], objId);

	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(locationsSnapshots, objId, event.time, { before: next });

	let currentSnapshot: { time: number; state: LocationState; };

	if (mostRecent == null || mostRecent.time < event.time) {
		currentSnapshot = {
			time: event.time,
			state: {
				type: event.payload.targetType,
				id: event.payload.targetId,
				time: event.time,
				location: event.payload.location,
				direction: undefined,
			}
		}
		// register new snapshot
		worldLogger.debug("Teleport: ", locationsSnapshots[oKey]);
		locationsSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.payload.location;
		currentSnapshot.state.direction = undefined;
	}

	// Update futures
	futures.forEach(snapshot => {
		snapshot.state.location = event.payload.location;
		currentSnapshot.state.direction = undefined;
	});

	return false;
}


function processFollowPathEvent(event: FullEvent<FollowPathEvent>): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.payload.targetType, objectId: event.payload.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextTargetedEvent(currentProcessedEvents, event, ['FollowPath', 'Teleport'], objId);


	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(locationsSnapshots, objId, event.time, { before: next });

	let currentSnapshot: { time: number; state: LocationState; };

	if (mostRecent == null || mostRecent.time < event.time) {
		// object start to move now: it's located on its starting position
		currentSnapshot = {
			time: event.time,
			state: {
				type: event.payload.targetType,
				id: event.payload.targetId,
				time: event.time,
				location: event.payload.from,
				direction: event.payload.destination,
			}
		}
		// register snapshot
		worldLogger.debug("FollowPath: ", locationsSnapshots[oKey]);
		locationsSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.payload.from;
		currentSnapshot.state.direction = event.payload.destination;
	}

	// Update futures
	futures.forEach(snapshot => {
		const loc = computeCurrentLocation(currentSnapshot.state, snapshot.time, 20);
		worldLogger.log("Update Future: ", { snapshot, loc });
		snapshot.state.location = loc;
		snapshot.state.location = event.payload.destination;
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

function processPathologyEvent(event: FullEvent<PathologyEvent>) {
	const pathology = getPathology(event.payload.pathologyId);
	if (pathology != null) {
		worldLogger.log("Afflict Pathology: ", { pathology, time: event.time });
		//const meta = humanMetas[event.targetId];

		// push pathology in human health state
		const p = afflictPathology(pathology, event.time, event.payload.blocks);

		const health = getHealth(event.payload.targetId);
		health.pathologies.push(p);
		healths[event.payload.targetId] = health;

		updateHumanSnapshots(event.payload.targetId, event.time);
	} else {
		worldLogger.info(`Afflict Pathology Failed: Pathology "${event.payload.pathologyId}" does not exist`);
	}
}

function isActionBodyEffect(action: HumanAction | undefined): action is ActionBodyEffect {
	return action?.type === 'ActionBodyEffect';
}

function isMeasureAction(action: HumanAction | undefined): action is ActionBodyMeasure {
	return action?.type === 'ActionBodyMeasure';
}

interface ResolvedAction {
	source: ActDefinition | ItemDefinition;
	action: ActionBodyEffect | ActionBodyMeasure;
}


function resolveAction(event: HumanTreatmentEvent | HumanMeasureEvent): ResolvedAction | undefined {
	if (event.source.type === 'act') {
		const act = getAct(event.source.actId);
		const action = act?.action;
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			return {
				source: act!,
				action: action,
			};
		}
	} else if (event.source.type === 'itemAction') {
		const item = getItem(event.source.itemId);
		const action = item?.actions[event.source.actionId];
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			return {
				source: item!,
				action: action,
			};
		}
	}

	return undefined;
}



function doMeasure(source: ItemDefinition | ActDefinition, action: ActionBodyMeasure, fEvent: FullEvent<HumanMeasureEvent>) {
	const name = action.name;
	const metrics = action.metricName;
	const time = fEvent.time;

	const event = fEvent.payload;
	const objId = {
		objectType: event.targetType,
		objectId: event.targetId
	};
	const oKey = getObjectKey(objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(humanSnapshots, objId, fEvent.time);

	let currentSnapshot: { time: number; state: HumanState; };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId)
		};
		humanSnapshots[oKey].unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env)
		}
		// register new snapshot
		humanSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	const body = currentSnapshot.state.bodyState;

	const values: MeasureLog['metrics'] = metrics.map(metric => {
		return {
			metric,
			value: readKey(body, metric)
		}
	});

	const logEntry: MeasureLog = {
		type: 'MeasureLog',
		time: time,
		metrics: values,
	};
	currentSnapshot.state.console.push(logEntry);

	futures.forEach(snapshot => {
		snapshot.state.console.push({ ...logEntry });
		snapshot.state.console.sort((a, b) => a.time - b.time);
	})
}


function processHumanMeasureEvent(event: FullEvent<HumanMeasureEvent>) {

	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === "ActionBodyMeasure") {
			worldLogger.log("Do Act Item: ", { time: event.time, source: event.payload.source, action }, event);
			doMeasure(source, action as ActionBodyMeasure, event);
		} else {
			worldLogger.warn('Unhandled action type', action);
		}
	} else {
		worldLogger.warn(`Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`);
	}
}

function processHumanLogMessageEvent(event: FullEvent<HumanLogMessageEvent>) {
	const time = event.time;

	const objId = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId
	};
	const oKey = getObjectKey(objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(humanSnapshots, objId, event.time);

	let currentSnapshot: { time: number; state: HumanState; };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId)
		};
		humanSnapshots[oKey].unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env)
		}
		// register new snapshot
		humanSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	const logEntry: ConsoleLog = {
		type: 'MessageLog',
		time: time,
		message: event.payload.message,
	};
	currentSnapshot.state.console.push(logEntry);

	futures.forEach(snapshot => {
		snapshot.state.console.push({ ...logEntry });
		snapshot.state.console.sort((a, b) => a.time - b.time);
	})
}

function processCategorizeEvent(event: FullEvent<CategorizeEvent>) {
	const time = event.time;

	const objId = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId
	};
	const oKey = getObjectKey(objId);


	const next = findNextTargetedEvent(currentProcessedEvents, event, ['Categorize'], objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(humanSnapshots, objId, event.time, { before: next });

	let currentSnapshot: { time: number; state: HumanState; };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId)
		};
		humanSnapshots[oKey].unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env)
		}
		// register new snapshot
		humanSnapshots[oKey].splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	const category : Categorization = {
		category: event.payload.category,
		system: event.payload.system,
	}
	currentSnapshot.state.category = category;

	futures.forEach(snapshot => {
		snapshot.state.category = { ...category };
	})
}

function processHumanTreatmentEvent(event: FullEvent<HumanTreatmentEvent>) {

	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === "ActionBodyEffect") {
			worldLogger.log("Apply Item: ", { time: event.time, source: event.payload.source, action }, event);
			const effect = doItemActionOnHumanBody(source, action as ActionBodyEffect, event.payload.blocks, event.time);
			if (effect != null) {
				const health = getHealth(event.payload.targetId);
				health.effects.push(effect);
				healths[event.payload.targetId] = health;

				updateHumanSnapshots(event.payload.targetId, event.time);
			}
		} else {
			worldLogger.warn('Unhandled action type', action);
		}
	} else {
		worldLogger.warn(`Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`);
	}
}

function unreachable(x: never) {
	worldLogger.error("Unreachable ", x);
}

function processDirectCommunicationEvent(event: FullEvent<DirectCommunicationEvent>): void {

	// sender always gets his own messages
	//processMessageEvent(event, event.sender);

	//check distance between sender and player
	//TODO perform for all players (supposing a change of player)
	const time = event.time;

	//could be performed with all characters if the player can change character live
	const myHumanId = whoAmI();
	const myId = { objectId: myHumanId, objectType: 'Human' };
	const myPosition = getMostRecentSnapshot(locationsSnapshots, myId, time);

	const senderId = { objectId: event.payload.sender, objectType: 'Human' };
	const senderPosition = getMostRecentSnapshot(locationsSnapshots, senderId, time);

	let distanceSquared = Infinity;

	if (myPosition?.mostRecent?.state?.location && senderPosition?.mostRecent?.state?.location) {
		const vec = sub(myPosition.mostRecent.state.location, senderPosition.mostRecent.state.location);
		distanceSquared = norm(vec, vec);
	}

	worldLogger.debug("Computed distance : " + Math.sqrt(distanceSquared))
	if (distanceSquared < sqRadius) {
		processDirectMessageEvent(event, event.payload.sender);
	} else {
		worldLogger.warn(`Ignoring direct comm event(${event.id}), too far :  ${Math.sqrt(distanceSquared)}`)
	}
}

function processEvent(event: FullEvent<EventPayload>) {
	worldLogger.debug("ProcessEvent: ", event);

	const eType = event.payload.type;

	switch (eType) {
		case 'Teleport':
			processTeleportEvent(event as FullEvent<TeleportEvent>);
			break;
		case 'FollowPath':
			processFollowPathEvent(event as FullEvent<FollowPathEvent>);
			break;
		case 'HumanPathology':
			processPathologyEvent(event as FullEvent<PathologyEvent>);
			break;
		case 'HumanTreatment':
			processHumanTreatmentEvent(event as FullEvent<HumanTreatmentEvent>);
			break;
		case 'HumanMeasure':
			processHumanMeasureEvent(event as FullEvent<HumanMeasureEvent>);
			break;
		case 'Categorize':
			processCategorizeEvent(event as FullEvent<CategorizeEvent>);
			break;
		case 'HumanLogMessage':
			processHumanLogMessageEvent(event as FullEvent<HumanLogMessageEvent>);
			break;
		case 'DirectCommunication':
			processDirectCommunicationEvent(event as FullEvent<DirectCommunicationEvent>);
			break;
		case 'RadioCommunication':
			processRadioCommunication(event as FullEvent<RadioCommunicationEvent>);
			break;
		case 'RadioChannelUpdate':
			processRadioChannelUpdate(event as FullEvent<RadioChannelUpdateEvent>);
			break;
		case 'RadioCreation':
			processRadioCreationEvent(event as FullEvent<RadioCreationEvent>);
			break;
		case 'PhoneCommunication':
			processPhoneCommunication(event as FullEvent<PhoneCommunicationEvent>);
			break;
		case 'PhoneCreation':
			processPhoneCreation(event as FullEvent<PhoneCreationEvent>);
			break;
		default:
			unreachable(eType);
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

export function getHuman(id: string): (HumanBody & {
	category : Categorization | undefined
})| undefined {
	const human = worldState.humans[`Human::${id}`];
	const meta = humanMetas[id];
	if (human && meta) {
		return {
			meta,
			state: human.bodyState,
			category: human.category
		}
	}

	return undefined;
}

export function getHumanConsole(id: string): ConsoleLog[] {
	const human = worldState.humans[`Human::${id}`];

	if (human) {
		return human.console;
	}

	return [];
}

export function handleClickOnMap(point: Point): void {
	const myId = whoAmI();
	if (myId) {
		const objectId: ObjectId = { objectType: 'Human', objectId: myId };
		const destination: Location = { ...point, mapId: 'the_world' };
		const key = getObjectKey(objectId);
		const myState = worldState.humans[key];
		const currentLocation = myState?.location;
		worldLogger.info("HandleOn: ", { objectId, destination, currentLocation, myState });
		if (currentLocation != null) {
			// Move from current location to given point
			const from: Location = { ...currentLocation, mapId: 'the_world' };
			sendEvent({
				...initEmitterIds(),
				type: 'FollowPath',
				targetType: 'Human',
				targetId: myId,
				from: from,
				destination: destination,
			});
		} else {
			// No known location => Teleport
			sendEvent({
				...initEmitterIds(),
				type: 'Teleport',
				targetType: 'Human',
				targetId: myId,
				location: destination,
			});
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



