import { ActionTemplateBase } from '../common/actions/actionTemplateBase';
import { buildFullyConfigurableTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { buildInstanceMoveActorTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

export function makeInstance(tplDescriptor: TemplateDescriptor): ActionTemplateBase {
  //TODO
  switch (tplDescriptor.type) {
    case 'MoveActorActionTemplate': // TODO
      return buildInstanceMoveActorTemplate(tplDescriptor);
    case 'FullyConfigurableActionTemplate':
      return buildFullyConfigurableTemplate(tplDescriptor);
  }
  return undefined as any;
}
