import { Point, add, sub, mul, lengthSquared, length } from '../../map/point2D';

import {
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
} from '../../HUMAn/human';
import {
	ActDefinition,
	ActionBodyEffect,
	ActionBodyMeasure,
	HumanAction,
	ItemDefinition,
	RevivedPathology,
	revivePathology,
} from '../../HUMAn/pathology';
import {
	getAct,
	getItem,
	getPathology,
} from '../../HUMAn/registries';
import { fastForward, getCurrentSimulationTime } from './TimeManager';
import {
	getBagDefinition,
	getBodyParam,
	getEnv,
	getHumanSkillLevelForAct,
	getHumanSkillLevelForItemAction,
	whoAmI,
} from '../../tools/WegasHelper';
import { initEmitterIds, TargetedEvent } from '../common/events/baseEvent';
import {
	processPhoneCreation,
	processDirectMessageEvent,
	processRadioChannelUpdate,
	processRadioCommunication,
	processRadioCreationEvent,
	processPhoneCommunication,
	clearAllCommunicationState,
} from './communication';
import { calculateLOS, isPointInPolygon } from '../../map/lineOfSight';
import { PathFinder } from '../../map/pathFinding';
import { convertMapUnitToMeter, convertMeterToMapUnit, obstacleGrids } from '../../map/layersData';
import { compareEvent, FullEvent, getAllEvents, sendEvent } from '../common/events/eventUtils';
import { Categorization } from '../pretri/triage';
import {
	getFogType,
	infiniteBags,
	isInterfaceDisabled,
} from './gameMaster';
import { worldLogger, inventoryLogger, delayedLogger, extraLogger } from '../../tools/logger';
import { SkillLevel } from '../../edition/GameModelerHelper';
import {
	getActTranslation,
	getItemActionTranslation,
	getItemTranslation,
	getTranslation,
} from '../../tools/translation';
import { AgingEvent, CancelActionEvent, CategorizeEvent, DelayedAction, DirectCommunicationEvent, EventPayload, EventType, FollowPathEvent, FreezeEvent, GiveBagEvent, HumanLogMessageEvent, HumanMeasureEvent, HumanMeasureResultEvent, HumanTreatmentEvent, PathologyEvent, PhoneCommunicationEvent, PhoneCreationEvent, RadioChannelUpdateEvent, RadioCommunicationEvent, RadioCreationEvent, TeleportEvent } from '../common/events/eventTypes';
import { Location, LocationState, PositionAtTime } from '../../map/locationTypes';
import { MeasureMetric } from '../../HUMAn/registry/acts';
import { ConsoleLog, MeasureLog, TreatmentLog } from '../pretri/consoleLog';


///////////////////////////////////////////////////////////////////////////
// Typings
///////////////////////////////////////////////////////////////////////////


export interface HumanHealth {
	pathologies: RevivedPathology[];
	effects: BodyEffect[];
}

type HumanHealthState = Record<string, HumanHealth>;

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
	frozen: boolean;
}

export interface WorldState {
	// id to human
	humans: Record<string, { id: string; human?: HumanState; location?: LocationState }>;
}

interface ObjectId {
	objectType: string;
	objectId: string;
}

export function findNextTargetedEvent(
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
 * NONE: update everything, all the time
 * SIGHT: update only if visible (TODO: find the smarter way to compute position)
 * FULL: only update current player character (whoAmI)
 */
export type FogType = 'NONE' | 'SIGHT' | 'FULL';

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


interface Snapshot<T> {
	time: number;
	state: T;
}

type Snapshots<T> = Record<string, Snapshot<T>[]>;



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
	worldLogger.log('ComputeCurrentLocation', { location, currentTime, speed });
	if (location?.location != null) {
		if (location.direction != null) {
			const obstacleGrid = obstacleGrids.current[location.location.mapId];
			if (obstacleGrid) {
				const { grid, cellSize, offsetPoint, gridHeight, gridWidth } = obstacleGrid;

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
					maxCoverageRatio: 0.1,
				});

				// This should be done only when the direction changes
				const newPath = pathFinder.findPath(location.location, location.direction, 'AStarSmooth');
				paths.current[pathId] = newPath;

				const duration = currentTime - location.time;
				const distance = speed * duration;

				let remainingDistance_sq = distance * distance;
				let pathIndex = 1;
				let segStart: Point = location.location;
				let segEnd: Point = segStart;

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
				// almost impossible case: the map does not exists
				return {
					location: location.location,
					direction: undefined,
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

function filterOutFutureEvents(events: FullEvent<EventPayload>[], time: number) {
	return events.filter(ev => ev.time <= time);
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

function initHuman(humanId: string): HumanState {
	const env = getEnv();
	const bodyParam = getBodyParam(humanId);
	if (!bodyParam) {
		throw `InitHuman: No body param for humanId "${humanId}"`;
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
		frozen: false,
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

	// TODO if fogType is full, ignore events related to other human than `whoAmI`

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
			extraLogger.log("Human ", oKey);
			const newState = computeHumanState(humanS.mostRecent.state, time, env);

			humanSnapshots[oKey]!.splice(humanS.mostRecentIndex + 1, 0, {
				time: time,
				state: newState,
			});

			worldLogger.debug('WorldState: ', humanSnapshots[oKey]);
		}
	});

	// update visible world
	const visibles: ObjectId[] = [];
	let outOfSight: ObjectId[] = [];
	let lineOfSight: Point[] | undefined;

	const myHumanId = whoAmI();
	if (myHumanId) {
		const myId = { objectId: myHumanId, objectType: 'Human' };
		const myPosition = getMostRecentSnapshot(locationsSnapshots, myId, time);

		//if (myPosition.mostRecent != null) {

		if (myPosition.mostRecent != null && myPosition.mostRecent?.state.lineOfSight == null) {
			myPosition.mostRecent.state.lineOfSight = calculateLOS(myPosition.mostRecent.state.location!);
		}
		lineOfSight = myPosition.mostRecent?.state.lineOfSight;

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
	} else if (fogType === 'NONE') {
		// no fog: update all objects
		visibles.push(...objectList);
	}

	//worldLogger.setLevel('INFO')
	worldLogger.log('Fog', fogType);
	worldLogger.log('Visible', visibles);
	worldLogger.log('OutOfSight', outOfSight);
	//worldLogger.setLevel('WARN')

	visibles.forEach(oId => {
		const key = getObjectKey(oId);
		const location = getMostRecentSnapshot(locationsSnapshots, oId, time);
		const human = getMostRecentSnapshot(humanSnapshots, oId, time);
		worldLogger.debug('Visible@Location', key, location.mostRecent);
		worldLogger.debug('Visible@Human', key, human.mostRecent);

		worldState.humans[key] = {
			id: oId.objectId,
			human: human.mostRecent?.state,
			location: location.mostRecent?.state,
		};

		/*
		if (location.mostRecent != null && human.mostRecent != null) {
			worldState.humans[key] = {
				...human.mostRecent.state,
				...location.mostRecent.state,
			};
		}*/
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
				if (current.location.direction != null) {
					// last time I saw this object, it was moving
					current.location.location = undefined;
					current.location.direction = undefined;
				} else if (isPointInPolygon(current.location.location, lineOfSight)) {
					// Last known location was here but object is not here any longer
					current.location.location = undefined;
					current.location.direction = undefined;
				}
			}
		}
	});
	//}
}


/**
 * Get all humanState, bybpassing the line of sight !
 */
export function getAllHuman_omniscient() {
	const time = getCurrentSimulationTime();
	const entries = Object.entries(humanSnapshots);
	return entries.reduce<Record<string, HumanState>>((acc, [key, snapshots]) => {
		const [_, humanId] = key.split("::");
		const { mostRecent } = getMostRecentSnapshot(humanSnapshots, {
			objectType: 'Human',
			objectId: humanId!,
		}, time);
		if (mostRecent) {
			acc[humanId!] = mostRecent.state;
		}
		return acc;
	}, {});
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
			if (options.strictTime ? oSnapshots[i]!.time < time : oSnapshots[i]!.time <= time) {
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
		//worldLogger.info('No Snapshot: init');
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

function computeHumanState(state: HumanState, endTime: number, env: Environnment): HumanState {
	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
	const meta = humanMetas[state.id];

	if (meta == null) {
		throw `Unable to find meta for ${state.id}`;
	}

	const health = healths[state.id] || { effects: [], pathologies: [] };

	if (state.frozen || (health.effects.length === 0 && health.pathologies.length === 0)) {
		// no need to compute state; Human is stable
		const newState: HumanState = {
			...state,
			time: endTime,
		};
		worldLogger.log('Skip Human ', state.id);
		return newState;
	} else {
		worldLogger.log('Update Human ', state.id);
		const newState = Helpers.cloneDeep(state);

		const from = state.bodyState.time;

		for (let i = from + stepDuration; i <= endTime; i += stepDuration) {
			worldLogger.log('Compute Human Step ', { currentTime: newState.time, stepDuration, health });
			computeState(newState.bodyState, meta, env, stepDuration, health.pathologies, health.effects);
			worldLogger.debug('Step Time: ', newState.bodyState.time);
		}

		// last tick
		if (newState.time < endTime) {
			worldLogger.log('Compute Human Step ', {
				currentTime: newState.time,
				stepDuration: endTime - newState.bodyState.time,
				health,
			});
			computeState(
				newState.bodyState,
				meta,
				env,
				endTime - newState.bodyState.time,
				health.pathologies,
				health.effects,
			);
		}
		newState.time = newState.bodyState.time;
		worldLogger.debug('FinalStateTime: ', newState.time);
		return newState;
	}
}

function processTeleportEvent(event: FullEvent<TeleportEvent>) {
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
}

function processFollowPathEvent(event: FullEvent<FollowPathEvent>) {
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
}

function updateHumanSnapshots(humanId: string, time: number) {
	// Update HUMAn body states
	const objId = { objectType: 'Human', objectId: humanId };
	const env = getEnv();

	const snapshots = getHumanSnapshotAtTime(objId, time);
	let snapshot = snapshots.snapshot;

	// Update futures
	snapshots.futures.forEach(sshot => {
		worldLogger.log('Update future human snapshot at time ', sshot.time);
		const state = Helpers.cloneDeep(snapshot.state);
		sshot.state = computeHumanState(state, sshot.time, env);

		snapshot = sshot;
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

/**
 * Artifically age a human target
 */
function processAgingEvent(agingEvent: FullEvent<AgingEvent>) {
	// Update HUMAn body states
	const objId = { objectType: 'Human', objectId: agingEvent.payload.targetId };

	const env = getEnv();

	const time = agingEvent.time;
	const newTime = time + agingEvent.payload.deltaSeconds;
	const snapshots = getHumanSnapshotAtTime(objId, time);
	let snapshot = snapshots.snapshot;

	const agedState = computeHumanState(snapshot.state, newTime, env);

	snapshot.time = time;
	snapshot.state = agedState;
	snapshot.state.time = time;
	snapshot.state.bodyState.time = time;

	// Update futures
	snapshots.futures.forEach(sshot => {
		worldLogger.log('Update future human snapshot at time ', sshot.time);
		const state = Helpers.cloneDeep(snapshot.state);
		sshot.state = computeHumanState(state, sshot.time, env);

		snapshot = sshot;
	});
}

function isActionBodyEffect(action: HumanAction | undefined): action is ActionBodyEffect {
	return action?.type === 'ActionBodyEffect';
}

function isMeasureAction(action: HumanAction | undefined): action is ActionBodyMeasure {
	return action?.type === 'ActionBodyMeasure';
}

export interface ResolvedAction {
	source: ActDefinition | ItemDefinition;
	label: string;
	actionId: string;
	action: ActionBodyEffect | ActionBodyMeasure;
}

export function resolveAction(
	event: HumanTreatmentEvent | HumanMeasureEvent,
): ResolvedAction | undefined {
	if (event.source.type === 'act') {
		const act = getAct(event.source.actId);
		const action = act?.action;
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			const label = act ? getActTranslation(act) : `${event.source.actId}`;
			return {
				source: { ...act!, type: 'act' },
				label: label,
				actionId: 'default',
				action: action,
			};
		}
	} else if (event.source.type === 'itemAction') {
		const item = getItem(event.source.itemId);
		const action = item?.actions[event.source.actionId];
		if (isActionBodyEffect(action) || isMeasureAction(action)) {
			const label = item
				? getItemActionTranslation(item, event.source.actionId)
				: `${event.source.itemId}::${event.source.actionId}`;
			return {
				source: { ...item!, type: 'item' },
				actionId: event.source.actionId,
				label: label,
				action: action,
			};
		}
	}

	return undefined;
}

function readMetrics(metrics: BodyStateKeys[], body: BodyState): MeasureMetric[] {
	return metrics.map(metric => {
		return {
			metric,
			value: readKey(body, metric),
		};
	});
}


function doMeasure(
	time: number,
	_source: ItemDefinition | ActDefinition,
	action: ActionBodyMeasure,
	fEvent: FullEvent<HumanMeasureEvent>,
	rEvent: HumanMeasureResultEvent | undefined,
) {
	const metrics = action.metricName;

	const event = fEvent.payload;
	const objId = {
		objectType: event.targetType,
		objectId: event.targetId,
	};

	const { snapshot, futures } = getHumanSnapshotAtTime(objId, fEvent.time);
	const body = snapshot.state.bodyState;

	const values = readMetrics(metrics, body);

	const logEntry: MeasureLog = {
		type: 'MeasureLog',
		time: time,
		emitterCharacterId: event.emitterCharacterId.toString(),
		metrics: values,
	};
	snapshot.state.console.push(logEntry);

	if (rEvent) {
		rEvent.result = values;
		rEvent.status = 'success';
		sendEvent(rEvent);
	}

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
		inventoryLogger.info('Owner does not have any');
		const missingMessage = getTranslation('pretriage-interface', 'itemMissing');
		addLogMessage(
			ownerId.objectId,
			patientId,
			time,
			`${missingMessage} ${getItemTranslation(item)}`,
		);
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
			const missingMessage = getTranslation('pretriage-interface', 'itemMissing');
			addLogMessage(
				ownerId.objectId,
				patientId,
				time,
				`${missingMessage} ${getItemTranslation(item)}`,
			);
			return false;
		}
	} else {
		// infinity never decreases
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
			const cancel = getTranslation('pretriage-interface', 'cancellation');
			if (dA.resultEvent) {
				dA.resultEvent.status = 'cancelled';
				// dA.resultEvent.duration = now - originalAction.time; //TODO or not TODO ?
				sendEvent(dA.resultEvent);
			}
			addLogMessage(
				dA.event.payload.emitterCharacterId.toString(),
				dA.event.payload.targetId,
				event.time,
				`${cancel} ${dA.action.label}`,
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

function processDelayedAction({ dueDate, action, event, resultEvent }: DelayedAction) {
	delayedLogger.info('Process Delayed Action', { dueDate, action, event, resultEvent });
	if (event.payload.type === 'HumanMeasure' && action.action.type === 'ActionBodyMeasure') {
		doMeasure(
			dueDate,
			action.source,
			action.action,
			event as FullEvent<HumanMeasureEvent>,
			resultEvent,
		);
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
	return action.label;
}

function getActionDisplay(action: ResolvedAction, objectId: ObjectId, time: number): DelayedAction['display'] {
	if (action.action.type === 'ActionBodyMeasure') {
		const metrics = action.action.metricName;
		const metric = metrics[0];
		if (metrics.length === 1 && metric) {
			switch (metric) {
				case 'vitals.cardio.hr':
				case 'vitals.respiration.rr': {
					const { snapshot } = getHumanSnapshotAtTime(objectId, time);
					const body = snapshot.state.bodyState;
					const result = readMetrics([metric], body);
					if (result[0] != null && typeof result[0].value === 'number') {
						return {
							pulse_perMin: result[0].value,
						}
					}
				}
			}
		}
	}

	return undefined;
}

function delayAction(
	dueDate: number,
	action: ResolvedAction,
	event: FullEvent<HumanTreatmentEvent | HumanMeasureEvent>,
	resultEvent: HumanMeasureResultEvent | undefined,
) {
	const dA: DelayedAction = {
		id: event.id,
		dueDate,
		action,
		event,
		display: getActionDisplay(action, {objectType: 'Human', objectId: event.payload.targetId}, event.time),
		resultEvent
	};
	const start = getTranslation('pretriage-interface', 'start');
	addLogMessage(
		event.payload.emitterCharacterId.toString(),
		event.payload.targetId,
		event.time,
		`${start} ${dA.action.label}`,
	);
	delayedActions.push(dA);
}

export function getHumanSkillLevelForAction(
	humanId: string,
	action: ActionSource,
): SkillLevel | undefined {
	if (action.type === 'act') {
		return getHumanSkillLevelForAct(humanId, action.actId);
	} else {
		return getHumanSkillLevelForItemAction(humanId, action.itemId, action.actionId);
	}
}

function processHumanMeasureEvent(event: FullEvent<HumanMeasureEvent>, toBeProcessedEvents?: FullEvent<EventPayload>[]) {
	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const me = String(self.getId());

		let resultEvent: HumanMeasureResultEvent | undefined = undefined;
		// initialize result event only if current player was the sender
		if(me == event.payload.emitterPlayerId)
		{
			// check that the event has not been emitted already

			// TODO is that robust to multiple clients ?
			// what if both emit it at the same time ?
			const emitted = toBeProcessedEvents && 
				toBeProcessedEvents.findIndex(e => 
				e.payload.type === 'HumanMeasureResult' 
				&& e.payload.sourceEventId === event.id) > -1;
			
			if(!emitted){
				resultEvent = {
					type : 'HumanMeasureResult',
					targetType : 'Human',
					sourceEventId : event.id,
					targetId: event.payload.targetId,
					emitterCharacterId: event.payload.emitterCharacterId,
					emitterPlayerId : me,
					status : 'unknown',
					duration : 0
				}
			}
		}

		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === 'ActionBodyMeasure') {
			if (source.type === 'item') {
				const characterId: ObjectId = {
					objectType: 'Human',
					objectId: event.payload.emitterCharacterId.toString(),
				};
				if (
					checkItemAvailabilityAndConsume(
						event.time,
						characterId,
						source,
						event.payload.targetId,
					) === false
				) {
					if (resultEvent) {
						// TODO if multiple client have the same game opened, there might be two events
						sendEvent(resultEvent);
					}
					return;
				}
			}

			worldLogger.log(
				'Do Measure: ',
				{ time: event.time, source: event.payload.source, action },
				event,
			);

			const skillLevel = getHumanSkillLevelForAction(
				event.payload.emitterCharacterId.toString(),
				event.payload.source,
			);
			if (skillLevel) {
				const duration = action.duration[skillLevel];
				if (duration > 0 && !event.payload.timeJump) {
					if (resultEvent) {
						resultEvent.duration = duration;
					}
					delayAction(event.time + duration, resolvedAction, event, resultEvent);
				} else {
					if(duration > 0){
						fastForward(duration);
					}
					doMeasure(event.time, source, action as ActionBodyMeasure, event, resultEvent);
				}
			} else {
				const dontknow = getTranslation('pretriage-interface', 'skillMissing');
				addLogMessage(
					event.payload.emitterCharacterId.toString(),
					event.payload.targetId,
					event.time,
					`${dontknow} ${getResolvedActionDisplayName(resolvedAction)}`,
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
	const { snapshot, futures } = getHumanSnapshotAtTime(objId, time);
	snapshot.state.console.push(logEntry);

	futures.forEach(sshot => {
		sshot.state.console.push({ ...logEntry });
		sshot.state.console.sort((a, b) => a.time - b.time);
	});
}

function getHumanSnapshotAtTime(
	objId: ObjectId,
	time: number,
	lastEventBefore?: FullEvent<EventPayload>,
): { snapshot: Snapshot<HumanState>; futures: Snapshot<HumanState>[] } {
	const oKey = getObjectKey(objId);

	// Fetch most recent human snapshot
	const mostRecents = getMostRecentSnapshot(humanSnapshots, objId, time, {
		before: lastEventBefore,
	});
	let { mostRecent } = mostRecents;
	const { mostRecentIndex, futures } = mostRecents;

	let snapshot: Snapshot<HumanState>;

	if (mostRecent == null) {
		//worldLogger.warn('Init human....', objId.objectId);
		mostRecent = {
			time: 0,
			state: initHuman(objId.objectId),
		};
		humanSnapshots[oKey]!.unshift(mostRecent);
	}

	if (mostRecent.time < time) {
		// catch-up human state
		const env = getEnv();
		//worldLogger.warn('Compute human state ....', objId.objectId, time);

		snapshot = {
			time: time,
			state: computeHumanState(mostRecent.state, time, env),
		};
		// register new snapshot
		humanSnapshots[oKey]!.splice(mostRecentIndex + 1, 0, snapshot);
	} else {
		// update mostRecent snapshot in place
		snapshot = mostRecent;
	}
	return { snapshot, futures };
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
		emitterCharacterId: event.payload.emitterCharacterId.toString(),
		message: event.payload.message,
	};

	addLogEntry(objId, logEntry, time);
}

function processCategorizeEvent(event: FullEvent<CategorizeEvent>) {
	const objId = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId,
	};

	const next = findNextTargetedEvent(currentProcessedEvents, event, ['Categorize'], objId);

	const { snapshot, futures } = getHumanSnapshotAtTime(objId, event.time, next);

	const category: Categorization = {
		category: event.payload.category,
		system: event.payload.system,
		autoTriage: event.payload.autoTriage,
		severity: event.payload.severity,
	};

	snapshot.state.category = category;

	futures.forEach(sshot => {
		sshot.state.category = { ...category };
	});
}

/**
 * apply treatment at given time
 */
function doTreatment(
	time: number,
	{ source, actionId, action, label }: ResolvedAction,
	event: FullEvent<HumanTreatmentEvent>,
) {
	worldLogger.log('Do Treatment ', { time: time, source: source, action });
	const effect = doActionOnHumanBody(
		source,
		action as ActionBodyEffect,
		actionId,
		event.payload.blocks,
		time,
	);
	if (effect != null) {
		const health = getHealth(event.payload.targetId);
		health.effects.push(effect);
		healths[event.payload.targetId] = health;
		updateHumanSnapshots(event.payload.targetId, time);
	}

	const evt = event.payload;
	const objId = {
		objectType: evt.targetType,
		objectId: evt.targetId,
	};

	const { snapshot, futures } = getHumanSnapshotAtTime(objId, event.time);

	const message = getTranslation('pretriage-interface', 'treatment') + ': ' + label;

	const entry: TreatmentLog = {
		time: event.time,
		message: message,
		emitterCharacterId: event.payload.emitterCharacterId.toString(),
		type: 'TreatmentLog',
	};

	snapshot.state.console.push(entry);
	futures.forEach(f => {
		f.state.console.push(entry);
	});
}

function processHumanTreatmentEvent(event: FullEvent<HumanTreatmentEvent>) {
	const resolvedAction = resolveAction(event.payload);

	if (resolvedAction != null) {
		const { source, action } = resolvedAction;
		if (resolvedAction.action.type === 'ActionBodyEffect') {
			if (source.type === 'item') {
				const characterId: ObjectId = {
					objectType: 'Human',
					objectId: event.payload.emitterCharacterId.toString(),
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
				event.payload.emitterCharacterId.toString(),
				event.payload.source,
			);
			const patientOnItselfAct = event.payload.emitterCharacterId === event.payload.targetId && !!Variable.find(gameModel, 'patients').getProperties()[event.payload.emitterCharacterId];
			if (patientOnItselfAct) {
				doTreatment(event.time, resolvedAction, event);
			} else if (skillLevel) {
				const duration = action.duration[skillLevel];
				if (duration > 0 && !event.payload.timeJump) {
					// delay event
					delayAction(event.time + duration, resolvedAction, event, undefined);
				} else {
					if(duration > 0){
						fastForward(duration);
					}
					doTreatment(event.time, resolvedAction, event);
				}
			} else {
				const dontknow = getTranslation('pretriage-interface', 'skillMissing');
				addLogMessage(
					event.payload.emitterCharacterId.toString(),
					event.payload.targetId,
					event.time,
					`${dontknow} (${getResolvedActionDisplayName(resolvedAction)})`,
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

	if (distanceSquared < sqRadius) {
		processDirectMessageEvent(event, event.payload.sender);
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
	const mostRecents = getMostRecentSnapshot(inventoriesSnapshots, owner, time);
	let { mostRecent } = mostRecents;
	const { mostRecentIndex, futures } = mostRecents;

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
	//worldLogger.setLevel('INFO');
	worldLogger.info('Process Give Bag Event', { owner, bag });
	//worldLogger.setLevel('WARN');

	if (bag != null) {
		updateInventoriesSnapshots(owner, event.time, bag.items);
	}
}

function processFreezeEvent(event: FullEvent<FreezeEvent>) {
	const owner = {
		objectType: event.payload.targetType,
		objectId: event.payload.targetId,
	};

	worldLogger.debug('Process Freeze Event', { owner, event });

	const next = findNextTargetedEvent(currentProcessedEvents, event, ['Freeze'], owner);

	const { snapshot, futures } = getHumanSnapshotAtTime(owner, event.time, next);
	const frozen = event.payload.mode === 'freeze';
	snapshot.state.frozen = frozen;

	futures.forEach(sshot => {
		sshot.state.frozen = frozen;
	});
}

function processEvent(event: FullEvent<EventPayload>, toBeProcessedEvents?: FullEvent<EventPayload>[]) {
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
			processHumanMeasureEvent(event as FullEvent<HumanMeasureEvent>, toBeProcessedEvents);
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
		case 'Freeze':
			processFreezeEvent(event as FullEvent<FreezeEvent>);
			break;
		case 'Aging':
			processAgingEvent(event as FullEvent<AgingEvent>);
			break;
		case 'HumanMeasureResult':
			break;
		default:
			unreachable(eType);
	}
	processedEvent[event.id] = true;
}

export function syncWorld() {
	worldLogger.log('Sync World');
	const time = getCurrentSimulationTime();

	const allEvents = getAllEvents();
	const events = filterOutFutureEvents(allEvents, time);
	const mappedEvents = extractNotYetProcessedEvents(events);
	const eventsToProcess = mappedEvents.not;
	currentProcessedEvents = mappedEvents.processed;

	worldLogger.debug('ToProcess', eventsToProcess);

	const env = getEnv();

	const sortedEvents = eventsToProcess.sort(compareEvent);

	sortedEvents.forEach(e => processEvent(e, eventsToProcess));

	processDelayedActions(time);

	rebuildState(time, env);
}

export function getInstantiatedHumanIds() {
	return Object.values(worldState.humans).map(h => h.id);
}

export function getLocatedHumans() {
	return Object.values(worldState.humans).flatMap(h => {
		if (h.location) {
			return [
				{
					id: h.id,
					location: h.location.location,
					direction: h.location.direction,
					lineOfSight: h.location.lineOfSight,
					categorization: h.human?.category,
				},
			];
		} else {
			return [];
		}
	});
}

export function getCategorizedHumans() {
	return Object.values(worldState.humans).flatMap(h => {
		if (h.human) {
			return [
				{
					id: h.id,
					categorization: h.human.category,
				},
			];
		} else {
			return [];
		}
	});
}

export function getHuman(id: string):
	| (HumanBody & {
		category: Categorization | undefined;
	})
	| undefined {
	const human = worldState.humans[`Human::${id}`];
	const meta = humanMetas[id];
	if (human?.human && meta) {
		return {
			meta,
			state: human.human.bodyState,
			category: human.human.category,
		};
	}

	return undefined;
}

export function getHumanMeta(humanId: string): HumanMeta | undefined {
	return humanMetas[humanId];
}

export function getHumanConsole(id: string): ConsoleLog[] {
	const myId = whoAmI();
	const human = worldState.humans[`Human::${id}`];

	if (human?.human) {
		return human.human.console.filter(log => log.emitterCharacterId === myId);
	}

	return [];
}

export function handleClickOnMap(
	point: Point,
	features: { features: Record<string, unknown>; layerId?: string }[],
): void {
	if (isInterfaceDisabled()) {
		return;
	}

	const myId = whoAmI();
	if (myId) {
		const objectId: ObjectId = { objectType: 'Human', objectId: myId };

		const key = getObjectKey(objectId);
		const myState = worldState.humans[key];
		const currentLocation = myState?.location?.location;
		const mapId = currentLocation ? currentLocation.mapId : '';
		const destination: Location = { ...point, mapId }; //, mapId: 'yverdon' };

		worldLogger.info('HandleOn: ', { objectId, destination, currentLocation, myState });
		if (currentLocation != null && currentLocation.x != 0 && currentLocation.y != 0) {
			// Move from current location to given point
			const from: Location = { ...currentLocation };
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

	if (myId) {
		sendEvent({
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: myId,
			location: {
				mapId: mapId,
				x: 0,
				y: 0,
			},
		});
	}
}

/**
 * Get the distance between two human, in meters.
 */
function getDistanceBetweenHumans(h1: string | undefined, h2: string | undefined): number {
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

function getInventory(time: number, objectId: ObjectId): Inventory {
	const state = getMostRecentSnapshot(inventoriesSnapshots, objectId, time);
	if (state.mostRecent != null) {
		return state.mostRecent.state;
	} else {
		return {};
	}
}

/**
 * Get current character inventory.
 */
export function getMyInventory(): Inventory {
	const myHumanId = whoAmI();

	const time = getCurrentSimulationTime();

	const myId = { objectId: myHumanId, objectType: 'Human' };

	return getInventory(time, myId);
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

	/*
	const system = getSystem();
	worldLogger.log('(Init Sympathetic System: ', system);
	setSystemModel(system);

	const compensation = loadCompensationModel();
	worldLogger.log('Load Compensation Profile: ', compensation);
	setCompensationModel(compensation);

	const overdrive = getOverdriveModel();
	worldLogger.info('Overdrive Profile: ', overdrive);
	setOverdriveModel(overdrive);*/

	clearState();

	return () => {
		clearState();
	};
});
