import { FullyConfigurableTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { generateId } from '../../../tools/helper';
import { Definition } from '../../typeDefinitions/definition';

export function getFullConfigurableTemplateDef(): Definition<FullyConfigurableTemplateDescriptor> {
  return {
    type: 'FullyConfigurableActionTemplate',
    getDefault: () => ({
      type: 'FullyConfigurableActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      binding: undefined,
      choices: [],
      mandatory: true,
      repeatable: 0,
      tag: 'new custom template',
      description: 'some default description', // multilang
      title: 'some default title', // TODO multilang
      uid: generateId(10),
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {} as any, // TODO
  };
}
