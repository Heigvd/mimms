import { ActionTemplateBase } from '../common/actions/actionTemplateBase';
import { createFixedMapEntityTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fixedMapEntityTemplate';
import { createFullyConfigurableTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { createMoveActorTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

export function createInstance(tplDescriptor: TemplateDescriptor): ActionTemplateBase {
  const ctorType = tplDescriptor.constructorType;
  switch (ctorType) {
    case 'MoveActorActionTemplate':
      return createMoveActorTemplate(tplDescriptor);
    case 'FullyConfigurableActionTemplate':
      return createFullyConfigurableTemplate(tplDescriptor);
    case 'SelectionFixedMapEntityTemplate':
    case 'SelectionPCFrontTemplate':
    case 'SelectionPCTemplate':
    case 'SelectionParkTemplate':
      return createFixedMapEntityTemplate(tplDescriptor);
    default:
      // this makes sure a missing case induces a compilation error
      missingCase(ctorType);
  }
  return undefined as any;
}

function missingCase(type: never) {
  throw new Error(`This constructor type (${type}) is not handled`);
}
