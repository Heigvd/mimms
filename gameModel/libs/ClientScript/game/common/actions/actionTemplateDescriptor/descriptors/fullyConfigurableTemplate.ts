import { getFilteredAsArray } from '../../../../../tools/helper';
import { CustomChoiceActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

// TODO this might just be a MapChoiceActionTemplate instead

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  type: 'FullyConfigurableTemplateDescriptor';
  constructorType: 'FullyConfigurableActionTemplate'; // could be a union type with other constructor types
}

export function createFullyConfigurableTemplate(
  descriptor: FullyConfigurableTemplateDescriptor
): CustomChoiceActionTemplate {
  return new CustomChoiceActionTemplate(
    descriptor.uid,
    descriptor.title,
    descriptor.description,
    descriptor.durationSec,
    undefined, // TODO repeats / replayable
    undefined, // no required flag
    undefined, // no raised flag
    getFilteredAsArray(descriptor.availableToRoles),
    descriptor.choices
  );
}
