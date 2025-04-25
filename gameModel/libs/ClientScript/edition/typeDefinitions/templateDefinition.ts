import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { scenarioEditionLogger } from '../../tools/logger';
import { MapToDefinition, MapToTypeNames } from '../typeDefinitions/definition';
import { getFullConfigurableTemplateDef } from '../typeDefinitions/templateDefinitions/fullyConfigurableTemplate';
import { getMoveTemplateDef } from '../typeDefinitions/templateDefinitions/moveTemplate';

type TemplateDescriptorTypeName = MapToTypeNames<TemplateDescriptor>;
type TemplateDefinition = MapToDefinition<TemplateDescriptor>;
//type TemplateDefinitionRecord = MapToRecordByType<TemplateDescriptor>;

export function getTemplateDef(type: TemplateDescriptorTypeName): TemplateDefinition | undefined {
  // TODO choose implementation between switch or TemplateDefinitionRecord (see ImpactDefinition)

  switch (type) {
    case 'FullyConfigurableActionTemplate':
      return getFullConfigurableTemplateDef();
    case 'MoveActorActionTemplate':
      return getMoveTemplateDef();
    default:
      scenarioEditionLogger.error('Unknown type name for template descriptor', type);
  }
}
