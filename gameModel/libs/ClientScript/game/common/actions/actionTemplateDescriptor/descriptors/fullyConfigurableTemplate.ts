import { MapChoiceActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

// TODO this might just be a MapChoiceActionTemplate instead

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  type: 'FullyConfigurableTemplateDescriptor';
  constructorType: 'FullyConfigurableActionTemplate'; // could be a union type with other constructor types
}

export function createFullyConfigurableTemplate(
  descriptor: FullyConfigurableTemplateDescriptor
): MapChoiceActionTemplate {
  return new MapChoiceActionTemplate(
    descriptor.uid,
    descriptor.title,
    descriptor.description,
    descriptor.durationSec,
    undefined, // TODO repeats / replayable
    undefined,
    undefined,
    [], // TODO availableToRoles
    descriptor.choices
    //LOCATION_ENUM.custom
  );
}
