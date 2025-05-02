import { MoveActorTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { generateId } from '../../../tools/helper';
import { Definition } from '../../typeDefinitions/definition';

export function getMoveTemplateDef(): Definition<MoveActorTemplateDescriptor> {
  return {
    type: 'MoveActorActionTemplate',
    getDefault: () => ({
      type: 'MoveActorActionTemplate',
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
    }),
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    view: {} as any, // TODO hide almost all fields for the move template
  };
}
