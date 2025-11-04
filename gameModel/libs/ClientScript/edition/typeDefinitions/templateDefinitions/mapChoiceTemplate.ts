// EVALUATION_PRIORITY 0

import { MapChoiceActionTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/mapChoiceTemplate';
import { TimeSliceDuration } from '../../../game/common/constants';
import { generateId } from '../../../tools/helper';
import { ALL_EDITABLE, Definition, EXPERT_ONLY } from '../definition';

/**
 * Scenarist map choice descriptor
 */
export function getMapChoiceActionTemplateDef(): Definition<MapChoiceActionTemplateDescriptor> {
  return {
    type: 'MapChoiceActionTemplateDescriptor',
    getDefault: () => ({
      type: 'MapChoiceActionTemplateDescriptor',
      constructorType: 'MapChoiceActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      binding: undefined,
      choices: [],
      mandatory: false,
      repeatable: 1,
      tag: 'new fixed entity template',
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
