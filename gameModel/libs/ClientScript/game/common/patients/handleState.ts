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
import { PatientLocation, PatientState } from '../simulationState/patientState';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { getPresetByName } from '../../../edition/patientPreset';
import { PatientEvolutionEVACTimeModifier, PatientEvolutionPMATimeModifier } from '../constants';

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
      location: { kind: 'FixedMapEntity', locationId: LOCATION_ENUM.chantier },
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

/**
 * Patient evolution varies depending on locations
 * time is artificially slowed down to simulate that they are being taken care of
 */
function computeVirtualElapsedTime(timeJump: number, location: PatientLocation): number {
  let modifier = 1;
  if (location.kind === 'Hospital') {
    modifier = PatientEvolutionEVACTimeModifier;
  } else {
    switch (location.locationId) {
      case 'remote': // being evacuated
        modifier = PatientEvolutionEVACTimeModifier;
        break;
      case 'PMA':
        modifier = PatientEvolutionPMATimeModifier;
        break;
      default:
        modifier = 1;
        break;
    }
  }
  return timeJump * modifier;
}

export function computeNewPatientsState(
  patients: PatientState[],
  timeJump: number,
  env: Environnment
): void {
  const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
  patients.forEach(patient => {
    const body = patient.humanBody;
    if (body.meta == null) throw `Unable to find meta for patient`;
    const from = body.state.time;
    const virtualElapsed = computeVirtualElapsedTime(timeJump, patient.location);

    if (
      virtualElapsed === 0 ||
      (body.effects!.length === 0 && body.revivedPathologies!.length === 0)
    ) {
      // no need to compute state; Human is stable
      mainSimLogger.info('Skip Human');
    } else {
      mainSimLogger.debug('Update Human');
      for (let i = stepDuration; i <= virtualElapsed; i += stepDuration) {
        mainSimLogger.debug('Compute Human Step ', {
          patientId: patient.patientId,
          currentTime: body.state.time,
          stepDuration,
          patient: body.revivedPathologies,
        });
        computeState(
          body.state,
          body.meta,
          env,
          stepDuration,
          body.revivedPathologies!,
          body.effects!
        );
        mainSimLogger.debug('Step Time: ', body.state.time);
      }

      // last tick
      if (body.state.time < from + virtualElapsed) {
        mainSimLogger.debug('Compute Human Step ', {
          patientId: patient.patientId,
          currentTime: body.state.time,
          stepDuration: from + virtualElapsed - body.state.time,
          patient: body.revivedPathologies,
        });
        computeState(
          body.state,
          body.meta,
          env,
          from + virtualElapsed - body.state.time,
          body.revivedPathologies!,
          body.effects!
        );
      }

      mainSimLogger.debug('FinalVirtualStateTime: ', patient.patientId, body.state.time);
    }
    // artificially update time to real elapsed time
    body.state.time = from + timeJump;
    mainSimLogger.debug('FinalStateTime: ', patient.patientId, body.state.time);
  });
}
