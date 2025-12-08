// Move the initActionTemplates here and delete actionsTemplatesData
// use the factory to build action templates from scenario stored templates descriptors and let the rest be hardcoded

import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';
import { RadioType } from '../common/radio/communicationType';

// Just to try. Must be removed
export function getActionTemplatesMockData(): Record<string, TemplateDescriptor> {
  return {
    1: {
      uid: '1',
      type: 'FullyConfigurableTemplateDescriptor',
      index: 1,
      activableType: 'actionTemplate',
      activeAtStart: true,
      tag: 'my 1st',
      constructorType: 'FullyConfigurableActionTemplate',
      mandatory: true,
      title: {
        '@class': 'TranslatableContent',
        translations: {
          FR: {
            '@class': 'Translation',
            lang: 'EN',
            status: '',
            translation: 'my first custom action',
          },
        },
        version: 0,
      },
      description: {
        '@class': 'TranslatableContent',
        translations: {
          FR: { '@class': 'Translation', lang: 'EN', status: '', translation: 'oh what is it' },
        },
        version: 0,
      },
      durationSec: 120,
      repeats: 2,
      comment: '',
      showAllChoices: true,
      availableToRoles: [],
      binding: undefined,
      choices: [
        {
          uid: 'at1cA',
          type: 'choice',
          index: 0,
          parent: '1',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'A',
          repeats: 1,
          durationDeltaSec: 0,
          title: {
            '@class': 'TranslatableContent',
            translations: {
              FR: { '@class': 'Translation', lang: 'FR', status: '', translation: 'A' },
            },
            version: 0,
          },
          description: {
            '@class': 'TranslatableContent',
            translations: {
              FR: { '@class': 'Translation', lang: 'FR', status: '', translation: 'desc A' },
            },
            version: 0,
          },
          defaultEffect: 'at1cAe1',
          effects: [
            {
              uid: 'at1cAe1',
              type: 'effect',
              index: 0,
              parent: 'at1cA',
              tag: 'E1',
              impacts: [
                {
                  type: 'radio',
                  uid: 'at1cAe1I',
                  index: 0,
                  delaySeconds: 0,
                  message: {
                    '@class': 'TranslatableContent',
                    translations: {
                      FR: {
                        '@class': 'Translation',
                        lang: 'FR',
                        status: '',
                        translation: 'Impact at1cAe1I',
                      },
                    },
                    version: 1,
                  },
                  channel: RadioType.CASU,
                },
              ],
            },
            {
              uid: 'at1cAe2',
              type: 'effect',
              index: 0,
              parent: 'at1cA',
              tag: 'E2',
              impacts: [
                {
                  type: 'radio',
                  uid: 'at1cAe2I',
                  index: 0,
                  delaySeconds: 0,
                  message: {
                    '@class': 'TranslatableContent',
                    translations: {
                      FR: {
                        '@class': 'Translation',
                        lang: 'FR',
                        status: '',
                        translation: 'Impact at1cAe2I',
                      },
                    },
                    version: 1,
                  },
                  channel: RadioType.CASU,
                },
              ],
            },
          ],
        },
        {
          uid: 'at1cB',
          type: 'choice',
          index: 1,
          parent: '1',
          activableType: 'choice',
          activeAtStart: true,
          tag: 'B',
          repeats: 1,
          durationDeltaSec: 0,
          title: {
            '@class': 'TranslatableContent',
            translations: {
              FR: { '@class': 'Translation', lang: 'FR', status: '', translation: 'B' },
            },
            version: 0,
          },
          description: {
            '@class': 'TranslatableContent',
            translations: {
              FR: { '@class': 'Translation', lang: 'FR', status: '', translation: 'desc B' },
            },
            version: 0,
          },
          defaultEffect: 'at1cBe1',
          effects: [
            {
              uid: 'at1cBe1',
              type: 'effect',
              index: 0,
              parent: 'at1cB',
              tag: 'E1',
              impacts: [
                {
                  type: 'radio',
                  uid: 'at1cBe1I',
                  index: 0,
                  delaySeconds: 0,
                  message: {
                    '@class': 'TranslatableContent',
                    translations: {
                      FR: {
                        '@class': 'Translation',
                        lang: 'FR',
                        status: '',
                        translation: 'Impact at1cBe1I',
                      },
                    },
                    version: 1,
                  },
                  channel: RadioType.CASU,
                },
              ],
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
      mandatory: true,
      title: {
        '@class': 'TranslatableContent',
        translations: {
          FR: {
            '@class': 'Translation',
            lang: 'FR',
            status: '',
            translation: 'my second custom action',
          },
        },
        version: 0,
      },
      description: {
        '@class': 'TranslatableContent',
        translations: {
          FR: { '@class': 'Translation', lang: 'FR', status: '', translation: 'ah ha' },
        },
        version: 0,
      },
      durationSec: 180,
      repeats: 2,
      comment: '',
      showAllChoices: true,
      availableToRoles: [],
      binding: undefined,
      choices: [],
    },
  };
}
