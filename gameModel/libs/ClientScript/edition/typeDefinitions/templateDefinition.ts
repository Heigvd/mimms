import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { Uid } from '../../game/common/interfaces';
import { scenarioEditionLogger } from '../../tools/logger';
import { MapToDefinition, MapToFlatType } from '../typeDefinitions/definition';
import { getFullyConfigurableTemplateDef } from '../typeDefinitions/templateDefinitions/fullyConfigurableTemplate';
import { getMoveTemplateDef } from '../typeDefinitions/templateDefinitions/moveTemplate';
import { getMapChoiceActionTemplateDef } from './templateDefinitions/mapChoiceTemplate';
import { ActionValidationContext } from './validationContext';

type TemplateDescriptorTypeName = TemplateDescriptor['type'];
type TemplateDefinition = MapToDefinition<TemplateDescriptor, ActionValidationContext>;

export type FlatActionTemplate = MapToFlatType<TemplateDescriptor, 'action'>;

export function toFlatActionTemplate(
  action: TemplateDescriptor,
  parentId: Uid
): FlatActionTemplate {
  const { choices: _ignore, ...flatAction } = action;
  return {
    ...flatAction,
    parent: parentId,
    superType: 'action',
  };
}

export function fromFlatActionTemplate(flatAction: FlatActionTemplate): TemplateDescriptor {
  const { superType: _ignored, parent: _ignore2, ...action } = flatAction;
  return {
    ...action,
    choices: [],
  };
}

export function getTemplateDef(type: TemplateDescriptorTypeName): TemplateDefinition | undefined {
  switch (type) {
    case 'FullyConfigurableTemplateDescriptor':
      return getFullyConfigurableTemplateDef();
    case 'MoveActorTemplateDescriptor':
      return getMoveTemplateDef();
    case 'MapChoiceActionTemplateDescriptor':
      return getMapChoiceActionTemplateDef();
    default:
      scenarioEditionLogger.error('Unknown type name for template descriptor', type);
  }
}
