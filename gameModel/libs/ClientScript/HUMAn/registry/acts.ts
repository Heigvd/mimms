import { ActDefinition, ItemDefinition } from '../../HUMAn/pathology';
import { registryLogger } from '../../tools/logger';
import { BodyStateKeys } from '../human';

let initialized = false;

const DFLT_ACTION_DURATION_LOW = 10;
const DFLT_ACTION_DURATION_HIGH = 5;
let items: Record<string, ItemDefinition> = {};
let acts: Record<string, ActDefinition> = {};

export const PRETRI_ACTION_ID_OPEN_AIRWAYS = 'openAirways';
export const PRETRI_ACTION_ID_RECOVERY_POSITION = 'recoveryPosition';
export const PRETRI_ACTION_ITEM_ID_CAT = 'cat';
export const PRETRI_ACTION_ITEM_ID_BANDAGE = 'bandage';

function registerItem(def: Omit<ItemDefinition, 'type' | 'translationGroup'>): void {
  if (actionDurations[def.id]) {
    // there can be multiple actions related to an item
    // for the following lines assume a single action and sets its duration
    Object.values(def.actions).forEach(elmt => {
      if (elmt && elmt.duration) {
        elmt.duration = JSON.parse(actionDurations[def.id]);
      }
    });
  } else {
    registryLogger.info('using default duration for', def.id);
  }
  items[def.id] = { ...def, type: 'item', translationGroup: 'human-items' };
}

function registerAct(def: Omit<ActDefinition, 'type' | 'translationGroup'>): void {
  if (actionDurations[def.id]) {
    def.action.duration = JSON.parse(actionDurations[def.id]);
  } else {
    registryLogger.info('using default duration for', def.id);
  }
  acts[def.id] = { ...def, type: 'act', translationGroup: 'human-actions' };
}

const actionDurations = Variable.find(gameModel, 'actionsDurations').getProperties();

export type MeasureMetric = {
  metric: BodyStateKeys;
  value: unknown;
};

export function initItemAndActs(
  itemsSet: Record<string, ItemDefinition>,
  actsSet: Record<string, ActDefinition>
) {
  if (initialized) {
    return;
  }

  initialized = true;
  items = itemsSet;
  acts = actsSet;
  // Airways
  ////////////////////////////////////////
  registerAct({
    id: PRETRI_ACTION_ID_RECOVERY_POSITION,
    priority: 0,
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      visible: false,
      blocks: [],
      category: 'A',
      rules: [
        {
          id: '',
          name: '',
          time: 0,
          blockPatch: {},
          variablePatch: {
            bodyPosition: 'RECOVERY',
          },
        },
      ],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: PRETRI_ACTION_ID_OPEN_AIRWAYS,
    priority: 100,
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      visible: false,
      blocks: [],
      category: 'A',
      rules: [],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerItem({
    id: 'guedel',
    //name: 'Guedel',
    priority: 1000,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        category: 'A',
        blocks: ['NECK'],
        visible: true,
        rules: [
          {
            id: 'setup',
            time: 0,
            name: 'setup',
            variablePatch: {},
            blockPatch: {
              intubated: true,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'wendel',
    //name: 'Wendel',
    priority: 1000,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        category: 'A',
        blocks: ['NECK'],
        visible: true,
        rules: [
          {
            id: 'setup',
            time: 0,
            name: 'setup',
            variablePatch: {},
            blockPatch: {
              intubated: true,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'igel',
    //name: 'I-Gel',
    priority: 1000,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        category: 'A',
        blocks: ['NECK'],
        visible: true,
        rules: [
          {
            id: 'setup',
            time: 0,
            name: 'setup',
            variablePatch: {},
            blockPatch: {
              intubated: true,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'mask',
    //name: 'Mask',
    priority: 1000,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        category: 'A',
        blocks: ['HEAD'],
        visible: true,
        rules: [
          {
            id: 'ventilate',
            time: 0,
            name: 'ventilate',
            variablePatch: {},
            blockPatch: {
              fiO2: 0.65,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'balloon',
    //name: 'Balloon',
    priority: 1000,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        category: 'A',
        blocks: ['HEAD'],
        visible: true,
        rules: [
          {
            id: 'ventilate',
            time: 0,
            name: 'ventilate',
            variablePatch: {
              positivePressure: true,
            },
            blockPatch: {},
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'intubate',
    priority: 1000,
    //name: 'intubate',
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        category: 'A',
        targetedObject: 'HumanBody',
        blocks: ['NECK'],
        visible: true,
        rules: [
          {
            id: 'intubate',
            time: 0,
            name: 'intubate',
            variablePatch: {},
            blockPatch: {
              fiO2: 0.21,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'cricotomie',
    priority: 1000,
    //name: 'Cricotomie',
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        category: 'A',
        targetedObject: 'HumanBody',
        blocks: ['NECK'],
        visible: true,
        rules: [
          {
            id: 'cricotomie',
            time: 0,
            name: 'cricotomie',
            variablePatch: {},
            blockPatch: {
              fiO2: 0.21,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  // Breathing
  ////////////////////////////////////////
  registerItem({
    id: '3side',
    priority: 1000,
    //name: '3 sided dressing',
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        category: 'B',
        targetedObject: 'HumanBody',
        blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
        visible: true,
        rules: [
          {
            id: 'setup',
            time: 0,
            name: 'setup',
            variablePatch: {},
            blockPatch: {
              // something: true,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'exsufflation',
    priority: 1000,
    //name: 'Exsufflation',
    disposable: true,
    actions: {
      do: {
        type: 'ActionBodyEffect',
        category: 'B',
        targetedObject: 'HumanBody',
        blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
        visible: false,
        rules: [
          {
            id: 'do',
            time: 0,
            name: 'do',
            variablePatch: {},
            blockPatch: {
              internalPressure: 'RESET',
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'thoracic_drain',
    priority: 1000,
    //name: 'Thoracic Drainage',
    disposable: true,
    actions: {
      drain: {
        type: 'ActionBodyEffect',
        category: 'B',
        targetedObject: 'HumanBody',
        blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
        visible: true,
        rules: [
          {
            id: 'drain',
            time: 0,
            name: 'drain',
            variablePatch: {},
            blockPatch: {
              internalPressure: 'DRAIN',
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerAct({
    id: 'measureRR',
    priority: 0,
    //name: 'Respiratory Rate',
    action: {
      category: 'B',
      type: 'ActionBodyMeasure',
      targetedObject: 'HumanBody',
      metricName: ['vitals.respiration.rr'],
      duration: { low_skill: 15, high_skill: 15 },
    },
  });

  registerItem({
    id: 'oxymeter',
    //name: 'Pulse Oxymeter',
    priority: 100,
    disposable: false,
    actions: {
      measure: {
        type: 'ActionBodyMeasure',
        category: 'B',
        targetedObject: 'HumanBody',
        metricName: ['vitals.respiration.SpO2'],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  // Circulation
  ////////////////////////////////////////
  registerItem({
    id: PRETRI_ACTION_ITEM_ID_CAT,
    //name: 'CAT',
    priority: 0,
    disposable: true,
    actions: {
      setup: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        visible: true,
        blocks: [
          'LEFT_LEG',
          'RIGHT_LEG',
          'LEFT_THIGH',
          'RIGHT_THIGH',
          'LEFT_ARM',
          'LEFT_FOREARM',
          'RIGHT_ARM',
          'RIGHT_FOREARM',
          'NECK',
        ],
        rules: [
          {
            id: 'setup',
            time: 0,
            name: 'setup CAT',
            variablePatch: {},
            blockPatch: {
              bloodFlow: false,
              airResistance: 1,
              pain: 5,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: PRETRI_ACTION_ITEM_ID_BANDAGE,
    //name: 'Bandage',
    priority: 200,
    disposable: true,
    actions: {
      pack: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        blocks: ['ABDOMEN'],
        visible: true,
        rules: [
          {
            id: 'doPack',
            time: 0,
            name: 'Packing',
            variablePatch: {},
            blockPatch: {
              venousBleedingReductionFactor: 0.5,
              arterialBleedingReductionFactor: 0.5,
              internalBleedingReductionFactor: 0,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
      pressureBandage: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        visible: true,
        blocks: [
          'LEFT_FOOT',
          'RIGHT_FOOT',
          'LEFT_ANKLE',
          'RIGHT_ANKLE',
          'LEFT_LEG',
          'RIGHT_LEG',
          'LEFT_KNEE',
          'RIGHT_KNEE',
          'LEFT_THIGH',
          'RIGHT_THIGH',
          'LEFT_HAND',
          'RIGHT_HAND',
          'LEFT_WRIST',
          'RIGHT_WRIST',
          'LEFT_ELBOW',
          'RIGHT_ELBOW',
          'LEFT_ARM',
          'RIGHT_ARM',
          'LEFT_SHOULDER',
          'RIGHT_SHOULDER',
          'LEFT_FOREARM',
          'RIGHT_FOREARM',
          'NECK',
          'HEAD',
        ],
        rules: [
          {
            id: 'pressureBandage',
            time: 0,
            name: 'Pressure Bandage',
            variablePatch: {},
            blockPatch: {
              venousBleedingReductionFactor: 0.7,
              arterialBleedingReductionFactor: 0.15,
              internalBleedingReductionFactor: 0,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'TranexamicAcid_1000',
    //name: 'Tranexamic Acid 500mg',
    priority: 1000,
    disposable: true,
    actions: {
      inject: {
        type: 'ActionBodyEffect',
        targetedObject: 'HumanBody',
        visible: false,
        blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
        category: 'C',
        rules: [
          {
            id: 'inject',
            time: 0,
            name: 'inject potion',
            variablePatch: {},
            blockPatch: {
              chemicals: {
                TranexamicAcid: {
                  once: 1000,
                },
              },
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'SalineSolution_100ml',
    priority: 500,
    disposable: true,
    actions: {
      inject: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        visible: true,
        blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
        rules: [
          {
            id: 'inject',
            time: 0,
            name: 'inject saline',
            variablePatch: {},
            blockPatch: {
              salineSolutionInput_mLperMin: 100,
            },
          },
          {
            id: 'empty',
            time: 60,
            name: '',
            variablePatch: {},
            blockPatch: {
              salineSolutionInput_mLperMin: -100,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'SalineSolution_500ml',
    //name: 'NaCl 0.9% 100mL',
    priority: 500,
    disposable: true,
    actions: {
      inject: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
        visible: true,
        rules: [
          {
            id: 'inject',
            time: 0,
            name: 'inject',
            variablePatch: {},
            blockPatch: {
              salineSolutionInput_mLperMin: 100,
            },
          },
          {
            id: 'empty',
            time: 300,
            name: '',
            variablePatch: {},
            blockPatch: {
              salineSolutionInput_mLperMin: -100,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerItem({
    id: 'Blood_500ml',
    //name: 'Blood 1L',
    priority: 600,
    disposable: true,
    actions: {
      inject: {
        type: 'ActionBodyEffect',
        category: 'C',
        targetedObject: 'HumanBody',
        blocks: ['LEFT_ARM', 'RIGHT_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'NECK'],
        visible: true,
        rules: [
          {
            id: 'inject',
            time: 0,
            name: 'inject blood',
            variablePatch: {},
            blockPatch: {
              bloodInput_mLperMin: 100,
            },
          },
          {
            id: 'empty',
            time: 300,
            name: '',
            variablePatch: {},
            blockPatch: {
              bloodInput_mLperMin: -100,
            },
          },
        ],
        createActions: [],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  registerAct({
    id: 'measureHR',
    priority: 0,
    //name: 'Heart Rate',
    action: {
      type: 'ActionBodyMeasure',
      category: 'C',
      targetedObject: 'HumanBody',
      metricName: ['vitals.cardio.hr'],
      duration: { low_skill: 15, high_skill: 10 },
    },
  });

  registerAct({
    id: 'measureCRT',
    priority: 10,
    //name: 'CRT',
    action: {
      type: 'ActionBodyMeasure',
      category: 'C',
      targetedObject: 'HumanBody',
      metricName: ['vitals.capillaryRefillTime_s'],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerItem({
    id: 'sphygmomanometer',
    //name: 'Blood Pressure gauge',
    priority: 20,
    disposable: false,
    actions: {
      measure: {
        category: 'C',
        type: 'ActionBodyMeasure',
        targetedObject: 'HumanBody',
        metricName: ['vitals.cardio.MAP'],
        duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
      },
    },
  });

  // Disabilities
  ////////////////////////////////////////

  registerAct({
    id: 'measureGCS',
    //name: 'GCS',
    priority: 0,
    action: {
      type: 'ActionBodyMeasure',
      category: 'D',
      targetedObject: 'HumanBody',
      metricName: [
        'vitals.glasgow.total',
        'vitals.glasgow.eye',
        'vitals.glasgow.verbal',
        'vitals.glasgow.motor',
      ],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: 'measureMotricity',
    //name: 'GCS',
    priority: 10,
    action: {
      type: 'ActionBodyMeasure',
      category: 'D',
      targetedObject: 'HumanBody',
      metricName: [
        'vitals.motricity.leftArm',
        'vitals.motricity.rightArm',
        'vitals.motricity.leftLeg',
        'vitals.motricity.rightLeg',
      ],
      duration: { low_skill: 4, high_skill: 4 },
    },
  });

  // Etc
  ////////////////////////////////////////
  registerAct({
    id: 'canYouWalk',
    priority: 0,
    //name: 'Can you walk?',
    action: {
      type: 'ActionBodyMeasure',
      category: 'Z',
      targetedObject: 'HumanBody',
      metricName: ['vitals.canWalk'],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: 'painLevel',
    priority: 10,
    action: {
      type: 'ActionBodyMeasure',
      category: 'Z',
      targetedObject: 'HumanBody',
      metricName: ['vitals.visiblePain'],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  // Etc
  ////////////////////////////////////////

  registerAct({
    id: 'sitDown',
    //name: 'Sit down',
    priority: 0,
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      blocks: [],
      category: 'Z',
      visible: false,
      rules: [
        {
          id: '',
          name: '',
          time: 0,
          blockPatch: {},
          variablePatch: {
            bodyPosition: 'SITTING',
          },
        },
      ],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: 'proneDecubitus',
    priority: 10,
    //name: 'Prone decubitus',
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      blocks: [],
      category: 'Z',
      visible: false,
      rules: [
        {
          id: '',
          name: '',
          time: 0,
          blockPatch: {},
          variablePatch: {
            bodyPosition: 'PRONE_DECUBITUS',
          },
        },
      ],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: 'supineDecubitus',
    //name: 'Supine decubitus',
    priority: 20,
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      blocks: [],
      category: 'Z',
      visible: false,
      rules: [
        {
          id: '',
          name: '',
          time: 0,
          blockPatch: {},
          variablePatch: {
            bodyPosition: 'SUPINE_DECUBITUS',
          },
        },
      ],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  registerAct({
    id: 'getUp',
    //name: 'Get UP',
    priority: 30,
    action: {
      type: 'ActionBodyEffect',
      targetedObject: 'HumanBody',
      blocks: [],
      category: 'Z',
      visible: false,
      rules: [
        {
          id: '',
          name: '',
          time: 0,
          blockPatch: {},
          variablePatch: {
            bodyPosition: 'STANDING',
          },
        },
      ],
      createActions: [],
      duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
    },
  });

  /*
	registerAct({
		id: 'areYouDead?',
		name: 'Are you dead?',
		action: {
			category: 'Z',
			type: 'ActionBodyMeasure',
			name: 'dead',
			targetedObject: 'HumanBody',
			metricName: ['vitals.cardiacArrest'],
			duration: { low_skill: DFLT_ACTION_DURATION_LOW, high_skill: DFLT_ACTION_DURATION_HIGH },
		},
	});*/
}
