import { Point, add, sub, mul, proj, lengthSquared, length } from './point2D';

import {
	BlockName,
	BodyEffect,
	BodyState,
	BodyStateKeys,
	computeState,
	createHumanBody,
	doActionOnHumanBody,
	enableCoagulation,
	enableLungsVasoconstriction,
	enableVasoconstriction,
	Environnment,
	HumanBody,
	HumanMeta,
	readKey,
} from './HUMAn';
import {
	ActDefinition,
	ActionBodyEffect,
	ActionBodyMeasure,
	AfflictedPathology,
	HumanAction,
	ItemDefinition,
	RevivedPathology,
	revivePathology,
} from './pathology';
import { getAct, getItem, getPathology, setCompensationModel, setOverdriveModel, setSystemModel } from './registries';
import { getCurrentSimulationTime } from './TimeManager';
import {
	getBagDefinition,
	getBodyParam,
	getEnv,
	getMySkillDefinition,
	getHumanSkillLevelForAct,
	getHumanSkillLevelForItemAction,
	loadCompensationModel,
	loadSystem,
	whoAmI,
loadOverdriveModel,
} from './WegasHelper';
import { initEmitterIds, TargetedEvent } from './baseEvent';
import {
	DirectCommunicationEvent,
	RadioChannelUpdateEvent,
	RadioCreationEvent,
	RadioCommunicationEvent,
	PhoneCommunicationEvent,
	PhoneCreationEvent,
	processPhoneCreation,
	processDirectMessageEvent,
	processRadioChannelUpdate,
	processRadioCommunication,
	processRadioCreationEvent,
	processPhoneCommunication,
	clearAllCommunicationState,
} from './communication';
import { calculateLOS, isPointInPolygon } from './lineOfSight';
import { PathFinder } from './pathFinding';
import { convertMapUnitToMeter, convertMeterToMapUnit, obstacleGrids } from './layersData';
import { FullEvent, getAllEvents, sendEvent } from './EventManager';
import { Category, PreTriageResult, SystemName } from './triage';
import { getFogType, infiniteBags } from './gameMaster';
import { worldLogger, inventoryLogger, delayedLogger } from './logger';
import { SkillLevel } from './GameModelerHelper';

///////////////////////////////////////////////////////////////////////////
// Typings
///////////////////////////////////////////////////////////////////////////

export type Location = Point & {
	mapId: string;
};

export interface Located {
	location: Location | undefined;
	direction: Location | undefined;
}

export interface HumanHealth {
	pathologies: RevivedPathology[];
	effects: BodyEffect[];
}

type HumanHealthState = Record<string, HumanHealth>;

export type LocationState = Located & {
	type: 'Human';
	id: string;
	time: number;
	lineOfSight: Point[] | undefined;
};

interface BaseLog {
	time: number;
	emitterCharacterId: string;
}

type MessageLog = BaseLog & {
	type: 'MessageLog';
	message: string;
};

type MeasureLog = BaseLog & {
	type: 'MeasureLog';
	/**
	 * Key: metric name; value: measures value
	 */
	metrics: { metric: BodyStateKeys; value: unknown }[];
};

export type ConsoleLog = MessageLog | MeasureLog;

export interface Categorization {
	system: SystemName;
	category: Category<string>['id'];
	severity: number;
	autoTriage: PreTriageResult<string>;
}

export type Inventory = Record<string, number | 'infinity'>;

export interface BagDefinition {
	name: string;
	items: Inventory;
}

export interface HumanState {
	type: 'Human';
	id: string;
	time: number;
	bodyState: BodyState;
	console: ConsoleLog[];
	category: Categorization | undefined;
}

export interface WorldState {
	// id to human
	humans: Record<string, HumanState & LocationState>;
}

export type WorldObject = HumanState;

interface ObjectId {
	objectType: string;
	objectId: string;
}

interface PositionAtTime {
	time: number;
	location: Location | undefined;
	direction: Location | undefined;
}

// Update-to-date locations
// key is ObjectType::ObjectId
// last exact position is "location" at "time" (teleportation)
// current move is define by "direction"
export type PositionState = Record<string, undefined | (ObjectId & PositionAtTime)>;

/**
 * NONE: update everything, all the time
 * SIGHT: update only if visible (TODO: find the smarter way to compute position)
 * FULL: only update current player character (whoAmI)
 */
export type FogType = 'NONE' | 'SIGHT' | 'FULL';

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
export interface TeleportEvent extends TargetedEvent {
	type: 'Teleport';
	location: Location;
}

/** */
export interface PathologyEvent extends TargetedEvent, AfflictedPathology {
	type: 'HumanPathology';
}

interface HumanLogMessageEvent extends TargetedEvent {
	type: 'HumanLogMessage';
	message: string;
}

export type ActionSource =
	| {
			type: 'act';
			actId: string;
	  }
	| {
			type: 'itemAction';
			itemId: string;
			actionId: string;
	  };

interface HumanMeasureEvent extends TargetedEvent {
	type: 'HumanMeasure';
	source: ActionSource;
}

export interface HumanTreatmentEvent extends TargetedEvent {
	type: 'HumanTreatment';
	source: ActionSource;
	blocks: BlockName[];
}

export interface CancelActionEvent {
	type: 'CancelAction';
	eventId: number;
}

export interface CategorizeEvent extends TargetedEvent, Categorization {
	type: 'Categorize';
}

export interface GiveBagEvent extends TargetedEvent {
	type: 'GiveBag';
	bagId: string;
}

export interface ScriptedEvent {
	time: number;
	payload: PathologyEvent | HumanTreatmentEvent | TeleportEvent;
}

export type EventPayload =
	| FollowPathEvent
	| TeleportEvent
	| PathologyEvent
	| HumanTreatmentEvent
	| HumanMeasureEvent
	| HumanLogMessageEvent
	| CategorizeEvent
	| DirectCommunicationEvent
	| RadioCommunicationEvent
	| RadioChannelUpdateEvent
	| RadioCreationEvent
	| PhoneCommunicationEvent
	| PhoneCreationEvent
	| GiveBagEvent
	| CancelActionEvent;

export type EventType = EventPayload['type'];

interface Snapshot<T> {
	time: number;
	state: T;
}

type Snapshots<T> = Record<string, Snapshot<T>[]>;

export interface DelayedAction {
	id: number;
	dueDate: number;
	action: ResolvedAction;
	event: FullEvent<HumanTreatmentEvent | HumanMeasureEvent>;
}

///////////////////////////////////////////////////////////////////////////
// State & config
///////////////////////////////////////////////////////////////////////////

// const spatialIndex: PositionState = {};

const humanMetas: Record<string, HumanMeta> = {};

// object key to list of snapshots
let humanSnapshots: Snapshots<HumanState> = {};

let locationsSnapshots: Snapshots<LocationState> = {};

let inventoriesSnapshots: Snapshots<Inventory> = {};

/** current visible state */
const worldState: WorldState = {
	humans: {},
};

let healths: HumanHealthState = {};

let delayedActions: DelayedAction[] = [];

/**
 * Trace of processed events.
 * if id of message is in the map, event has already been processed
 */
let processedEvent: Record<number, boolean> = {};

let currentProcessedEvents: FullEvent<EventPayload>[] = [];

// const eventStore: EventStore = {};

//let fogType: FogType = 'NONE';

// TODO: line of sight:
export const lineOfSightRadius = 100;

const sqRadius = lineOfSightRadius * lineOfSightRadius;

///////////////////////////////////////////////////////////////////////////
// Helpers & Utils
///////////////////////////////////////////////////////////////////////////

function getObjectKey(object: ObjectId) {
	return object.objectType + '::' + object.objectId;
}

function rndInt(min: number, max: number) {
	const range = max - min;
	return Math.floor(Math.random() * range + min);
}

export const paths = Helpers.useRef<Record<string, Point[]>>('paths', {});

interface CurrentLocationOutput {
	location: Location;
	direction?: Location;
}

/**
 * speed: unit/sec
 */
function computeCurrentLocation(
	pathId: string,
	location: PositionAtTime | undefined,
	currentTime: number,
	speed: number,
): CurrentLocationOutput | undefined {
	// TODO multi map
	worldLogger.log('ComputeCurrentLocation', { location, currentTime, speed });
	if (location?.location != null) {
		if (location.direction != null) {
			// This should be done only when the obstacle grid changes
			const { grid, cellSize, offsetPoint, gridHeight, gridWidth } = obstacleGrids.current[location.location.mapId];

			const pathFinder = new PathFinder({
				grid: {
					matrix: grid,
					width: gridWidth,
					height: gridHeight,
				},
				cellSize,
				offsetPoint,
				heuristic: 'Octile',
				diagonalAllowed: true,
				useJumpPointSearch: true,
				maxComputationTimeMs: 1500,
				maxCoverageRatio: 0.1
			});

			// This should be done only when the direction changes
			const newPath = pathFinder.findPath(location.location, location.direction, 'AStarSmooth');
			paths.current[pathId] = newPath;

			const duration = currentTime - location.time;
			const distance = speed * duration;

			let remainingDistance_sq = distance * distance;
			let pathIndex = 1;
			let segStart: Point = location.location;
			let segEnd : Point = segStart;

			let destinationReached = false;

			paths.current['moving'] = [segStart];

			while (remainingDistance_sq > 0 && !destinationReached) {
				segEnd = newPath[pathIndex]!;
				// If we could run further than the last point of the path, stop at the end of the path
				// Also if the path has no length
				if (segEnd == null) {
					destinationReached = true;
					segEnd = segStart;
					break;
				}

				const delta = sub(segEnd, segStart);
				const segmentDistance_sq = lengthSquared(delta);
				if (remainingDistance_sq < segmentDistance_sq) {
					// distance still to walk is shorter than current segement distance
					const ratio = Math.sqrt(remainingDistance_sq / segmentDistance_sq);
					segEnd = add(mul(delta, ratio), segStart);
					paths.current['moving'].push(segEnd);
					break;
				} else {
					// walk the current segment fully and move to next segment
					remainingDistance_sq -= segmentDistance_sq;
					pathIndex += 1;
					segStart = segEnd;
					paths.current['moving'].push(segEnd);
				}
			}

			if (destinationReached) {
				delete paths.current[pathId];
				return {
					location: {
						mapId: location.location.mapId,
						...segEnd!,
					},
					direction: undefined,
				};
			} else {
				return {
					location: {
						mapId: location.location.mapId,
						...segEnd!,
					},
					direction: location.direction,
				};
			}
		} else {
			delete paths.current[pathId];
			return {
				location: location.location,
				direction: undefined,
			};
		}
	}
}

/**
 * TODO REMOVE ??
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
	const k =
		Math.abs(ab_Vector.x) > Math.abs(ab_Vector.y)
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
	return events.reduce<{ processed: FullEvent<EventPayload>[]; not: FullEvent<EventPayload>[] }>(
		(acc, cur) => {
			if (processedEvent[cur.id]) {
				acc.processed.push(cur);
			} else {
				acc.not.push(cur);
			}
			return acc;
		},
		{
			processed: [],
			not: [],
		},
	);
}

function mapLastLocationEventByObject(events: FullEvent<EventPayload>[]) {
	return events.reduce<Record<string, FullEvent<TeleportEvent | FollowPathEvent>>>((acc, event) => {
		if (event.payload.type === 'FollowPath' || event.payload.type === 'Teleport') {
			const key = getObjectKey({
				objectType: event.payload.targetType,
				objectId: event.payload.targetId,
			});
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

function findNextTargetedEvent(
	events: FullEvent<EventPayload>[],
	currentEvent: FullEvent<EventPayload>,
	eventTypes: EventType[],
	target: ObjectId,
): FullEvent<EventPayload> | undefined {
	const futureEvents = events.filter(event => {
		const cEvent = event.payload as Partial<TargetedEvent>;

		return (
			cEvent.targetType === target.objectType &&
			cEvent.targetId === target.objectId &&
			eventTypes.includes(event.payload.type) &&
			compareEvent(event, currentEvent) > 0
		);
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

	worldLogger.debug('Most recent location event', { mappedEvent });

	objectList.forEach(obj => {
		worldLogger.debug('Compute Location', { obj });
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
					direction: undefined,
				};
			}
			if (event.payload.type === 'FollowPath') {
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

	worldLogger.log('Create Human:');
	worldLogger.log(' ENV:', env);
	worldLogger.log(' Param:', bodyParam);
	worldLogger.log(' human: ', humanBody.state.vitals.glasgow.total);

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
 * get unit/s speed
 */
function getHumanSpeed() {
	return convertMeterToMapUnit(1.4); // 5 kph
}

/**
 * build state of the world at given time
 */
function rebuildState(time: number, env: Environnment) {
	worldLogger.debug('RebuildState', { time, env });
	worldLogger.debug('Humans', humanSnapshots);
	worldLogger.debug('Locations', locationsSnapshots);

	const fogType = getFogType();

	const objectList: ObjectId[] = Object.keys(humanSnapshots).map(key => {
		//const objectList: ObjectId[] = Object.keys(locationsSnapshots).map(key => {
		const [type, id] = key.split('::');
		return {
			objectId: id!,
			objectType: type!,
		};
	});

	// generate missing snapshot for time
	objectList.forEach(obj => {
		const oKey = getObjectKey(obj);
		worldLogger.info('Update ', obj, oKey);

		const humanS = getMostRecentSnapshot(humanSnapshots, obj, time);
		const positionS = getMostRecentSnapshot(locationsSnapshots, obj, time);

		if (positionS.mostRecent != null && positionS.mostRecent.time < time) {
			// most recent snapshot is in the past
			// -> Create a snapshot for the present time
			if (positionS.mostRecent.state.direction) {
				// Object is moving
				// TODO speed is dependent of HumanS
				const newLocation = computeCurrentLocation(
					oKey,
					positionS.mostRecent.state,
					time,
					getHumanSpeed(),
				);
				worldLogger.log('RebuildPosition: ', positionS, locationsSnapshots[oKey]);
				locationsSnapshots[oKey]!.splice(positionS.mostRecentIndex + 1, 0, {
					time: time,
					state: {
						...positionS.mostRecent.state,
						time: time,
						location: newLocation!.location,
						direction: newLocation!.direction,
						lineOfSight: undefined,
					},
				});
			}
		}

		if (humanS.mostRecent == null) {
			humanS.mostRecent = {
				time: 0,
				state: initHuman(obj.objectId),
			};
			humanSnapshots[oKey]!.unshift(humanS.mostRecent);
		}

		if (humanS.mostRecent != null && humanS.mostRecent.time < time) {
			//const humanState = Helpers.cloneDeep(humanS.mostRecent.state);
			const newState = computeHumanState(humanS.mostRecent.state, time, env);

			humanSnapshots[oKey]!.splice(humanS.mostRecentIndex + 1, 0, {
				time: time,
				state: newState,
			});

			worldLogger.debug('WorldState: ', humanSnapshots[oKey]);
		}
	});

	// update visible world
	const myHumanId = whoAmI();
	const myId = { objectId: myHumanId, objectType: 'Human' };
	const myPosition = getMostRecentSnapshot(locationsSnapshots, myId, time);

	//if (myPosition.mostRecent != null) {
	const visibles: ObjectId[] = [];
	let outOfSight: ObjectId[] = [];

	if (myPosition.mostRecent != null && myPosition.mostRecent?.state.lineOfSight == null) {
		myPosition.mostRecent.state.lineOfSight = calculateLOS(myPosition.mostRecent.state.location!);
	}

	const lineOfSight = myPosition.mostRecent?.state.lineOfSight!;

	if (fogType === 'NONE') {
		// no fog: update all objects
		visibles.push(...objectList);
	} else if (fogType === 'FULL' || myPosition.mostRecent == null) {
		// Full fog: update current human only
		visibles.push({
			objectType: 'Human',
			objectId: myHumanId,
		});
		outOfSight = objectList.filter(o => {
			o.objectType != 'Human';
		});
	} else if (fogType === 'SIGHT') {
		// Detect visible object
		worldLogger.info('My Position', myPosition);
		Object.keys(locationsSnapshots).forEach(key => {
			const [type, id] = key.split('::');
			const oId = { objectType: type!, objectId: id! };
			const { mostRecent } = getMostRecentSnapshot(locationsSnapshots, oId, time);
			if (mostRecent != null && isPointInPolygon(mostRecent.state.location, lineOfSight)) {
				visibles.push(oId);
			} else {
				outOfSight.push(oId);
			}
		});
	}

	worldLogger.info('Visible', visibles);
	worldLogger.info('OutOfSight', outOfSight);

	visibles.forEach(oId => {
		const key = getObjectKey(oId);
		const location = getMostRecentSnapshot(locationsSnapshots, oId, time);
		const human = getMostRecentSnapshot(humanSnapshots, oId, time);
		worldLogger.debug('Visible@Location', key, location.mostRecent);
		worldLogger.debug('Visible@Human', key, human.mostRecent);

		if (location.mostRecent != null && human.mostRecent != null) {
			worldState.humans[key] = {
				...human.mostRecent.state,
				...location.mostRecent.state,
			};
		}
	});

	// make sure out-of-sight object or not visible
	worldLogger.info('InMemoryWorld: ', worldState);
	outOfSight.forEach(obj => {
		const oKey = getObjectKey(obj);
		//const objSpatialIndex = spatialIndex[oKey];
		const current = obj.objectType === 'Human' ? worldState.humans[oKey] : undefined;

		worldLogger.info('OutOfSight: last known position: ', current);
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
				} else if (isPointInPolygon(current.location, lineOfSight)) {
					// Last known location was here but object is not here any longer
					current.location = undefined;
					current.direction = undefined;
				}
			}
		}
	});
	//}
}

function getMostRecentSnapshot<T>(
	snapshots: Snapshots<T>,
	obj: ObjectId,
	time: number,
	options: {
		strictTime?: boolean;
		before?: FullEvent<EventPayload>;
	} = {},
): {
	mostRecent: Snapshot<T> | undefined;
	mostRecentIndex: number;
	futures: Snapshot<T>[];
} {
	const oKey = getObjectKey(obj);

	worldLogger.info('Update ', obj, oKey);

	let futures: Snapshot<T>[] = [];
	let index = -1;

	const oSnapshots = snapshots[oKey];

	let snapshot: Snapshot<T> | undefined = undefined;

	if (oSnapshots != null) {
		// find most recent snapshot
		for (let i = oSnapshots.length - 1; i >= 0; i--) {
			if (!!options.strictTime ? oSnapshots[i]!.time < time : oSnapshots[i]!.time <= time) {
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
		worldLogger.info('No Snapshot: init');
		// snapshot = { state: initObject<T>(obj), time: 0 };
	} else {
		worldLogger.info('Snapshot found at time ', snapshot.time);
	}
	if (options.before) {
		futures = futures.filter(e => e.time < options.before!.time);
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
	if (meta == null) {
		throw `Unable to find meta for ${state.id}`;
	}
	const newState = Helpers.cloneDeep(state);

	const from = state.bodyState.time;

	const health = healths[state.id] || { effects: [], pathologies: [] };
	for (let i = from + stepDuration; i <= to; i += stepDuration) {
		worldLogger.log('Compute Human Step ', { currentTime: newState.time, stepDuration, health });
		computeState(newState.bodyState, meta, env, stepDuration, health.pathologies, health.effects);
		worldLogger.debug('Step Time: ', newState.bodyState.time);
	}

	// last tick
	if (newState.time < to) {
		worldLogger.log('Compute Human Step ', {
			currentTime: newState.time,
			stepDuration: to - newState.bodyState.time,
			health,
		});
		computeState(
			newState.bodyState,
			meta,
			env,
			to - newState.bodyState.time,
			health.pathologies,
			health.effects,
		);
	}
	newState.time = newState.bodyState.time;
	worldLogger.debug('FinalStateTime: ', newState.time);
	return newState;
}

function processTeleportEvent(event: FullEvent<TeleportEvent>): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.payload.targetType, objectId: event.payload.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextTargetedEvent(
		currentProcessedEvents,
		event,
		['FollowPath', 'Teleport'],
		objId,
	);

	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		locationsSnapshots,
		objId,
		event.time,
		{ before: next },
	);

	let currentSnapshot: { time: number; state: LocationState };

	if (mostRecent == null || mostRecent.time < event.time) {
		currentSnapshot = {
			time: event.time,
			state: {
				type: event.payload.targetType,
				id: event.payload.targetId,
				time: event.time,
				location: event.payload.location,
				direction: undefined,
				lineOfSight: undefined,
			},
		};
		// register new snapshot
		worldLogger.debug('Teleport: ', locationsSnapshots[oKey]);
		locationsSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.payload.location;
		currentSnapshot.state.direction = undefined;
		currentSnapshot.state.lineOfSight = undefined;
	}

	// Update futures
	futures.forEach(snapshot => {
		snapshot.state.location = event.payload.location;
		snapshot.state.direction = undefined;
		snapshot.state.lineOfSight = undefined;
	});

	return false;
}

function processFollowPathEvent(event: FullEvent<FollowPathEvent>): boolean {
	// TODO: is object an obstacle ?
	const objId = { objectType: event.payload.targetType, objectId: event.payload.targetId };
	const oKey = getObjectKey(objId);

	const next = findNextTargetedEvent(
		currentProcessedEvents,
		event,
		['FollowPath', 'Teleport'],
		objId,
	);

	// TODO: update location state between current
	const { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		locationsSnapshots,
		objId,
		event.time,
		{ before: next },
	);

	let currentSnapshot: { time: number; state: LocationState };

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
				lineOfSight: undefined,
			},
		};
		// register snapshot
		worldLogger.debug('FollowPath: ', locationsSnapshots[oKey]);
		locationsSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
		currentSnapshot.state.location = event.payload.from;
		currentSnapshot.state.direction = event.payload.destination;
		currentSnapshot.state.lineOfSight = undefined;
	}

	// Update futures
	futures.forEach(snapshot => {
		const loc = computeCurrentLocation(oKey, currentSnapshot.state, snapshot.time, getHumanSpeed());

		worldLogger.log('Update Future: ', { snapshot, loc });
		snapshot.state.location = loc?.location;
		snapshot.state.direction = loc?.direction;
		snapshot.state.lineOfSight = undefined;
	});
	return false;
}

function updateHumanSnapshots(humanId: string, time: number) {
	// Update HUMAn body states
	const objId = { objectType: 'Human', objectId: humanId };
	const oKey = getObjectKey(objId);

	const env = getEnv();
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		humanSnapshots,
		objId,
		time,
		//{ strictTime: true },
	);

	let currentSnapshot: { time: number; state: HumanState };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId),
		};
		humanSnapshots[oKey]!.unshift(mostRecent);
	}
	worldLogger.log('Update human snapshot', oKey, { mostRecent, futures });
	if (mostRecent.time < time) {
		// catch-up human state
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env),
		};
		// register new snapshot
		worldLogger.log('Update human snapshot at time ', time);
		humanSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}
	// Update futures
	futures.forEach(snapshot => {
		worldLogger.log('Update future human snapshot at time ', snapshot.time);
		const state = Helpers.cloneDeep(currentSnapshot.state);
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
		worldLogger.log('Afflict Pathology: ', { pathology, time: event.time });
		//const meta = humanMetas[event.targetId];

		try {
			// push pathology in human health state
			const p = revivePathology(event.payload, event.time);
			//const p = afflictPathology(pathology, event.time, event.payload.blocks);

			const health = getHealth(event.payload.targetId);
			health.pathologies.push(p);
			healths[event.payload.targetId] = health;

			updateHumanSnapshots(event.payload.targetId, event.time);
		} catch (error) {
			worldLogger.error(error);
		}
	} else {
		worldLogger.info(
			`Afflict Pathology Failed: Pathology "${event.payload.pathologyId}" does not exist`,
		);
	}
}

function isActionBodyEffect(action: HumanAction | undefined): action is ActionBodyEffect {
	return action?.type === 'ActionBodyEffect';
}

function isMeasureAction(action: HumanAction | undefined): action is ActionBodyMeasure {
	return action?.type === 'ActionBodyMeasure';
}

export interface ResolvedAction {
	source: ActDefinition | ItemDefinition;
	action: ActionBodyEffect | ActionBodyMeasure;
}

export function resolveAction(event: HumanTreatmentEvent | HumanMeasureEvent): ResolvedAction | undefined {
	if (event.source.type === 'act') {
		const act = getAct(event.source.actId);
		const action = act?.action;
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			return {
				source: { ...act!, type: 'act' },
				action: action,
			};
		}
	} else if (event.source.type === 'itemAction') {
		const item = getItem(event.source.itemId);
		const action = item?.actions[event.source.actionId];
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			return {
				source: { ...item!, type: 'item' },
				action: action,
			};
		}
	}

	return undefined;
}

function doMeasure(
	time: number,
	source: ItemDefinition | ActDefinition,
	action: ActionBodyMeasure,
	fEvent: FullEvent<HumanMeasureEvent>,
) {
	const name = action.name;
	const metrics = action.metricName;

	const event = fEvent.payload;
	const objId = {
		objectType: event.targetType,
		objectId: event.targetId,
	};
	const oKey = getObjectKey(objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		humanSnapshots,
		objId,
		fEvent.time,
	);

	let currentSnapshot: { time: number; state: HumanState };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId),
		};
		humanSnapshots[oKey]!.unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env),
		};
		// register new snapshot
		humanSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	const body = currentSnapshot.state.bodyState;

	const values: MeasureLog['metrics'] = metrics.map(metric => {
		return {
			metric,
			value: readKey(body, metric),
		};
	});

	const logEntry: MeasureLog = {
		type: 'MeasureLog',
		time: time,
		emitterCharacterId: event.emitterCharacterId,
		metrics: values,
	};
	currentSnapshot.state.console.push(logEntry);

	futures.forEach(snapshot => {
		snapshot.state.console.push({ ...logEntry });
		snapshot.state.console.sort((a, b) => a.time - b.time);
	});
}

function checkItemAvailabilityAndConsume(
	time: number,
	ownerId: ObjectId,
	item: ItemDefinition,
	patientId: string,
): boolean {
	const inventory = getInventory(time, ownerId);
	const count = inventory[item.id];
	inventoryLogger.info('Check Item availability', { time, ownerId, item: item.id });

	if (count == null) {
		// character do not own such item;
		inventoryLogger.info('Owner do not have any');
		addLogMessage(ownerId.objectId, patientId, time, `You do not have any ${item.name}`);
		return false;
	} else if (typeof count === 'number') {
		if (count > 0) {
			inventoryLogger.info('Owner owns an item');
			if (item.disposable) {
				// item is diposable: consume one
				inventoryLogger.info('item is disposable: consume one');
				updateInventoriesSnapshots(ownerId, time, { [item.id]: -1 });
			}
			return true;
		} else {
			// no more item
			inventoryLogger.info('Owner do not have any item any longer');
			addLogMessage(ownerId.objectId, patientId, time, `You do not have any ${item.name}`);
			return false;
		}
	} else {
		//  infinity never decreases
		inventoryLogger.info('Infinity');
		return true;
	}
}

function getPendingActions(): DelayedAction[] {
	const currentTime = getCurrentSimulationTime();

	return delayedActions.filter(dA => dA.event.time <= currentTime && dA.dueDate > currentTime);
}

export function getMyPendingActions(): DelayedAction[] {
	const me = whoAmI();
	const pa = getPendingActions();
	const mine = pa.filter(dA => dA.event.payload.emitterCharacterId === me);
	return mine;
}

function processCancelActionEvent(event: FullEvent<CancelActionEvent>) {
	delayedLogger.info('Cancel delayed action');
	const eventId = event.payload.eventId;

	/**
	 * drop all pendings actions which patch the given eventId
	 * Bonus: send log to patient console
	 */
	delayedActions = delayedActions.filter(dA => {
		if (dA.event.id === eventId) {
			addLogMessage(
				dA.event.payload.emitterCharacterId,
				dA.event.payload.targetId,
				event.time,
				`Cancel ${getResolvedActionDisplayName(dA.action)}`,
			);
			return false;
		} else {
			return true;
		}
	});
}

function getDelayedActionToProcess(time: number): DelayedAction[] {
	return delayedActions.filter(dA => dA.dueDate <= time);
}

function clearPastActions(time: number) {
	delayedActions = delayedActions.filter(dA => dA.dueDate > time);
}

function processDelayedAction({ dueDate, action, event }: DelayedAction) {
	delayedLogger.info('Process Delayed Action', { dueDate, action, event });
	if (event.payload.type === 'HumanMeasure' && action.action.type === 'ActionBodyMeasure') {
		doMeasure(dueDate, action.source, action.action, event as FullEvent<HumanMeasureEvent>);
	} else if (event.payload.type === 'HumanTreatment' && action.action.type === 'ActionBodyEffect') {
		doTreatment(dueDate, action, event as FullEvent<HumanTreatmentEvent>);
	} else {
		worldLogger.error('Unknwon delayed action', action, event);
	}
}

function processDelayedActions(time: number) {
	getDelayedActionToProcess(time).forEach(da => {
		processDelayedAction(da);
	});
	clearPastActions(time);
}

export function getResolvedActionDisplayName(action: ResolvedAction): string {
	if (action.source.type === 'act' || Object.keys(action.source.actions).length <= 1) {
		return action.source.name;
	} else {
		return `${action.source.name}::${action.action.name}`;
	}
}

function delayAction(
	dueDate: number,
	action: ResolvedAction,
	event: FullEvent<HumanTreatmentEvent | HumanMeasureEvent>,
) {
	const dA: DelayedAction = { id: event.id, dueDate, action, event };
	addLogMessage(
		event.payload.emitterCharacterId,
		event.payload.targetId,
		event.time,
		`Start ${getResolvedActionDisplayName(dA.action)}`,
	);
	delayedActions.push(dA);
}

function getHumanSkillLevelForAction(
	humanId: string,
	action: ActionSource,
): SkillLevel | undefined {
	if (action.type === 'act') {
		return getHumanSkillLevelForAct(humanId, action.actId);
	} else {
		return getHumanSkillLevelForItemAction(humanId, action.itemId, action.actionId);
	}
}

function processHumanMeasureEvent(event: FullEvent<HumanMeasureEvent>) {
	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === 'ActionBodyMeasure') {
			if (source.type === 'item') {
				const characterId: ObjectId = {
					objectType: 'Human',
					objectId: event.payload.emitterCharacterId,
				};
				if (
					checkItemAvailabilityAndConsume(
						event.time,
						characterId,
						source,
						event.payload.targetId,
					) === false
				) {
					return;
				}
			}

			worldLogger.log(
				'Do Measure: ',
				{ time: event.time, source: event.payload.source, action },
				event,
			);

			const skillLevel = getHumanSkillLevelForAction(
				event.payload.emitterCharacterId,
				event.payload.source,
			);
			if (skillLevel) {
				const duration = action.duration[skillLevel];
				if (duration > 0) {
					delayAction(event.time + duration, resolvedAction, event);
				} else {
					doMeasure(event.time, source, action as ActionBodyMeasure, event);
				}
			} else {
				addLogMessage(
					event.payload.emitterCharacterId,
					event.payload.targetId,
					event.time,
					`You don't know how to measure ${getResolvedActionDisplayName(resolvedAction)}`,
				);
			}
		} else {
			worldLogger.warn('Unhandled action type', action);
		}
	} else {
		worldLogger.warn(
			`Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`,
		);
	}
}

function addLogEntry(objId: ObjectId, logEntry: ConsoleLog, time: number) {
	const oKey = getObjectKey(objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(humanSnapshots, objId, time);

	let currentSnapshot: { time: number; state: HumanState };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId),
		};
		humanSnapshots[oKey]!.unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env),
		};
		// register new snapshot
		humanSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	currentSnapshot.state.console.push(logEntry);

	futures.forEach(snapshot => {
		snapshot.state.console.push({ ...logEntry });
		snapshot.state.console.sort((a, b) => a.time - b.time);
	});
}

/**
 * Quick way to add some message to some patient console
 */
function addLogMessage(emitterId: string, patientId: string, time: number, message: string) {
	addLogEntry(
		{
			objectType: 'Human',
			objectId: patientId,
		},
		{
			type: 'MessageLog',
			time,
			emitterCharacterId: emitterId,
			message,
		},
		time,
	);
}

function processHumanLogMessageEvent(event: FullEvent<HumanLogMessageEvent>) {
	const time = event.time;

	const objId = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId,
	};

	const logEntry: ConsoleLog = {
		type: 'MessageLog',
		time: time,
		emitterCharacterId: event.payload.emitterCharacterId,
		message: event.payload.message,
	};

	addLogEntry(objId, logEntry, time);
}

function processCategorizeEvent(event: FullEvent<CategorizeEvent>) {
	const time = event.time;
	const objId = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId,
	};
	const oKey = getObjectKey(objId);

	const next = findNextTargetedEvent(currentProcessedEvents, event, ['Categorize'], objId);

	// Fetch most recent human snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		humanSnapshots,
		objId,
		event.time,
		{ before: next },
	);

	let currentSnapshot: { time: number; state: HumanState };

	if (mostRecent == null) {
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId),
		};
		humanSnapshots[oKey]!.unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		currentSnapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env),
		};
		// register new snapshot
		humanSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	const category: Categorization = {
		category: event.payload.category,
		system: event.payload.system,
		autoTriage: event.payload.autoTriage,
		severity: event.payload.severity,
	};
	currentSnapshot.state.category = category;

	futures.forEach(snapshot => {
		snapshot.state.category = { ...category };
	});
}

/**
 * apply treatment at given time
 */
function doTreatment(
	time: number,
	{ source, action }: ResolvedAction,
	event: FullEvent<HumanTreatmentEvent>,
) {
	worldLogger.log('Do Treatment ', { time: time, source: source, action });
	const effect = doActionOnHumanBody(
		source,
		action as ActionBodyEffect,
		event.payload.blocks,
		time,
	);
	if (effect != null) {
		const health = getHealth(event.payload.targetId);
		health.effects.push(effect);
		healths[event.payload.targetId] = health;
		updateHumanSnapshots(event.payload.targetId, time);
	}
}

function processHumanTreatmentEvent(event: FullEvent<HumanTreatmentEvent>) {
	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === 'ActionBodyEffect') {
			if (source.type === 'item') {
				const characterId: ObjectId = {
					objectType: 'Human',
					objectId: event.payload.emitterCharacterId,
				};

				if (
					checkItemAvailabilityAndConsume(
						event.time,
						characterId,
						source,
						event.payload.targetId,
					) === false
				) {
					return;
				}
			}

			const skillLevel = getHumanSkillLevelForAction(
				event.payload.emitterCharacterId,
				event.payload.source,
			);
			if (skillLevel) {
				const duration = action.duration[skillLevel];
				if (duration > 0) {
					// delay event
					delayAction(event.time + duration, resolvedAction, event);
				} else {
					doTreatment(event.time, resolvedAction, event);
				}
			} else {
				addLogMessage(
					event.payload.emitterCharacterId,
					event.payload.targetId,
					event.time,
					`You don't know how to do this (${getResolvedActionDisplayName(resolvedAction)})`,
				);
			}
		} else {
			worldLogger.warn('Unhandled action type', action);
		}
	} else {
		worldLogger.warn(
			`Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`,
		);
	}
}

function unreachable(x: never) {
	worldLogger.error('Unreachable ', x);
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
		distanceSquared = lengthSquared(vec);
	}

	//worldLogger.debug('Computed distance : ' + Math.sqrt(distanceSquared));
	if (distanceSquared < sqRadius) {
		processDirectMessageEvent(event, event.payload.sender);
	} else {
		// worldLogger.warn(
		// 	`Ignoring direct comm event(${event.id}), too far :  ${Math.sqrt(distanceSquared)}`,
		// );
	}
}

function updateInventory(inventory: Inventory, from: Inventory) {
	const forceInfinity = infiniteBags();

	Object.entries(from).forEach(([itemId, count]) => {
		inventoryLogger.log('Give ', count, ' ', itemId);
		if (forceInfinity || count === 'infinity') {
			// new count will always equals infinity
			inventoryLogger.info(' to infinity');
			inventory[itemId] = 'infinity';
		} else if (typeof count === 'number') {
			const currentCount = inventory[itemId];
			if (currentCount == null) {
				// init item to count
				inventory[itemId] = count;
				inventoryLogger.info('Init to', inventory[itemId]);
			} else if (typeof currentCount === 'number') {
				inventory[itemId] = currentCount + count;
				inventoryLogger.info('New count', inventory[itemId]);
			} /* else {
				was infinity: do not touch
			}*/
		}
	});
}

/**
 * give owner the content of the given inventery at the given time
 */
function updateInventoriesSnapshots(owner: ObjectId, time: number, inventory: Inventory) {
	const oKey = getObjectKey(owner);

	// Fetch most recent snapshot
	let { mostRecent, mostRecentIndex, futures } = getMostRecentSnapshot(
		inventoriesSnapshots,
		owner,
		time,
	);

	let currentSnapshot: { time: number; state: Inventory };

	if (mostRecent == null) {
		mostRecent = {
			time: time,
			state: {},
		};
		inventoriesSnapshots[oKey]!.unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		currentSnapshot = {
			time: time,
			state: { ...mostRecent.state },
		};
		// register new snapshot
		inventoriesSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, currentSnapshot);
	} else {
		// update mostRecent snapshot in place
		currentSnapshot = mostRecent;
	}

	updateInventory(currentSnapshot.state, inventory);

	futures.forEach(snapshot => {
		updateInventory(snapshot.state, inventory);
	});
}

function processGiveBagEvent(event: FullEvent<GiveBagEvent>) {
	const owner = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId,
	};

	const bag = getBagDefinition(event.payload.bagId);

	worldLogger.info('Process Give Bag Event', { owner, bag });

	if (bag != null) {
		updateInventoriesSnapshots(owner, event.time, bag.items);
	}
}

function processEvent(event: FullEvent<EventPayload>) {
	worldLogger.debug('ProcessEvent: ', event);

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
		case 'GiveBag':
			processGiveBagEvent(event as FullEvent<GiveBagEvent>);
			break;
		case 'CancelAction':
			processCancelActionEvent(event as FullEvent<CancelActionEvent>);
			break;
		default:
			unreachable(eType);
	}
	processedEvent[event.id] = true;
}

export function syncWorld() {
	worldLogger.log('Sync World');
	//updateInSimCurrentTime();
	const time = getCurrentSimulationTime();

	const allEvents = getAllEvents();
	const events = filterOutFutureEvents(allEvents, time);
	const mappedEvents = extractNotYetProcessedEvents(events);
	const eventsToProcess = mappedEvents.not;
	currentProcessedEvents = mappedEvents.processed;

	worldLogger.debug('ToProcess', eventsToProcess);

	const env = getEnv();

	const sortedEvents = eventsToProcess.sort(compareEvent);

	sortedEvents.forEach(e => processEvent(e));

	processDelayedActions(time);

	rebuildState(time, env);
}

export function getInstantiatedHumanIds() {
	return Object.values(worldState.humans).map(h => h.id);
}

export function getHumans() {
	return Object.values(worldState.humans).map(h => ({
		id: h.id,
		location: h.location,
		direction: h.direction,
		lineOfSight: h.lineOfSight,
	}));
}

export function getHuman(id: string):
	| (HumanBody & {
			category: Categorization | undefined;
	  })
	| undefined {
	const human = worldState.humans[`Human::${id}`];
	const meta = humanMetas[id];
	if (human && meta) {
		return {
			meta,
			state: human.bodyState,
			category: human.category,
		};
	}

	return undefined;
}

export function getHumanConsole(id: string): ConsoleLog[] {
	const myId = whoAmI();
	const human = worldState.humans[`Human::${id}`];

	if (human) {
		return human.console.filter(log => log.emitterCharacterId === myId);
	}

	return [];
}

export function handleClickOnMap(
	point: Point,
	features: { features: Record<string, unknown>; layerId?: string }[],
): void {
	const myId = whoAmI();
	if (myId) {
		const objectId: ObjectId = { objectType: 'Human', objectId: myId };
		const key = getObjectKey(objectId);
		const myState = worldState.humans[key];
		const currentLocation = myState?.location;
		const mapId = currentLocation ? currentLocation.mapId : '';
		const destination: Location = { ...point, mapId};//, mapId: 'yverdon' };

		worldLogger.info('HandleOn: ', { objectId, destination, currentLocation, myState });
		if (currentLocation != null && currentLocation.x != 0 && currentLocation.y != 0) {
			// Move from current location to given point
			const from: Location = { ...currentLocation};
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



export function setMapIdForPlayer(mapId: string): void {

	const myId = whoAmI();

	if(myId){
		sendEvent({
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: myId,
			location: {
				mapId: mapId,
				x: 0,
				y: 0
			},
		});
	}
	
}


/**
 * Get the distance between two human, in meters.
 */
export function getDistanceBetweenHumans(h1: string | undefined, h2: string | undefined): number {
	if (h1 && h2) {
		const time = getCurrentSimulationTime();
		const h1Key: ObjectId = { objectType: 'Human', objectId: h1 };
		const h2Key: ObjectId = { objectType: 'Human', objectId: h2 };
		const h1Loc = getMostRecentSnapshot(locationsSnapshots, h1Key, time);
		const h2Loc = getMostRecentSnapshot(locationsSnapshots, h2Key, time);

		if (h1Loc.mostRecent?.state.location == null || h2Loc.mostRecent?.state.location == null) {
			return Infinity;
		} else {
			if (h1Loc.mostRecent.state.location.mapId === h2Loc.mostRecent.state.location.mapId) {
				const vector = sub(h1Loc.mostRecent.state.location, h2Loc.mostRecent.state.location);
				return convertMapUnitToMeter(length(vector));
			} else {
				return Infinity;
			}
		}
	} else {
		return Infinity;
	}
}

export function goToHuman(humanId: string) {
	const myId = whoAmI();

	const time = getCurrentSimulationTime();
	const myKey: ObjectId = { objectType: 'Human', objectId: myId };
	const h1Key: ObjectId = { objectType: 'Human', objectId: humanId };

	const myLoc = getMostRecentSnapshot(locationsSnapshots, myKey, time);
	const h1Loc = getMostRecentSnapshot(locationsSnapshots, h1Key, time);

	if (myLoc.mostRecent?.state.location != null && h1Loc.mostRecent?.state.location != null) {
		sendEvent({
			...initEmitterIds(),
			type: 'FollowPath',
			targetType: 'Human',
			targetId: myId,
			from: myLoc.mostRecent.state.location,
			destination: h1Loc.mostRecent.state.location,
		});
	}
}

export function isCurrentPatientCloseEnough(): boolean {
	const myId = whoAmI();
	const patientId = getCurrentPatientId();
	return getDistanceBetweenHumans(myId, patientId) < 2;
}

export function getCurrentPatientId() {
	return I18n.toString(Variable.find(gameModel, 'currentPatient'));
}

export function getCurrentPatientBody() {
	return getHuman(getCurrentPatientId());
}

export function getCurrentPatientHealth(): HumanHealth | undefined {
	return getHealth(getCurrentPatientId());
}

export function getInventory(time: number, objectId: ObjectId): Inventory {
	const state = getMostRecentSnapshot(inventoriesSnapshots, objectId, time);
	if (state.mostRecent != null) {
		return state.mostRecent.state;
	} else {
		return {};
	}
}

/**
 * Get current character inventory.
 *
 * TODO Event to manage inventory (Got/Consume/Transfer)
 */
export function getMyInventory(): Inventory {
	const time = getCurrentSimulationTime();

	const myHumanId = whoAmI();
	const myId = { objectId: myHumanId, objectType: 'Human' };

	return getInventory(time, myId);
}

/**
 * According to its skills, get all medical act available to current character
 */
export function getMyMedicalActs(): ActDefinition[] {
	const skill = getMySkillDefinition();

	return Object.entries(skill.actions || {}).flatMap(([actionId]) => {
		if (actionId.startsWith('act::')) {
			const actId = actionId.split('::')[1];
			const act = getAct(actId);

			if (act) {
				return [act];
			} else {
				return [];
			}
		} else {
			return [];
		}
	});
}

export function clearState() {
	processedEvent = {};
	humanSnapshots = {};
	locationsSnapshots = {};
	worldState.humans = {};
	inventoriesSnapshots = {};
	healths = {};
	delayedActions = [];
	clearAllCommunicationState();
}

Helpers.registerEffect(() => {
	// Load model configuration
	enableVasoconstriction(Variable.find(gameModel, 'vasoconstriction').getValue(self));
	enableCoagulation(Variable.find(gameModel, 'coagulation').getValue(self));
	enableLungsVasoconstriction(Variable.find(gameModel, 'vasoconstrictionLungs').getValue(self));

	const system = loadSystem();
	worldLogger.log('(Init Sympathetic System: ', system);
	setSystemModel(system);

	const compensation = loadCompensationModel();
	worldLogger.log('Load Compensation Profile: ', compensation);
	setCompensationModel(compensation);

	const overdrive= loadOverdriveModel();
	worldLogger.info('Overdrive Profile: ', overdrive);
	setOverdriveModel(overdrive);

	clearState();

	return () => {
		clearState();
	};
});
