// TODO Remove, choices are to be hardcoded in ActionTemplates

import { generateId } from '../../tools/helper';
import { ChoiceDescriptor } from '../common/actions/choiceDescriptor/choiceDescriptor';

///// MOCK DATA /////

const mapChoice1: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'jFnAq2zo9c',
  activableType: 'choice',
  tag: 'map_choice_1_tag',
  title: 'map_choice_1_title',
  description: 'map_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'nKuZgArPyP',
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
          message: "Hello, is it me you're looking for ?",
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
  title: 'map_choice_2_title',
  description: 'map_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'Q3JL42XIBO',
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
          message: "Hello, is it me you're looking for ?",
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
  title: 'map_choice_3_title',
  description: 'map_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'PRsiLK30mT',
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
          message: "Hello, is it me you're looking for ?",
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
  title: 'ambulance_choice_1_title',
  description: 'ambulance_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'MfCmerBAP5',
  defaultEffect: '',
  effects: [],
};

const ambulanceParkChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'gn9jMz68GI',
  activableType: 'choice',
  tag: 'ambulance_choice_2',
  title: 'ambulance_choice_2_title',
  description: 'ambulance_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'XoJsGyOSIj',
  defaultEffect: '',
  effects: [],
};

const ambulanceParkChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: 'GNrsRVchSj',
  activableType: 'choice',
  tag: 'ambulance_choice_3',
  title: 'ambulance_choice_3_title',
  description: 'ambulance_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'KC4efS22it',
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
  title: 'helicopter_choice_1_title',
  description: 'helicopter_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'vfkH3Zwf3g',
  defaultEffect: '',
  effects: [],
};
const helicopterParkChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'helicopter_choice_2',
  title: 'helicopter_choice_2_title',
  description: 'helicopter_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'bSuKvJja5V',
  defaultEffect: '',
  effects: [],
};
const helicopterParkChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'helicopter_choice_3',
  title: 'helicopter_choice_3_title',
  description: 'helicopter_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'uJZng7tfJe',
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
  title: 'pma_choice_1_title',
  description: 'pma_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'aBjjEzktnx',
  defaultEffect: '',
  effects: [],
};
const pmaChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pma_choice_2',
  title: 'pma_choice_2_title',
  description: 'pma_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: '8i6LsDfsYz',
  defaultEffect: '',
  effects: [],
};
const pmaChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pma_choice_3',
  title: 'pma_choice_3_title',
  description: 'pma_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'qDMHx8x5V0',
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
  title: 'nest_choice_1_title',
  description: 'nest_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'WqfkE8WC5i',
  defaultEffect: '',
  effects: [],
};
const nestChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'nest_choice_2',
  title: 'nest_choice_2_title',
  description: 'nest_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'pxEGgQEvqA',
  defaultEffect: '',
  effects: [],
};
const nestChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'nest_choice_3',
  title: 'nest_choice_3_title',
  description: 'nest_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'XnWd8FFq6D',
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
  title: 'pc_choice_1_title',
  description: 'nest_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'k5Noi7MRyi',
  defaultEffect: '',
  effects: [],
};
const pcChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pc_choice_2',
  title: 'pc_choice_2_title',
  description: 'nest_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'OBZDZQzDHB',
  defaultEffect: '',
  effects: [],
};
const pcChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pc_choice_3',
  title: 'pc_choice_3_title',
  description: 'nest_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: '6oKec7jgdJ',
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
  title: 'pcFront_choice_1_title',
  description: 'pcFront_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: '2mzbCg7nT6',
  defaultEffect: '',
  effects: [],
};
const pcFrontChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pcFront_choice_2',
  title: 'pcFront_choice_2_title',
  description: 'pcFront_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'YRUwaKZghG',
  defaultEffect: '',
  effects: [],
};
const pcFrontChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'pcFront_choice_3',
  title: 'pcFront_choice_3_title',
  description: 'pcFront_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'KUHp6kJARY',
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
  title: 'accreg_choice_1_title',
  description: 'accreg_choice_1_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'gA5y69LEIs',
  defaultEffect: '',
  effects: [],
};
const accregChoice2: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'accreg_choice_2',
  title: 'accreg_choice_2_title',
  description: 'accreg_choice_2_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'RKW8zOJwm4',
  defaultEffect: '',
  effects: [],
};
const accregChoice3: ChoiceDescriptor = {
  type: 'choice',
  index: 0,
  uid: generateId(10),
  activableType: 'choice',
  tag: 'accreg_choice_3',
  title: 'accreg_choice_3_title',
  description: 'accreg_choice_3_desc',
  activeAtStart: false,
  parent: 'mapTemplate',
  placeholder: 'LdfKY679gU',
  defaultEffect: '',
  effects: [],
};

export function getAccregChoices(): ChoiceDescriptor[] {
  return [accregChoice1, accregChoice2, accregChoice3];
}
