// EVALUATION_PRIORITY 0

import { FullyConfigurableTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { TimeSliceDuration } from '../../../game/common/constants';
import { generateId } from '../../../tools/helper';
import { ALL_EDITABLE, Definition, EXPERT_ONLY } from '../../typeDefinitions/definition';

/**
 * Scenarist fully configurable template, including choices and impacts
 */
export function getFullyConfigurableTemplateDef(): Definition<FullyConfigurableTemplateDescriptor> {
  return {
    type: 'FullyConfigurableTemplateDescriptor',
    getDefault: () => ({
      type: 'FullyConfigurableTemplateDescriptor',
      constructorType: 'FullyConfigurableActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      binding: undefined,
      choices: [],
      mandatory: false,
      repeatable: 0,
      tag: 'new custom template',
      description: 'some default description', // multilang
      title: 'some default title', // TODO multilang
      uid: generateId(10),
      durationSec: TimeSliceDuration,
      index: 0,
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      description: ALL_EDITABLE,
      title: ALL_EDITABLE,
      tag: ALL_EDITABLE,
      choices: ALL_EDITABLE,
      binding: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      constructorType: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      mandatory: ALL_EDITABLE,
      repeatable: ALL_EDITABLE,
      durationSec: ALL_EDITABLE,
      index: EXPERT_ONLY,
    },
  };
}
