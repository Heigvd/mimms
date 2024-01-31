import {
  Block,
  BlockName,
  BodyEffect,
  BodyPosition,
  BodyState,
  BodyStateKeys,
  computeState,
  createHumanBody,
  defaultMeta,
  doActionOnHumanBody,
  enableCoagulation,
  enableLungsVasoconstriction,
  enableVasoconstriction,
  readKey,
} from './human';
import { logger, vitalsLogger, calcLogger } from '../tools/logger';
import { RevivedPathology, revivePathology } from './pathology';

import { getAct, getChemical, getItem } from './registries';
import {
  getBodyParam,
  getCurrentPatientId,
  getEnv,
  saveToObjectInstance,
  TestScenario,
} from '../tools/WegasHelper';

function saveMetrics(output: object, vdName: keyof VariableClasses) {
  const oi = Variable.find(gameModel, vdName).getInstance(self) as SObjectInstance;

  saveToObjectInstance(oi, output);
}

type Coord = [number, number];

interface Metrics {
  [key: string]: Coord[] | { [sub: string]: Coord[] };
}

function pushMetric(key: string, time: number, value: number, output: Metrics) {
  let data = output[key];
  if (data == null) {
    data = [];
    output[key] = data;
  }

  if (Array.isArray(data)) {
    data.push([time, value]);
  } else {
    throw 'incompatible metric type';
  }
}

function pushComposedMetric(
  key: string,
  time: number,
  values: { [key: string]: number },
  output: Metrics,
) {
  let data = output[key];
  if (data == null) {
    data = {};
    output[key] = data;
  }

  if (!Array.isArray(data)) {
    for (const k in values) {
      const value = values[k];
      if (value != null) {
        data[k] = data[k] || [];
        data[k]!.push([time, value]);
      }
    }
  } else {
    throw 'incompatible metric type';
  }
}

function pushBloodBlockMetrics(prefix: string, block: Block, time: number, output: Metrics) {
  pushComposedMetric(
    block.name,
    time,
    {
      extLosses: block.params.totalExtLosses_ml || 0,
      intLosses: block.params.totalInternalLosses_ml || 0,
      ['Qc ' + block.name]: block.params.bloodFlow_mLper || 0,
    },
    output,
  );
}

function convertPositionToNumber(position: BodyPosition): number {
  switch (position) {
    case 'STANDING':
      return 10;
    case 'SITTING':
      return 5;
    case 'PRONE_DECUBITUS':
      return 2;
    case 'SUPINE_DECUBITUS':
      return 2;
    case 'RECOVERY':
      return 1;
  }
}

function extractMetric(
  body: BodyState,
  time: number,
  outputResp: { [key: string]: [number, number][] },
  outputCardio: { [key: string]: [number, number][] },
  outputOther: { [key: string]: [number, number][] },
) {
  pushMetric('SaO2', time, body.vitals.respiration.SaO2 * 100, outputResp);
  pushMetric('SpO2', time, body.vitals.respiration.SpO2 * 100, outputResp);
  pushMetric('CaO2 [mL/L]', time, body.vitals.respiration.CaO2, outputResp);

  pushComposedMetric(
    'PaO2 [mmHg]',
    time,
    {
      PaO2: body.vitals.respiration.PaO2,
      PaCO2: body.vitals.respiration.PaCO2,
    },
    outputResp,
  );

  pushComposedMetric(
    'DO2',
    time,
    {
      'DO2Sys [mL/min]': body.vitals.cardio.DO2Sys,
      'VO2 [mL/min]': body.vitals.cardio.vo2_mLperMin,
    },
    outputResp,
  );
  pushMetric('DO2Brain [mL/min]', time, body.vitals.brain.DO2, outputResp);

  pushMetric('RR', time, body.vitals.respiration.rr, outputResp);

  pushComposedMetric(
    'Respiration volumes',
    time,
    {
      tidal: body.vitals.respiration.tidalVolume_L,
      'alv.': body.vitals.respiration.alveolarVolume_L,
    },
    outputResp,
  );

  const ip_left = body.blocks.get('THORAX_LEFT')!.params.internalPressure;
  const ip_right = body.blocks.get('THORAX_RIGHT')!.params.internalPressure;
  const nIp_left = typeof ip_left === 'number' ? ip_left : 0;
  const nIp_right = typeof ip_right === 'number' ? ip_right : 0;

  pushComposedMetric(
    'Thorax',
    time,
    {
      itp_left: nIp_left,
      itp_right: nIp_right,
    },
    outputCardio,
  );

  pushMetric('1 - HR', time, body.vitals.cardio.hr, outputCardio);
  pushMetric('2 - MAP', time, body.vitals.cardio.MAP, outputCardio);

  pushBloodBlockMetrics('9001 - ', body.blocks.get('MEDIASTINUM')!, time, outputCardio);
  pushBloodBlockMetrics('9002 - ', body.blocks.get('NECK')!, time, outputCardio);
  pushBloodBlockMetrics('9003 - ', body.blocks.get('HEAD')!, time, outputCardio);
  pushBloodBlockMetrics('9004 - ', body.blocks.get('BRAIN')!, time, outputCardio);
  pushBloodBlockMetrics('9100 - ', body.blocks.get('ABDOMEN')!, time, outputCardio);
  pushBloodBlockMetrics('9110 - ', body.blocks.get('PELVIS')!, time, outputCardio);

  pushBloodBlockMetrics('9021 - ', body.blocks.get('LEFT_SHOULDER')!, time, outputCardio);
  pushBloodBlockMetrics('9022 - ', body.blocks.get('LEFT_ARM')!, time, outputCardio);
  pushBloodBlockMetrics('9023 - ', body.blocks.get('LEFT_FOREARM')!, time, outputCardio);
  pushBloodBlockMetrics('9024 - ', body.blocks.get('LEFT_HAND')!, time, outputCardio);

  pushBloodBlockMetrics('9121 - ', body.blocks.get('LEFT_THIGH')!, time, outputCardio);
  pushBloodBlockMetrics('9122 - ', body.blocks.get('LEFT_LEG')!, time, outputCardio);
  pushBloodBlockMetrics('9123 - ', body.blocks.get('LEFT_FOOT')!, time, outputCardio);

  pushBloodBlockMetrics('9031 - ', body.blocks.get('RIGHT_SHOULDER')!, time, outputCardio);
  pushBloodBlockMetrics('9032 - ', body.blocks.get('RIGHT_ARM')!, time, outputCardio);
  pushBloodBlockMetrics('9033 - ', body.blocks.get('RIGHT_FOREARM')!, time, outputCardio);
  pushBloodBlockMetrics('9034- ', body.blocks.get('RIGHT_HAND')!, time, outputCardio);

  pushBloodBlockMetrics('9131 - ', body.blocks.get('RIGHT_THIGH')!, time, outputCardio);
  pushBloodBlockMetrics('9132 - ', body.blocks.get('RIGHT_LEG')!, time, outputCardio);
  pushBloodBlockMetrics('9133 - ', body.blocks.get('RIGHT_FOOT')!, time, outputCardio);

  pushComposedMetric(
    'Intercranial',
    time,
    {
      ICP: body.vitals.brain.ICP_mmHg,
      mass: body.variables.intercranialMass,
    },
    outputOther,
  );

  //pushMetric("Blood", time, body.vitals.cardio.totalVolume_mL, output);
  //pushMetric("Water", time, body.vitals.cardio.totalVolumeOfWater_mL, output);

  pushComposedMetric(
    '9000 - Blood',
    time,
    {
      total: body.vitals.cardio.totalVolume_mL,
      red: body.vitals.cardio.totalVolumeOfErythrocytes_mL,
      water: body.vitals.cardio.totalVolumeOfWater_mL,
      white: body.vitals.cardio.totalVolumeOfWhiteBloodCells_mL,
      proteins: body.vitals.cardio.totalVolumeOfPlasmaProteins_mL,
    },
    outputCardio,
  );

  pushComposedMetric(
    '9000 - Heart',
    time,
    {
      'EDV [mL]': body.vitals.cardio.endDiastolicVolume_mL,
      'ESV [mL]': body.vitals.cardio.endSystolicVolume_mL,
      'Stroke Vol.': body.vitals.cardio.strokeVolume_mL,
    },
    outputCardio,
  );

  pushMetric('3 - Ra', time, body.vitals.cardio.Ra_mmHgMinPerL, outputCardio);
  //pushMetric("Rv", time, body.vitals.cardio.Rrv_mmHgMinPerL, output);

  pushMetric('4 - CRT [s]', time, body.vitals.capillaryRefillTime_s ?? 10, outputCardio);

  pushMetric('9000 - Qc [L/min]', time, body.vitals.cardio.cardiacOutput_LPerMin, outputCardio);
  //pushMetric("Qrv [mL/min]", time, body.vitals.cardio.cardiacOutputRv_LPerMin, output);

  pushMetric('para|ortho', time, body.variables.paraOrthoLevel, outputOther);

  pushMetric('pain', time, body.vitals.pain, outputOther);

  pushMetric('contractilityBoost', time, body.vitals.cardio.contractilityBoost, outputOther);

  pushMetric('position', time, convertPositionToNumber(body.variables.bodyPosition), outputOther);

  vitalsLogger.info('Extract Chemicals', body.vitals.cardio.chemicals);
  /*const at = body.vitals.cardio.chemicals['TranexamicAcid'];
	vitalsLogger.info("at: ", at);
	if (at != null) {
		pushMetric("Acide Tranéxamique [HL]", time, at, output);
	} else {
		pushMetric("Acide Tranéxamique [HL]", time, 0, output);
	}

	const at2 = body.vitals.cardio.chemicals['TranexamicAcid_Clearance'];
	vitalsLogger.info("at2: ", at2);
	if (at != null) {
		pushMetric("Acide Tranéxamique CL", time, at2, output);
	} else {
		pushMetric("Acide Tranéxamique CL", time, 0, output);
	}*/

  const chemicals = Object.entries(body.vitals.cardio.chemicals).reduce<Record<string, number>>(
    (acc, [chemId, value]) => {
      const chem = getChemical(chemId);
      if (chem) {
        acc[chem.id] = value;
      } else {
        acc[chemId] = value;
      }
      return acc;
    },
    {},
  );

  pushComposedMetric('Chemicals', time, chemicals, outputCardio);

  pushComposedMetric(
    'GCS',
    time,
    {
      total: body.vitals.glasgow.total,
      eye: body.vitals.glasgow.eye,
      motor: body.vitals.glasgow.motor,
      verbal: body.vitals.glasgow.verbal,
    },
    outputOther,
  );
}

function internal_run(
  patientId: string,
  duration: number,
  cb: (bodyState: BodyState, time: number) => void,
  scenario: TestScenario,
) {
  // Load env
  const env = getEnv();

  // Load model configuration
  enableVasoconstriction(Variable.find(gameModel, 'vasoconstriction').getValue(self));
  enableCoagulation(Variable.find(gameModel, 'coagulation').getValue(self));
  enableLungsVasoconstriction(Variable.find(gameModel, 'vasoconstrictionLungs').getValue(self));

  /*const system = loadSystem();
	compLogger.info('(para)Sympathetic System: ', system);
	setSystemModel(system);*/

  /*const compensation = getCompensationModel();
	compLogger.info('Compensation Profile: ', compensation);
	setCompensationModel(compensation);*/

  /*const overdrive = getOverdriveModel();
	compLogger.info('Overdrive Profile: ', overdrive);
	setOverdriveModel(overdrive);*/

  // Body Setup
  const meta = getBodyParam(patientId) || defaultMeta;
  const initialBody = createHumanBody(meta, env);
  calcLogger.info('Start with ', initialBody.state);

  calcLogger.info('ENV', env);
  let i: number;
  const body = initialBody;
  cb(body.state, 0);

  //const scenario = getCurrentScenario();

  logger.warn('Events: ', scenario.events);

  const effects: BodyEffect[] = [];
  const pathologies: RevivedPathology[] = [];

  // load scenario
  scenario.events.forEach(event => {
    if (event.type === 'HumanPathology') {
      try {
        const pathology = revivePathology(event, event.time);
        pathologies.push(pathology);
        logger.info('Afflict Pathology: ', { pathology, time: event.time });
      } catch {
        logger.warn(`Afflict Pathology Failed: Pathology "${event.pathologyId}" does not exist`);
      }
    } else if (event.type === 'HumanTreatment') {
      if (event.source.type === 'act') {
        const act = getAct(event.source.actId);
        if (act) {
          if (act.action.type === 'ActionBodyEffect') {
            logger.info('Do Act: ', { time: event.time, act });
            effects.push(
              doActionOnHumanBody(act, act.action, 'default', event.blocks, event.time)!,
            );
          } else {
            logger.info('Ignore measure');
          }
        }
      } else if (event.source.type === 'itemAction') {
        const item = getItem(event.source.itemId);
        const action = item?.actions[event.source.actionId];
        if (action != null) {
          if (action.type === 'ActionBodyEffect') {
            logger.info('Apply Item: ', { time: event.time, item, action });
            effects.push(
              doActionOnHumanBody(item!, action, event.source.actionId, event.blocks, event.time)!,
            );
          } else {
            logger.info('Ignore measure');
          }
        } else {
          logger.warn(
            `Item Action Failed: Event/Action "${event.source.itemId}/${event.source.actionId}`,
          );
        }
      }
    }
  });

  wlog('Scenario: ', { pathologies, effects });

  //doItemActionOnHumanBody(tracheostomyTube.actions[0]!, body, 'NECK', 25);

  calcLogger.warn('Start');
  // eslint-disable-next-line no-console
  console.time('Human.run');
  //Helpers.cloneDeep(body.state);

  const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);
  for (i = 1; i <= duration; i += stepDuration) {
    logger.info(`Run ${i}`);

    const newState = computeState(body.state, body.meta, env, stepDuration, pathologies, effects);
    calcLogger.info(' -> ', newState);

    body.state = newState;
    // extract vitals
    // extractMetric(newState, i, outputResp);
    cb(body.state, body.state.time);
  }

  calcLogger.info('End with ', initialBody.state);
  calcLogger.warn('Done');
  // eslint-disable-next-line no-console
  console.timeEnd('Human.run');

  return body;
}

function getPatientTestScenario(patientId: string): TestScenario {
  const scenario: TestScenario = {
    description: '',
    events: [],
  };

  const param = getBodyParam(patientId);

  (param?.scriptedEvents || []).forEach(sP => {
    if (sP.payload.type === 'HumanPathology' || sP.payload.type === 'HumanTreatment')
      scenario.events.push({
        ...sP.payload,
        time: sP.time,
      });
  });

  return scenario;
}

function getCurrentPatientTestScenario(): TestScenario {
  return getPatientTestScenario(getCurrentPatientId());
}

export function run() {
  const duration = Variable.find(gameModel, 'duration_s').getValue(self);

  const outputResp = {};
  const outputCardio = {};
  const outputOther = {};

  const patientId = getCurrentPatientId();
  const scenario: TestScenario = getCurrentPatientTestScenario();

  internal_run(
    patientId,
    duration,
    (state, time) => {
      extractMetric(state, time, outputResp, outputCardio, outputOther);
    },
    scenario,
  );

  saveMetrics(outputResp, 'output');
  saveMetrics(outputCardio, 'outputCardio');
  saveMetrics(outputOther, 'outputOther');
}

type Time = number;

// ts-unused-exports:disable-next-line
export type Serie = Record<Time, unknown>;

const clKeys = [
  'vitals.canWalk_internal',
  'vitals.cardio.hr',
  'vitals.cardio.MAP',
  'vitals.respiration.SpO2',
  'vitals.respiration.rr',
  'vitals.glasgow.total',
] as const;

export type ClKeys = typeof clKeys[number];

const phKeys = [
  'vitals.respiration.PaO2',
  'vitals.respiration.PaCO2',
  'vitals.respiration.alveolarVolume_L',
  'vitals.cardio.totalVolume_mL',
  'vitals.cardio.strokeVolume_mL',
  'vitals.brain.ICP_mmHg',
] as const;

export type PhKeys = typeof phKeys[number];

export interface LikertData {
  clinical: Record<ClKeys, Serie>;
  physiological: Record<PhKeys, Serie>;
}

const fourHours = 60 * 60 * 4;

export function run_likert(patientId: string) {
  const data: LikertData = {
    clinical: {
      'vitals.canWalk_internal': {},
      'vitals.cardio.hr': {},
      'vitals.cardio.MAP': {},
      'vitals.respiration.SpO2': {},
      'vitals.respiration.rr': {},
      'vitals.glasgow.total': {},
    },
    physiological: {
      'vitals.respiration.PaO2': {},
      'vitals.respiration.PaCO2': {},
      'vitals.respiration.alveolarVolume_L': {},
      'vitals.cardio.totalVolume_mL': {},
      'vitals.cardio.strokeVolume_mL': {},
      'vitals.brain.ICP_mmHg': {},
    },
  };

  const scenario: TestScenario = getPatientTestScenario(patientId);

  const body = internal_run(
    patientId,
    fourHours,
    (state, time) => {
      //cardiacArrest = cardiacArrest ?? state.vitals.cardiacArrest;
      clKeys.forEach(k => {
        const value = readKey(state, k as BodyStateKeys);
        data.clinical[k][time] = value;
      });

      phKeys.forEach(k => {
        const value = readKey(state, k as BodyStateKeys);
        data.physiological[k]![time] = value;
      });
    },
    scenario,
  );

  const cardiacArrest = body.state.vitals.cardiacArrest;

  const t4 = cardiacArrest || fourHours;
  const t0 = 0;
  const t1 = Math.round(Math.floor(t4 / 20) * 5);
  const t2 = t1 * 2;
  const t3 = t1 + t2;

  const times = [t0, t1, t2, t3, t4];

  const clean: LikertData = {
    clinical: {
      'vitals.canWalk_internal': {},
      'vitals.cardio.hr': {},
      'vitals.cardio.MAP': {},
      'vitals.respiration.SpO2': {},
      'vitals.respiration.rr': {},
      'vitals.glasgow.total': {},
    },
    physiological: {
      'vitals.respiration.PaO2': {},
      'vitals.respiration.PaCO2': {},
      'vitals.respiration.alveolarVolume_L': {},
      'vitals.cardio.totalVolume_mL': {},
      'vitals.cardio.strokeVolume_mL': {},
      'vitals.brain.ICP_mmHg': {},
    },
  };

  times.forEach(time => {
    clKeys.forEach(k => {
      clean.clinical[k][time] = data.clinical[k][time];
    });

    phKeys.forEach(k => {
      clean.physiological[k][time] = data.physiological[k][time];
    });
  });

  return { data: clean, cardiacArrest: cardiacArrest };
}

export function batch() {
  const patientId = 'patient-1';

  const blocks: BlockName[] = [
    'HEAD',
    'NECK',
    'THORAX_LEFT',
    'LEFT_SHOULDER',
    'LEFT_ARM',
    'LEFT_ELBOW',
    'LEFT_FOREARM',
    'LEFT_WRIST',
    'LEFT_HAND',
    'LEFT_THIGH',
    'LEFT_KNEE',
    'LEFT_LEG',
    'LEFT_ANKLE',
    'LEFT_FOOT',
  ];

  const allData: string[][] = [];
  const headers: string[] = ['block'];

  for (let arg = 0; arg <= 0.1; arg += 0.01) {
    headers.push('' + arg);
  }
  allData.push(headers);

  blocks.forEach(block => {
    const data: string[] = [block];

    for (let arg = 0; arg <= 0.1; arg += 0.01) {
      const scenario: TestScenario = {
        description: '',
        events: [
          {
            type: 'HumanPathology',
            time: 1,
            pathologyId: 'catastrophic_vh',
            afflictedBlocks: [block],
            modulesArguments: [
              {
                type: 'HemorrhageArgs',
                bleedingFactor: arg,
                instantaneousBloodLoss: undefined,
              },
            ],
          },
        ],
      };

      const body = internal_run(patientId, fourHours, () => {}, scenario);

      data.push(`${body.state.vitals.cardiacArrest || 'alive'}`);
    }
    allData.push(data);
  });

  Helpers.downloadDataAsFile('run.csv', allData.map(line => line.join(', ')).join('\n'));
}
