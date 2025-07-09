import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { scenarioEditionLogger } from '../../tools/logger';
import { MapToDefinition, MapToTypeNames } from '../typeDefinitions/definition';
import { getFixedMapEntityTemplate } from '../typeDefinitions/templateDefinitions/fixedMapEntityTemplate';
import { getFullyConfigurableTemplateDef } from '../typeDefinitions/templateDefinitions/fullyConfigurableTemplate';
import { getMoveTemplateDef } from '../typeDefinitions/templateDefinitions/moveTemplate';

type TemplateDescriptorTypeName = MapToTypeNames<TemplateDescriptor>;
type TemplateDefinition = MapToDefinition<TemplateDescriptor>;

export function getTemplateDef(type: TemplateDescriptorTypeName): TemplateDefinition | undefined {
  switch (type) {
    case 'FullyConfigurableTemplateDescriptor':
      return getFullyConfigurableTemplateDef();
    case 'MoveActorTemplateDescriptor':
      return getMoveTemplateDef();
    case 'FixedMapEntityTemplateDescriptor':
      return getFixedMapEntityTemplate();
    default:
      scenarioEditionLogger.error('Unknown type name for template descriptor', type);
  }
}
