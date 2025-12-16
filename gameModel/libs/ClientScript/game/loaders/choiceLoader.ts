// TODO Remove, choices are to be hardcoded in ActionTemplates

import { generateId } from '../../tools/helper';
import { createOrUpdateTranslation } from '../../tools/translation';
import { ChoiceDescriptor } from '../common/actions/choiceDescriptor/choiceDescriptor';

///// MOCK DATA /////

const mapChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'jFnAq2zo9c',
  activableType: 'choice',
  tag: 'map_choice_1_tag',
  title: createOrUpdateTranslation('map_choice_1 title', undefined),
  description: createOrUpdateTranslation('map_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'nKuZgArPyP',
  defaultEffect: 'KJ3CnCwdTD',
  effects: [
    {
      type: 'effect',
      parent: 'jFnAq2zo9c',
      index: 0,
      uid: 'KJ3CnCwdTD',
      tag: 'map_choice_1_effect_tag',
      impacts: [
        {
          type: 'notification',
          uid: 'xS6FL6ptmQ',
          index: 0,
          message: createOrUpdateTranslation("Hello, is it me you're looking for ?", undefined),
          roles: {
            AL: true,
            ACS: true,
            MCS: true,
            CASU: false,
            EVASAN: true,
            LEADPMA: true,
          },
          delaySeconds: 0,
        },
      ],
    },
  ],
};

const mapChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'uzlkQQESU0',
  activableType: 'choice',
  tag: 'map_choice_2_tag',
  title: createOrUpdateTranslation('map_choice_2 title', undefined),
  description: createOrUpdateTranslation('map_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'Q3JL42XIBO',
  defaultEffect: 'altZGsjhMs',
  effects: [
    {
      type: 'effect',
      parent: 'uzlkQQESU0',
      index: 0,
      uid: 'altZGsjhMs',
      tag: 'map_choice_1_effect_tag',
      impacts: [
        {
          type: 'notification',
          uid: 'mDFvzt02e6',
          index: 0,
          message: createOrUpdateTranslation("Hello, is it me you're looking for ?", undefined),
          roles: {
            AL: true,
            ACS: true,
            MCS: true,
            CASU: false,
            EVASAN: true,
            LEADPMA: true,
          },
          delaySeconds: 0,
        },
      ],
    },
  ],
};

const mapChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'Q5kyFc3naa',
  activableType: 'choice',
  tag: 'map_choice_3_tag',
  title: createOrUpdateTranslation('map_choice_3 title', undefined),
  description: createOrUpdateTranslation('map_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'PRsiLK30mT',
  defaultEffect: 'IoAGZu8DxT',
  effects: [
    {
      type: 'effect',
      parent: 'Q5kyFc3naa',
      index: 0,
      uid: 'IoAGZu8DxT',
      tag: 'map_choice_1_effect_tag',
      impacts: [
        {
          type: 'notification',
          uid: 'aQHk7MPKUT',
          index: 0,
          message: createOrUpdateTranslation("Hello, is it me you're looking for ?", undefined),
          roles: {
            AL: true,
            ACS: true,
            MCS: true,
            CASU: false,
            EVASAN: true,
            LEADPMA: true,
          },
          delaySeconds: 0,
        },
      ],
    },
  ],
};

// TODO Remove, only used for testing purposes
export function getMapChoices(): ChoiceDescriptor[] {
  return [mapChoice1, mapChoice2, mapChoice3];
}

/// AMBULANCE PARK ///
const ambulanceParkChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: '169Va6BkZn',
  activableType: 'choice',
  tag: 'ambulance_choice_1',
  title: createOrUpdateTranslation('ambulance_choice_1 title', undefined),
  description: createOrUpdateTranslation('ambulance_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'MfCmerBAP5',
  defaultEffect: '',
  effects: [],
};

const ambulanceParkChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'gn9jMz68GI',
  activableType: 'choice',
  tag: 'ambulance_choice_2',
  title: createOrUpdateTranslation('ambulance_choice_2 title', undefined),
  description: createOrUpdateTranslation('ambulance_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'XoJsGyOSIj',
  defaultEffect: '',
  effects: [],
};

const ambulanceParkChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'GNrsRVchSj',
  activableType: 'choice',
  tag: 'ambulance_choice_3',
  title: createOrUpdateTranslation('ambulance_choice_3 title', undefined),
  description: createOrUpdateTranslation('ambulance_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'KC4efS22it',
  defaultEffect: '',
  effects: [],
};

export function getAmbulanceChoices(): ChoiceDescriptor[] {
  return [ambulanceParkChoice1, ambulanceParkChoice2, ambulanceParkChoice3];
}

/// HELICOPTER PARK ///
const helicopterParkChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'helicopter_choice_1',
  title: createOrUpdateTranslation('Helicopter park A', undefined),
  description: createOrUpdateTranslation('', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'vfkH3Zwf3g',
  defaultEffect: '',
  effects: [],
};
const helicopterParkChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'helicopter_choice_2',
  title: createOrUpdateTranslation('Helicopter park B', undefined),
  description: createOrUpdateTranslation('', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'bSuKvJja5V',
  defaultEffect: '',
  effects: [],
};
const helicopterParkChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'helicopter_choice_3',
  title: createOrUpdateTranslation('Helicopter park C', undefined),
  description: createOrUpdateTranslation('', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'uJZng7tfJe',
  defaultEffect: '',
  effects: [],
};

export function getHelicopterChoices(): ChoiceDescriptor[] {
  return [helicopterParkChoice1, helicopterParkChoice2, helicopterParkChoice3];
}

/// PMA ///
const pmaChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pma_choice_1',
  title: createOrUpdateTranslation('PMA A', undefined),
  description: createOrUpdateTranslation('pma_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'aBjjEzktnx',
  defaultEffect: '',
  effects: [],
};
const pmaChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pma_choice_2',
  title: createOrUpdateTranslation('PMA B', undefined),
  description: createOrUpdateTranslation('pma_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: '8i6LsDfsYz',
  defaultEffect: '',
  effects: [],
};
const pmaChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pma_choice_3',
  title: createOrUpdateTranslation('PMA C', undefined),
  description: createOrUpdateTranslation('pma_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'qDMHx8x5V0',
  defaultEffect: '',
  effects: [],
};

export function getPMAChoices(): ChoiceDescriptor[] {
  return [pmaChoice1, pmaChoice2, pmaChoice3];
}

/// NEST ///
const nestChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'nest_choice_1',
  title: createOrUpdateTranslation('nest_choice_1 title', undefined),
  description: createOrUpdateTranslation('nest_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'WqfkE8WC5i',
  defaultEffect: '',
  effects: [],
};
const nestChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'nest_choice_2',
  title: createOrUpdateTranslation('nest_choice_2 title', undefined),
  description: createOrUpdateTranslation('nest_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'pxEGgQEvqA',
  defaultEffect: '',
  effects: [],
};
const nestChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'nest_choice_3',
  title: createOrUpdateTranslation('nest_choice_3 title', undefined),
  description: createOrUpdateTranslation('nest_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'XnWd8FFq6D',
  defaultEffect: '',
  effects: [],
};

export function getNestChoices(): ChoiceDescriptor[] {
  return [nestChoice1, nestChoice2, nestChoice3];
}

/// PC ///
const pcChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pc_choice_1',
  title: createOrUpdateTranslation('pc_choice_1 title', undefined),
  description: createOrUpdateTranslation('pc_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'k5Noi7MRyi',
  defaultEffect: '',
  effects: [],
};
const pcChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pc_choice_2',
  title: createOrUpdateTranslation('pc_choice_2 title', undefined),
  description: createOrUpdateTranslation('pc_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'OBZDZQzDHB',
  defaultEffect: '',
  effects: [],
};
const pcChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pc_choice_3',
  title: createOrUpdateTranslation('pc_choice_3 title', undefined),
  description: createOrUpdateTranslation('pc_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: '6oKec7jgdJ',
  defaultEffect: '',
  effects: [],
};

export function getPCChoices(): ChoiceDescriptor[] {
  return [pcChoice1, pcChoice2, pcChoice3];
}

/// PC FRONT ///
const pcFrontChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pcFront_choice_1',
  title: createOrUpdateTranslation('pcFront_choice_1 title', undefined),
  description: createOrUpdateTranslation('pcFront_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: '2mzbCg7nT6',
  defaultEffect: '',
  effects: [],
};
const pcFrontChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pcFront_choice_2',
  title: createOrUpdateTranslation('pcFront_choice_2 title', undefined),
  description: createOrUpdateTranslation('pcFront_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'YRUwaKZghG',
  defaultEffect: '',
  effects: [],
};
const pcFrontChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pcFront_choice_3',
  title: createOrUpdateTranslation('pcFront_choice_3 title', undefined),
  description: createOrUpdateTranslation('pcFront_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'KUHp6kJARY',
  defaultEffect: '',
  effects: [],
};

export function getPCFrontChoices(): ChoiceDescriptor[] {
  return [pcFrontChoice1, pcFrontChoice2, pcFrontChoice3];
}

/// ACCREG ///
const accregChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'accreg_choice_1',
  title: createOrUpdateTranslation('accreg_choice_1 title', undefined),
  description: createOrUpdateTranslation('accreg_choice_1 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'gA5y69LEIs',
  defaultEffect: '',
  effects: [],
};
const accregChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'accreg_choice_2',
  title: createOrUpdateTranslation('accreg_choice_2 title', undefined),
  description: createOrUpdateTranslation('accreg_choice_2 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'RKW8zOJwm4',
  defaultEffect: '',
  effects: [],
};
const accregChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'accreg_choice_3',
  title: createOrUpdateTranslation('accreg_choice_3 title', undefined),
  description: createOrUpdateTranslation('accreg_choice_3 description', undefined),
  activeAtStart: false,
  repeats: 1,
  durationDeltaSec: 0,
  parent: 'mapTemplate',
  displayedMapEntity: 'LdfKY679gU',
  defaultEffect: '',
  effects: [],
};

export function getAccregChoices(): ChoiceDescriptor[] {
  return [accregChoice1, accregChoice2, accregChoice3];
}
