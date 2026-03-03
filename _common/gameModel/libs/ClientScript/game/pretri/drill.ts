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

async function sendRequest(request: string): Promise<unknown> {
  if (timeManagerRequestOngoing) {
    return;
  }

  timeManagerRequestOngoing = true;
  await APIMethods.runScript(request, {});
  timeManagerRequestOngoing = false;
  return;
}

export function autoTimeManager() {
  const currentMode = getRunningMode();
  if (currentMode === 'GLOBAL_PAUSE') {
    // paused by trainer
    return;
  }

  let expected: 'pause' | 'running' = 'pause';
  const drillStatus = getDrillStatus();
  if (drillStatus === 'ongoing' || drillStatus === 'completed_review') {
    expected = 'running';
  }

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
          deltaSeconds: getInitialTimeJumpSeconds(),
          targetType: 'Human',
          targetId: patientId,
        };

        toPost.push(getSendEventServerScript(timeJump, currentTime + times.max - times.min));

        return APIMethods.runScript(toPost.join(''), {});
      }
    } else {
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
