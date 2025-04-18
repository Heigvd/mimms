import { MoveActorTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { Definition } from '../../typeDefinitions/definition';

export function getMoveTemplateDef(): Definition<MoveActorTemplateDescriptor> {
  return {
    type: 'MoveActorActionTemplate',
    default: () => ({}),
  };
}
