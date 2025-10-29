// EVALUATION_PRIORITY 0

import { MoveActorTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TimeSliceDuration } from '../../../game/common/constants';
import { generateId } from '../../../tools/helper';
import { Definition } from '../../typeDefinitions/definition';

// REMARK : Just as an example here, we might remove that MoveTemplate descriptor completetly
export function getMoveTemplateDef(): Definition<MoveActorTemplateDescriptor> {
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
      repeatable: 0,
      tag: 'Move Action',
      description: 'TODO', // multilang
      title: 'Move to a location', // TODO multilang
      uid: generateId(10),
      durationSec: TimeSliceDuration,
      index: 0,
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {} as any, // TODO hide almost all fields for the move template
  };
}
