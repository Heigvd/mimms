// Move the initActionTemplates here and delete actionsTemplatesData
// use the factory to build action templates from scenario stored templates descriptors and let the rest be hardcoded

// Just to try. Must be removed

import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

export function getATTests(): Record<string, TemplateDescriptor> {
  return {
    at1: {
      uid: 'at1',
      index: 0,
      type: 'FullyConfigurableTemplateDescriptor',
      constructorType: 'FullyConfigurableActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      tag: 'my 1st',
      repeatable: 2,
      mandatory: true,
      title: 'my first custom action',
      description: 'oh what is it',
      choices: [
        {
          uid: 'at1cA',
          index: 0,
          type: 'choice',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'A',
          parent: 'at1',
          description: 'A, the choice A',
          title: 'A choice',
          placeHolder: 'kkk',
          defaultEffect: 'at1cAe1',
          effects: [
            {
              uid: 'at1cAe1',
              index: 0,
              type: 'effect',
              tag: 'E1',
              parent: 'at1cA',
              impacts: [],
            },
            {
              uid: 'at1cAe2',
              index: 0,
              type: 'effect',
              tag: 'E2',
              parent: 'at1cA',
              impacts: [],
            },
          ],
        },
        {
          uid: 'at1cB',
          index: 0,
          type: 'choice',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'B',
          parent: 'at1',
          description: 'B, the choice B',
          title: 'B choice',
          placeHolder: 'kkk',
          defaultEffect: 'at1cBe1',
          effects: [
            {
              uid: 'at1cBe1',
              index: 0,
              type: 'effect',
              tag: 'E1',
              parent: 'at1cB',
              impacts: [],
            },
          ],
        },
      ],
      binding: undefined,
      durationSec: 120,
    },
    at2: {
      uid: 'at2',
      index: 1,
      type: 'FullyConfigurableTemplateDescriptor',
      constructorType: 'FullyConfigurableActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      tag: 'my 2nd',
      repeatable: 2,
      mandatory: true,
      title: 'my second custom action',
      description: 'ah ah',
      choices: [],
      binding: undefined,
      durationSec: 180,
    },
  };
}
