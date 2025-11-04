import { ActionTemplateBase } from '../common/actions/actionTemplateBase';
import { createMapChoiceActionTemplate as createMapChoiceActionTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fixedMapEntityTemplate';
import { createFullyConfigurableTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { createMoveActorTemplate } from '../common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';

export function createInstance(tplDescriptor: TemplateDescriptor): ActionTemplateBase {
  const ctorType = tplDescriptor.constructorType;
  switch (ctorType) {
    case 'MoveActorActionTemplate':
      return createMoveActorTemplate(tplDescriptor);
    case 'FullyConfigurableActionTemplate':
      // TODO this might be a MapChoiceTemplate
      return createFullyConfigurableTemplate(tplDescriptor);
    case 'MapChoiceActionTemplate':
    case 'AmbulanceParkChoiceTemplate':
    case 'HelicopterParkChoiceTemplate':
    case 'PCChoiceTemplate':
    case 'PCFrontChoiceTemplate':
      return createMapChoiceActionTemplate(tplDescriptor);
    default:
      // this makes sure a missing case induces a compilation error
      missingCase(ctorType);
  }
  // TODO Log error
  return undefined as any;
}

function missingCase(type: never) {
  throw new Error(`This constructor type (${type}) is not handled`);
}
