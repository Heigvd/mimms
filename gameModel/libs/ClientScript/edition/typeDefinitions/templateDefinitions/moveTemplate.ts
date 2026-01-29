// EVALUATION_PRIORITY 0

import { MoveActorTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TimeSliceDuration } from '../../../game/common/constants';
import { generateId } from '../../../tools/helper';
import { createOrUpdateTranslation } from '../../../tools/translation';
import { Definition } from '../../typeDefinitions/definition';
import { ActionValidationContext } from '../validationContext';

// REMARK : Just as an example here, we might remove that MoveTemplate descriptor completetly
export function getMoveTemplateDef(): Definition<MoveActorTemplateDescriptor, ActionValidationContext> {
  return {
    type: 'MoveActorTemplateDescriptor',
    getDefault: () => ({
      type: 'MoveActorTemplateDescriptor',
      constructorType: 'MoveActorActionTemplate',
      activableType: 'actionTemplate',
      activeAtStart: true,
      binding: undefined,
      choices: [],
      mandatory: true,
      repeats: 0,
      tag: 'Move Action',
      description: createOrUpdateTranslation('', undefined),
      title: createOrUpdateTranslation('Move to a location', undefined),
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
    view: {} as any, // TODO hide almost all fields for the move template
  };
}
