// TODO Remove, choices are to be hardcoded in ActionTemplates

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
