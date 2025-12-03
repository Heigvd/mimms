// Move the initActionTemplates here and delete actionsTemplatesData
// use the factory to build action templates from scenario stored templates descriptors and let the rest be hardcoded

import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

// Just to try. Must be removed
export function getActionTemplatesMockData(): Record<string, TemplateDescriptor> {
  return {
    1: {
      uid: '1',
      type: 'FullyConfigurableTemplateDescriptor',
      index: 0,
      activableType: 'actionTemplate',
      activeAtStart: true,
      tag: 'my 1st',
      constructorType: 'FullyConfigurableActionTemplate',
      // comment: '', // in drawio schema but not in TemplateDescriptor ?
      mandatory: true,
      title: 'my first custom action',
      description: 'oh what is it',
      durationSec: 120,
      repeatable: 2, // in drawio schema it is repeats
      binding: undefined,
      choices: [
        {
          uid: 'at1cA',
          type: 'choice',
          index: 0,
          parent: 'at1',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'A',
          // displayedMapEntity
          // repeats
          title: 'A choice',
          description: 'A, the choice A',
          // durationDelta
          defaultEffect: 'at1cAe1',
          effects: [
            {
              uid: 'at1cAe1',
              type: 'effect',
              index: 0,
              parent: 'at1cA',
              tag: 'EA1',
              impacts: [],
            },
            {
              uid: 'at1cAe2',
              type: 'effect',
              index: 0,
              parent: 'at1cA',
              tag: 'EA2',
              impacts: [],
            },
          ],
        },
        {
          uid: 'at1cB',
          type: 'choice',
          index: 1,
          parent: 'at1',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'B',
          // displayedMapEntity ?
          // repeats ?
          title: 'B choice',
          description: 'B, the choice B',
          // durationDelta ?
          defaultEffect: 'at1cBe1',
          effects: [
            {
              uid: 'at1cBe1',
              type: 'effect',
              index: 0,
              parent: 'at1cB',
              tag: 'EB1',
              impacts: [],
            },
          ],
        },
      ],
    },
    2: {
      uid: '2',
      type: 'FullyConfigurableTemplateDescriptor',
      index: 1,
      activableType: 'actionTemplate',
      activeAtStart: true,
      tag: 'my 2nd',
      constructorType: 'FullyConfigurableActionTemplate',
      // comment: '', // in drawio schema but not in TemplateDescriptor ?
      mandatory: true,
      title: 'my second custom action',
      description: 'ah ah',
      durationSec: 180,
      repeatable: 2, // in drawio schema it is repeats
      binding: undefined,
      choices: [],
    },
  };
}
