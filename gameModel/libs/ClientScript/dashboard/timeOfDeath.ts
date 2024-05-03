/**
 *
 * Script solely handling the time of death and exportation of current patient preset
 *
 */

import { getPatientPreset, PatientPreset } from '../edition/patientPreset';
import {
  BodyEffect,
  HumanBody,
  doActionOnHumanBody,
  createHumanBody,
  computeState,
} from '../HUMAn/human';
import { AfflictedPathology, RevivedPathology, revivePathology } from '../HUMAn/pathology';
import { getAct, getItem } from '../HUMAn/registries';
import { mainSimLogger } from '../tools/logger';
import { getEnv, getPatientsBodyFactoryParamsArray } from '../tools/WegasHelper';

type PatientId = string;

type PatientState = {
  patientId: PatientId;
  humanBody: HumanBody;
  timeOfDeath: number;
  pathologies: string[];
};

export function loadPatients(): PatientState[] {
  const env = getEnv();
  const presetId = Variable.find(gameModel, 'patientSet').getValue(self);
  let preset: PatientPreset | null | undefined;
  if (presetId) {
    preset = getPatientPreset(presetId);
  } else {
    // If no preset we fetch all patients
    preset = {
      name: '',
      patients: {},
    };
    Object.keys(Variable.find(gameModel, 'patients').getProperties()).forEach(key => {
      preset!.patients[key] = true;
    });
  }

  const humanBodies = getPatientsBodyFactoryParamsArray()
    .filter(bodyFactoryParamWithId => preset!.patients[bodyFactoryParamWithId.id])
    .map(bodyFactoryParamWithId => {
      const humanBody = createHumanBody(bodyFactoryParamWithId.meta, env);
      humanBody.id = bodyFactoryParamWithId.id;
      return humanBody;
    })
    .map(humanBody => {
      humanBody.revivedPathologies = reviveAfflictedPathologies(
        computeInitialAfflictedPathologies(humanBody)
      );
      humanBody.effects = computeInitialEffects(humanBody);
      return humanBody;
    });

  function extractPathologies(pathologies: RevivedPathology[]): string[] {
    const result: string[] = [];

    pathologies.forEach(p => {
      const pId = p.pathologyId;
      const block = p.modules[0].block;
      result.push(`${pId} (${block})`);
    });

    return result;
  }

  return humanBodies.flatMap(humanBody => {
    return {
      patientId: humanBody.id!,
      humanBody: humanBody,
      timeOfDeath: 0,
      pathologies: humanBody.revivedPathologies
        ? extractPathologies(humanBody.revivedPathologies)
        : [],
    };
  });
}

// Duplicate code in client/game/common/patients/handleState.ts !
function computeInitialAfflictedPathologies(patient: HumanBody): [AfflictedPathology, number][] {
  const pathologiesWithTime: [AfflictedPathology, number][] = [];
  const healthConditions = patient.meta.scriptedEvents;
  healthConditions!.map(healthCondition => {
    if (healthCondition.payload.type === 'HumanPathology') {
      try {
        pathologiesWithTime.push([healthCondition.payload, healthCondition.time]);
        mainSimLogger.debug('Afflict Pathology: ', {
          pathology: healthCondition.payload,
          time: healthCondition.time,
        });
      } catch {
        mainSimLogger.warn(
          `Afflict Pathology Failed: Pathology "${healthCondition.payload.pathologyId}" does not exist`
        );
      }
    }
  });
  return pathologiesWithTime;
}

// Duplicate code in client/game/common/patients/handleState.ts !
function computeInitialEffects(patient: HumanBody): BodyEffect[] {
  const effects: BodyEffect[] = [];
  patient.meta.scriptedEvents!.map(healthCondition => {
    if (healthCondition.payload.type === 'HumanTreatment') {
      if (healthCondition.payload.source.type === 'act') {
        const act = getAct(healthCondition.payload.source.actId);
        if (act) {
          if (act.action.type === 'ActionBodyEffect') {
            mainSimLogger.info('Do Act: ', { time: healthCondition.time, act });
            effects.push(
              doActionOnHumanBody(
                act,
                act.action,
                'default',
                healthCondition.payload.blocks,
                healthCondition.time
              )!
            );
          } else {
            mainSimLogger.info('Ignore measure');
          }
        }
      } else if (healthCondition.payload.source.type === 'itemAction') {
        const item = getItem(healthCondition.payload.source.itemId);
        const action = item?.actions[healthCondition.payload.source.actionId];
        if (action != null) {
          if (action.type === 'ActionBodyEffect') {
            mainSimLogger.info('Apply Item: ', { time: healthCondition.time, item, action });
            effects.push(
              doActionOnHumanBody(
                item!,
                action,
                healthCondition.payload.source.actionId,
                healthCondition.payload.blocks,
                healthCondition.time
              )!
            );
          } else {
            mainSimLogger.info('Ignore measure');
          }
        } else {
          mainSimLogger.warn(
            `Item Action Failed: Event/Action "${healthCondition.payload.source.itemId}/${healthCondition.payload.source.actionId}`
          );
        }
      }
    }
  });
  return effects;
}

// Duplicate code in client/game/common/patients/handleState.ts !
function reviveAfflictedPathologies(
  afflictedPathologies: [AfflictedPathology, number][]
): RevivedPathology[] {
  const pathologies: RevivedPathology[] = [];
  afflictedPathologies.forEach(afflictedPathologyTuple => {
    const revivedpathology = revivePathology(
      afflictedPathologyTuple[0],
      afflictedPathologyTuple[1]
    );
    pathologies.push(revivedpathology);
  });

  return pathologies;
}

export function computePatientUntilDeath(patientState: PatientState): PatientState {
  const env = getEnv();
  const patient = patientState.humanBody;
  if (patient.meta == null) throw 'Unable to find meta for patient';

  if (patient.effects!.length === 0 && patient.revivedPathologies!.length === 0) {
    // Human is stable and will never die
    return patientState;
  }
  // Human is unstable and might die
  const stepDuration = 5;
  const timeJump = 60 * 60 * 4;
  const fromTime = patient.state.time;

  for (let i = stepDuration; i <= timeJump; i += stepDuration) {
    patient.state = computeState(
      patient.state,
      patient.meta,
      env,
      stepDuration,
      patient.revivedPathologies!,
      patient.effects!
    );
    if (patient.state.vitals.respiration.rr === 0) {
      patientState.timeOfDeath = Math.round(i / 60);
      return patientState;
    }
  }

  if (patient.state.time < fromTime + timeJump) {
    patient.state = computeState(
      patient.state,
      patient.meta,
      env,
      fromTime + timeJump - patient.state.time,
      patient.revivedPathologies!,
      patient.effects!
    );
  }

  return patientState;
}

export function computePresetPatientsUntilDeath() {
  const patients = loadPatients();

  for (let i = 0; i < patients.length; i++) {
    patients[i] = computePatientUntilDeath(patients[i]);
  }

  return patients;
}

export function exportAllPatientsTimeOfDeath() {
  const patients = computePresetPatientsUntilDeath();

  const separator = '\t';
  const header: string[] = ['patientId', 'time_to_death'];

  const lines: Record<PatientId, string[]> = {};

  let pathologyHeaderIndex = 0;

  for (let patient of patients) {
    lines[patient.patientId] = [];
    lines[patient.patientId].push(patient.patientId);
    lines[patient.patientId].push(patient.timeOfDeath === 0 ? '.' : String(patient.timeOfDeath));
    for (let pathology of patient.pathologies) {
      lines[patient.patientId].push(pathology);
      pathologyHeaderIndex =
        patient.pathologies.length <= pathologyHeaderIndex
          ? pathologyHeaderIndex
          : patient.pathologies.length;
    }
  }

  for (let i = 0; i < pathologyHeaderIndex; i++) {
    header.push(`pathology_${i + 1}`);
  }

  const result =
    header.join(separator) +
    '\n' +
    Object.values(lines)
      .map(line => {
        return line.join(separator);
      })
      .join('\n');

  Helpers.downloadDataAsFile('timeToDeath.tsv', result);
}
