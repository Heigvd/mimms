import { BaseEvent, initEmitterIds } from '../common/events/baseEvent';
import { getSendEventServerScript } from '../common/events/eventUtils';
import { reviveScriptedEvent } from '../legacy/scenario';
import {
  getCurrentPatientBody,
  getCurrentPatientId,
  getInstantiatedHumanIds,
} from '../legacy/the_world';
import { getCurrentSimulationTime, getRunningMode } from '../legacy/TimeManager';
import { getBodyParam, getSortedPatientIds } from '../../tools/WegasHelper';
import { AgingEvent, TeleportEvent } from '../common/events/eventTypes';
import { getInitialTimeJumpSeconds } from '../common/patients/handleState';
import { patientTimeLogger } from '../../tools/logger';

interface DrillStatus {
  status: 'not_started' | 'ongoing' | 'completed_summary' | 'completed_review' | 'validated';
}

export function getDrillStatus(): DrillStatus['status'] {
  return Variable.find(gameModel, 'drillStatus').getProperty(
    self,
    'status'
  ) as DrillStatus['status'];
}

function getSetDrillStatusScript(status: DrillStatus['status']): string {
  return `Variable.find(gameModel, 'drillStatus').setProperty(self, 'status', '${status}');`;
}

export function setDrillStatus(status: DrillStatus['status']) {
  const script = getSetDrillStatusScript(status);
  APIMethods.runScript(script, {});
}

let timeManagerRequestOngoing = false;

/** Last logged `<drillStatus>/<runningMode>/<expected>` triplet, to trace transitions only */
let lastTimeManagerSignature = '';

async function sendRequest(request: string): Promise<unknown> {
  if (timeManagerRequestOngoing) {
    return;
  }

  timeManagerRequestOngoing = true;
  await APIMethods.runScript(request, {});
  timeManagerRequestOngoing = false;
  return;
}

/**
 * Traces the drill clock gate: whether simulated time is allowed to flow.
 * Only logs when the situation actually changes, to keep one line per transition.
 */
function logTimeManagerTransition(
  currentMode: string,
  expected: 'pause' | 'running',
  drillStatus: DrillStatus['status']
) {
  const signature = `${drillStatus}/${currentMode}/${expected}`;
  if (signature !== lastTimeManagerSignature) {
    lastTimeManagerSignature = signature;
    patientTimeLogger.info('[PT][CLOCK]', {
      drillStatus,
      runningMode: currentMode,
      expected,
      simTime: getCurrentSimulationTime(),
      currentPatientId: getCurrentPatientId() || '(none)',
    });
  }
}

export function autoTimeManager() {
  const currentMode = getRunningMode();
  if (currentMode === 'GLOBAL_PAUSE') {
    // paused by trainer
    logTimeManagerTransition('GLOBAL_PAUSE', 'pause', getDrillStatus());
    return;
  }

  let expected: 'pause' | 'running' = 'pause';
  const drillStatus = getDrillStatus();
  if (drillStatus === 'ongoing' || drillStatus === 'completed_review') {
    expected = 'running';
  }

  logTimeManagerTransition(currentMode, expected, drillStatus);

  if (expected === 'pause' && currentMode === 'RUNNING') {
    // pause
    return sendRequest('TimeManager.pause()');
  }

  if (expected === 'running' && currentMode != 'RUNNING') {
    switch (currentMode) {
      case 'TEAM_PAUSE':
        return sendRequest('TimeManager.start();');
      case 'IDLE':
        return sendRequest('TimeManager.revive();');
    }
  }
}

export function isCurrentPatientCategorized() {
  const current = getCurrentPatientBody();
  return current?.category != null;
}

export function selectNextPatient(): Promise<IManagedResponse | void> {
  const status = getDrillStatus();
  if (status === 'not_started' || status === 'ongoing') {
    const allIds = getSortedPatientIds();
    const processed = getInstantiatedHumanIds();

    const patientId = allIds
      .filter(id => !processed.includes(id))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];

    //const patientId = pickRandom(ids);

    if (patientId) {
      const param = getBodyParam(patientId);
      if (param != null) {
        const emitter = initEmitterIds();

        const currentTime = getCurrentSimulationTime();

        const script = param.scriptedEvents || [];
        const times = script.reduce<{ min: number; max: number }>(
          (times, current) => {
            return {
              min: Math.min(times.min, current.time),
              max: Math.max(times.max, current.time),
            };
          },
          { min: Infinity, max: 0 }
        );

        const initialTimeJump = getInitialTimeJumpSeconds();
        // `times` is seeded with {min: Infinity, max: 0}: with no scripted event at all,
        // `times.max - times.min` is -Infinity, which is logged here to be caught.
        const scriptSpread = times.max - times.min;

        patientTimeLogger.info('[PT][SELECT]', {
          patientId,
          simTimeAtSelection: currentTime,
          frozenPatientId: getCurrentPatientId() || '(none)',
          scriptedEventCount: script.length,
          scriptedEventTimes: script.map(sEvent => sEvent.time),
          timesMin: times.min,
          timesMax: times.max,
          scriptSpread,
          pathologyEventTimes: script.map(sEvent => currentTime + sEvent.time - times.min),
          initialTimeJumpSeconds: initialTimeJump,
          agingEventTime: currentTime + scriptSpread,
          agingIsInTheFuture: scriptSpread > 0,
        });

        const toPost: string[] = [getSetDrillStatusScript('ongoing')];

        toPost.push(getStoreCurrentTimeScript(currentTime));

        // stop time for the "previous" patient
        toPost.push(getFreezePatientEventScript(emitter, currentTime));

        const teleport: TeleportEvent = {
          ...emitter,
          type: 'Teleport',
          targetType: 'Human',
          targetId: patientId,
          location: {
            mapId: 'the_world',
            x: 0,
            y: 0,
          },
        };

        // the_world ignore not located humans
        toPost.push(getSendEventServerScript(teleport, currentTime));

        // apply scripted events (mostly pathologies)
        toPost.push(
          ...script.map(sEvent => {
            const rEvent = reviveScriptedEvent(emitter, patientId, sEvent);
            return getSendEventServerScript(rEvent, currentTime + sEvent.time - times.min);
          })
        );

        // set upcoming patient
        toPost.push(`Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');`);

        // artifically forward time for the upcoming patient
        const timeJump: AgingEvent = {
          ...emitter,
          type: 'Aging',
          deltaSeconds: initialTimeJump,
          targetType: 'Human',
          targetId: patientId,
        };

        toPost.push(getSendEventServerScript(timeJump, currentTime + times.max - times.min));

        return APIMethods.runScript(toPost.join(''), {});
      }
    } else {
      patientTimeLogger.info('[PT][SELECT] no patient left, going to summary', {
        simTime: getCurrentSimulationTime(),
        processedCount: processed.length,
        totalCount: allIds.length,
      });
      return toSummaryScreen();
    }
  }
  return emptyPromise();
}

function emptyPromise(): Promise<void> {
  return new Promise<void>((resolve, _reject) => {
    resolve(undefined);
  });
}

function getStoreCurrentTimeScript(currentTime: number): string {
  return `Variable.find(gameModel, 'latest_pretri_time').setValue(self, ${currentTime});`;
}

export function toSummaryScreen(): Promise<IManagedResponse> {
  const currentTime = getCurrentSimulationTime();
  const emitter = initEmitterIds();

  patientTimeLogger.info('[PT][SUMMARY] freezing last patient and stopping the clock', {
    simTime: currentTime,
    frozenPatientId: getCurrentPatientId() || '(none)',
  });

  const storetime = getStoreCurrentTimeScript(currentTime);
  const freeze = getFreezePatientEventScript(emitter, currentTime);

  return APIMethods.runScript(
    storetime +
      freeze +
      getSetDrillStatusScript('completed_summary') +
      `Variable.find(gameModel, 'currentPatient').setValue(self, '');`,
    {}
  );
}

/**
 * Freeze the current patient before switching to new one
 */
function getFreezePatientEventScript(evt: BaseEvent, currentTime: number): string {
  const currentPatientId = getCurrentPatientId();
  patientTimeLogger.info('[PT][FREEZE-REQUEST]', {
    patientId: currentPatientId || '(none, nothing to freeze)',
    freezeEventTime: currentTime,
  });
  return currentPatientId
    ? getSendEventServerScript(
        {
          ...evt,
          type: 'Freeze',
          targetType: 'Human',
          targetId: currentPatientId,
          mode: 'freeze',
        },
        currentTime
      )
    : '';
}

export function showPatient(patientId: string) {
  const currentTime = getCurrentSimulationTime();
  const emitter = initEmitterIds();

  // NB: unfreezing during review lets the patient keep evolving while being reviewed
  patientTimeLogger.info('[PT][UNFREEZE-REQUEST] review', {
    patientId,
    unfreezeEventTime: currentTime,
  });

  const unfreeze = getSendEventServerScript(
    {
      ...emitter,
      type: 'Freeze',
      targetType: 'Human',
      targetId: patientId,
      mode: 'unfreeze',
    },
    currentTime
  );

  const script = [
    unfreeze,
    `Variable.find(gameModel, 'currentPatient').setValue(self, '${patientId}');`,
    getSetDrillStatusScript('completed_review'),
  ];

  APIMethods.runScript(script.join(''), {});
}
