// EVALUATION_PRIORITY 0

import { MapChoiceActionTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/mapChoiceTemplate';
import { TimeSliceDuration } from '../../../game/common/constants';
import { generateId } from '../../../tools/helper';
import { createOrUpdateTranslation } from '../../../tools/translation';
import { ALL_EDITABLE, Definition, EXPERT_ONLY } from '../definition';
import { ActionValidationContext } from '../validation/validationContext';

/**
 * Scenarist map choice descriptor
 */
export function getMapChoiceActionTemplateDef(): Definition<MapChoiceActionTemplateDescriptor, ActionValidationContext> {
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
      repeats: 1,
      tag: 'new fixed entity template',
      description: createOrUpdateTranslation('', undefined),
      title: createOrUpdateTranslation('', undefined),
      uid: generateId(10),
      durationSec: TimeSliceDuration,
      availableToRoles: {
        // TODO make it dynamic
        ACS: true,
        MCS: true,
        AL: true,
        CASU: false,
        EVASAN: true,
        LEADPMA: true,
      },
      showAllChoices: true,
      comment: '',
      index: 0,
    }),
    validator: (_t, _ctx) => ({ success: true, messages: [] }), // TODO validation
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activableType: { basic: 'hidden', advanced: 'visible', expert: 'visible' },
      activeAtStart: ALL_EDITABLE,
      description: ALL_EDITABLE,
      title: ALL_EDITABLE,
      tag: ALL_EDITABLE,
      choices: ALL_EDITABLE,
      binding: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      constructorType: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      mandatory: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      repeats: ALL_EDITABLE,
      durationSec: ALL_EDITABLE,
      availableToRoles: {} as any, // TODO ALL_EDITABLE,
      showAllChoices: EXPERT_ONLY,
      comment: ALL_EDITABLE,
    },
  };
}
