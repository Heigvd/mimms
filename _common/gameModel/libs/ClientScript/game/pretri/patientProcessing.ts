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
import { getAct, getItem, getPathology } from '../../HUMAn/registries';
import { getCurrentSimulationTime } from './pretriTime';
import {
  getBodyParam,
  getEnv,
  getSkillLevelForAct,
  getSkillLevelForItemAction,
} from '../../tools/WegasHelper';
import { TargetedEvent } from '../common/events/baseEvent';
import { compareEvent, FullEvent, getAllEvents, sendEvent } from '../common/events/eventUtils';
import { Categorization } from './triage';
import { worldLogger, extraLogger } from '../../tools/logger';
import { SkillLevel } from '../../edition/GameModelerHelper';
import {
  getActTranslation,
  getItemActionTranslation,
  getTranslation,
} from '../../tools/translation';
import {
  AgingEvent,
  CategorizeEvent,
  EventPayload,
  EventType,
  FreezeEvent,
  HumanLogMessageEvent,
  HumanMeasureEvent,
  HumanMeasureResultEvent,
  HumanTreatmentEvent,
  PathologyEvent,
} from '../common/events/eventTypes';
import { MeasureMetric } from '../../HUMAn/registry/acts';
import { ConsoleLog, MeasureLog, TreatmentLog } from './consoleLog';

///////////////////////////////////////////////////////////////////////////
// Typings
///////////////////////////////////////////////////////////////////////////

export interface HumanHealth {
  pathologies: RevivedPathology[];
  effects: BodyEffect[];
}

type HumanHealthState = Record<string, HumanHealth>;

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
  humans: Record<string, { id: string; human?: HumanState }>;
}

interface ObjectId {
  objectType: string;
  objectId: string;
}

export function findNextTargetedEvent(
  events: FullEvent<EventPayload>[],
  currentEvent: FullEvent<EventPayload>,
  eventTypes: EventType[],
  target: ObjectId
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

const humanMetas: Record<string, HumanMeta> = {};

// object key to list of snapshots
let humanSnapshots: Snapshots<HumanState> = {};

/** current visible state */
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

///////////////////////////////////////////////////////////////////////////
// Helpers & Utils
///////////////////////////////////////////////////////////////////////////

function getObjectKey(object: ObjectId) {
  return object.objectType + '::' + object.objectId;
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
    }
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
 * build state of the world at given time
 */
function rebuildState(time: number, env: Environnment) {
  worldLogger.debug('RebuildState', { time, env });
  worldLogger.debug('Humans', humanSnapshots);

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

    if (humanS.mostRecent == null) {
      humanS.mostRecent = {
        time: 0,
        state: initHuman(obj.objectId),
      };
      humanSnapshots[oKey]!.unshift(humanS.mostRecent);
    }

    if (humanS.mostRecent != null && humanS.mostRecent.time < time) {
      //const humanState = Helpers.cloneDeep(humanS.mostRecent.state);
      extraLogger.log('Human ', oKey);
      const newState = computeHumanState(humanS.mostRecent.state, time, env);

      humanSnapshots[oKey]!.splice(humanS.mostRecentIndex + 1, 0, {
        time: time,
        state: newState,
      });

      worldLogger.debug('WorldState: ', humanSnapshots[oKey]);
    }
  });

  // no fog: all humans are visible
  worldLogger.info('InMemoryWorld: ', worldState);
  objectList.forEach(oId => {
    const key = getObjectKey(oId);
    const human = getMostRecentSnapshot(humanSnapshots, oId, time);
    worldLogger.debug('Visible@Human', key, human.mostRecent);

    worldState.humans[key] = {
      id: oId.objectId,
      human: human.mostRecent?.state,
    };
  });
}

/**
 * Get all humanState, bybpassing the line of sight !
 */
export function getAllHuman_omniscient() {
  const time = getCurrentSimulationTime();
  const entries = Object.entries(humanSnapshots);
  return entries.reduce<Record<string, HumanState>>((acc, [key, snapshots]) => {
    const [_, humanId] = key.split('::');
    const { mostRecent } = getMostRecentSnapshot(
      humanSnapshots,
      {
        objectType: 'Human',
        objectId: humanId!,
      },
      time
    );
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
  } = {}
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
        health.effects
      );
    }
    newState.time = newState.bodyState.time;
    worldLogger.debug('FinalStateTime: ', newState.time);
    return newState;
  }
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
      `Afflict Pathology Failed: Pathology "${event.payload.pathologyId}" does not exist`
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
  event: HumanTreatmentEvent | HumanMeasureEvent
): ResolvedAction | undefined {
  if (event.source.type === 'act') {
    const act = getAct(event.source.actId);
    const action = act?.action;
    if (isActionBodyEffect(action) || isMeasureAction(action)) {
      const label = act ? getActTranslation(act) : `${event.source.actId}`;
      return {
        source: { ...act!, type: 'act' },
        label: label,
        actionId: event.source.actId,
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
  rEvent: HumanMeasureResultEvent | undefined
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

export function getResolvedActionDisplayName(action: ResolvedAction): string {
  return action.label;
}

export function getSkillLevelForAction(action: ActionSource): SkillLevel | undefined {
  if (action.type === 'act') {
    return getSkillLevelForAct(action.actId);
  } else {
    return getSkillLevelForItemAction(action.itemId, action.actionId);
  }
}

function processHumanMeasureEvent(
  event: FullEvent<HumanMeasureEvent>,
  toBeProcessedEvents?: FullEvent<EventPayload>[]
) {
  const resolvedAction = resolveAction(event.payload);

  if (resolvedAction != null) {
    const me = String(self.getId());

    let resultEvent: HumanMeasureResultEvent | undefined = undefined;
    // initialize result event only if current player was the sender
    if (me == event.payload.emitterPlayerId) {
      // check that the event has not been emitted already

      // TODO is that robust to multiple clients ?
      // what if both emit it at the same time ?
      const emitted =
        toBeProcessedEvents &&
        toBeProcessedEvents.findIndex(
          e => e.payload.type === 'HumanMeasureResult' && e.payload.sourceEventId === event.id
        ) > -1;

      if (!emitted) {
        resultEvent = {
          type: 'HumanMeasureResult',
          targetType: 'Human',
          sourceEventId: event.id,
          targetId: event.payload.targetId,
          emitterCharacterId: event.payload.emitterCharacterId,
          emitterPlayerId: me,
          status: 'unknown',
          duration: 0,
        };
      }
    }

    const { source, action } = resolvedAction;
    if (resolvedAction.action.type === 'ActionBodyMeasure') {
      worldLogger.log(
        'Do Measure: ',
        { time: event.time, source: event.payload.source, action },
        event
      );

      const skillLevel = getSkillLevelForAction(event.payload.source);
      if (skillLevel) {
        const duration = action.duration[skillLevel] || 0;
        if (resultEvent) {
          resultEvent.duration = duration;
        }
        doMeasure(event.time, source, action as ActionBodyMeasure, event, resultEvent);
      } else {
        const dontknow = getTranslation('pretriage-interface', 'skillMissing');
        addLogMessage(
          event.payload.emitterCharacterId.toString(),
          event.payload.targetId,
          event.time,
          `${dontknow} ${getResolvedActionDisplayName(resolvedAction)}`
        );
      }
    } else {
      worldLogger.warn('Unhandled action type', action);
    }
  } else {
    worldLogger.warn(
      `Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`
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
  lastEventBefore?: FullEvent<EventPayload>
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
    time
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
  event: FullEvent<HumanTreatmentEvent>
) {
  worldLogger.log('Do Treatment ', { time: time, source: source, action });
  const effect = doActionOnHumanBody(
    source,
    action as ActionBodyEffect,
    actionId,
    event.payload.blocks,
    time
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
    const { action } = resolvedAction;
    if (resolvedAction.action.type === 'ActionBodyEffect') {
      const skillLevel = getSkillLevelForAction(event.payload.source);
      const patientOnItselfAct =
        event.payload.emitterCharacterId === event.payload.targetId &&
        !!Variable.find(gameModel, 'patients').getProperties()[event.payload.emitterCharacterId];
      if (patientOnItselfAct || skillLevel) {
        doTreatment(event.time, resolvedAction, event);
      } else {
        const dontknow = getTranslation('pretriage-interface', 'skillMissing');
        addLogMessage(
          event.payload.emitterCharacterId.toString(),
          event.payload.targetId,
          event.time,
          `${dontknow} (${getResolvedActionDisplayName(resolvedAction)})`
        );
      }
    } else {
      worldLogger.warn('Unhandled action type', action);
    }
  } else {
    worldLogger.warn(
      `Action Failed: Action "${JSON.stringify(event.payload.source)}" does not exist`
    );
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

function processEvent(
  event: FullEvent<EventPayload>,
  toBeProcessedEvents?: FullEvent<EventPayload>[]
) {
  worldLogger.debug('ProcessEvent: ', event);

  const eType = event.payload.type;

  switch (eType) {
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
    case 'Freeze':
      processFreezeEvent(event as FullEvent<FreezeEvent>);
      break;
    case 'Aging':
      processAgingEvent(event as FullEvent<AgingEvent>);
      break;
    case 'HumanMeasureResult':
      break;
    case 'ActionCreationEvent':
    case 'TimeForwardEvent':
    case 'GameOptionsEvent':
    case 'DashboardRadioMessageEvent':
    case 'DashboardNotificationMessageEvent':
      worldLogger.info('Ignoring event of type (new sim)', eType);
      break;
    default:
      unreachable(eType as never);
  }
  processedEvent[event.id] = true;
}

function unreachable(x: never) {
  worldLogger.error('Unreachable ', x);
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

  rebuildState(time, env);
}

export function getInstantiatedHumanIds() {
  return Object.values(worldState.humans).map(h => h.id);
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
  const human = worldState.humans[`Human::${id}`];
  return human?.human ? human.human.console : [];
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

export function clearState() {
  processedEvent = {};
  humanSnapshots = {};
  worldState.humans = {};
  healths = {};
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
