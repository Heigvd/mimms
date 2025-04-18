import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { MapToDefinition, MapToTypeNames } from '../typeDefinitions/definition';
import { getMoveTemplateDef } from '../typeDefinitions/templateDefinitions/moveTemplate';

type TemplateDescriptorTypeName = MapToTypeNames<TemplateDescriptor>;
export type TemplateDefinition = MapToDefinition<TemplateDescriptor>;

export function getTemplateDef(type: TemplateDescriptorTypeName): TemplateDefinition {
  // TODO all values in that record => not Partial
  const tpls: Partial<Record<TemplateDescriptorTypeName, TemplateDefinition>> = {};
  tpls['MoveActorActionTemplate'] = getMoveTemplateDef();

  return tpls[type]!;
}
