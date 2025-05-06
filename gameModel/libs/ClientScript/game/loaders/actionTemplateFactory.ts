import { ActionTemplateBase } from '../common/actions/actionTemplateBase';
import { buildFullyConfigurableTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { buildMoveActorTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

export function makeInstance(tplDescriptor: TemplateDescriptor): ActionTemplateBase {
  const ctorType = tplDescriptor.constructorType;
  switch (ctorType) {
    case 'MoveActorActionTemplate':
      return buildMoveActorTemplate(tplDescriptor);
    case 'FullyConfigurableActionTemplate':
      return buildFullyConfigurableTemplate(tplDescriptor);
    default:
      // this makes sure a missing case induces a compilation error
      missingCase(ctorType);
  }
  return undefined as any;
}

function missingCase(type: never) {
  throw new Error(`This type (${type}) is not handled`);
}
