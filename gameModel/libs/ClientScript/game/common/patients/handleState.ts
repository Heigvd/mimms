import { getEnv, getPatientsBodyFactoryParamsArray } from '../../../tools/WegasHelper';
import {
  BodyEffect,
  computeState,
  createHumanBody,
  doActionOnHumanBody,
  Environnment,
  HumanBody,
} from '../../../HUMAn/human';
import { mainSimLogger } from '../../../tools/logger';
import { AfflictedPathology, RevivedPathology, revivePathology } from '../../../HUMAn/pathology';
import { getAct, getItem } from '../../../HUMAn/registries';
import { PatientState } from '../simulationState/patientState';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { getPresetByName } from '../../../edition/patientPreset';

const currentPatientPreset = 'CERN 12 Mai';

export function loadPatients(): PatientState[] {
  const env = getEnv();
  const preset = getPresetByName(currentPatientPreset);

  const humanBodies = getPatientsBodyFactoryParamsArray()
    // TODO: temporarily filtering hardcoded preset, should be handled in UI
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

  mainSimLogger.info('Adding', humanBodies.length, 'patients');

  return humanBodies.flatMap(humanBody => {
    return {
      patientId: humanBody.id!,
      humanBody: humanBody,
      preTriageResult: undefined,
      location: LOCATION_ENUM.chantier,
    };
  });
}

export function computeInitialAfflictedPathologies(
  patient: HumanBody
): [AfflictedPathology, number][] {
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

export function computeInitialEffects(patient: HumanBody): BodyEffect[] {
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

export function reviveAfflictedPathologies(
  afflictedPathologies: [AfflictedPathology, number][]
): RevivedPathology[] {
  const pathologies: RevivedPathology[] = [];
  afflictedPathologies.forEach(afflictedPathologyTuple => {
    const revivedpathology = revivePathology(
      afflictedPathologyTuple[0],
      afflictedPathologyTuple[1]
    );
    pathologies.push(revivedpathology);
    mainSimLogger.debug('Revived Pathology: ', {
      revivedpathology,
      time: afflictedPathologyTuple[1],
    });
  });

  return pathologies;
}

export function computeNewPatientsState(
  patients: PatientState[],
  timeJump: number,
  env: Environnment
): void {
  const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
  patients
    .map(patient => patient.humanBody)
    .forEach(patient => {
      if (patient.meta == null) throw `Unable to find meta for patient`;

      const from = patient.state.time;

      if (patient.effects!.length === 0 && patient.revivedPathologies!.length === 0) {
        // no need to compute state; Human is stable
        patient.state.time = from + timeJump;
        mainSimLogger.info('Skip Human');
      } else {
        mainSimLogger.debug('Update Human');
        for (let i = stepDuration; i <= timeJump; i += stepDuration) {
          mainSimLogger.debug('Compute Human Step ', {
            currentTime: patient.state.time,
            stepDuration,
            patient: patient.revivedPathologies,
          });
          computeState(
            patient.state,
            patient.meta,
            env,
            stepDuration,
            patient.revivedPathologies!,
            patient.effects!
          );
          mainSimLogger.debug('Step Time: ', patient.state.time);
        }

        // last tick
        if (patient.state.time < from + timeJump) {
          mainSimLogger.debug('Compute Human Step ', {
            currentTime: patient.state.time,
            stepDuration: timeJump - patient.state.time,
            patient: patient.revivedPathologies,
          });
          computeState(
            patient.state,
            patient.meta,
            env,
            from + timeJump - patient.state.time,
            patient.revivedPathologies!,
            patient.effects!
          );
        }
        mainSimLogger.debug('FinalStateTime: ', patient.state.time);
      }
    });
}
