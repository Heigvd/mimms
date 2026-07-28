import { getFilteredAsArray } from '../../../../../tools/helper';
import { FullyConfigurableChoiceActionTemplate } from '../../actionTemplate/actionTemplateBase';
import { ITemplateDescriptor } from '../templateDescriptor';

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  type: 'FullyConfigurableTemplateDescriptor';
  constructorType: 'FullyConfigurableActionTemplate'; // could be a union type with other constructor types
}

export function createFullyConfigurableTemplate(
  descriptor: FullyConfigurableTemplateDescriptor
): FullyConfigurableChoiceActionTemplate {
  return new FullyConfigurableChoiceActionTemplate(
    descriptor.uid,
    descriptor.title,
    descriptor.description,
    descriptor.durationSec,
    descriptor.repeats,
    undefined, // no required flag
    undefined, // no raised flag
    getFilteredAsArray(descriptor.availableToRoles),
    descriptor.choices
  );
}
