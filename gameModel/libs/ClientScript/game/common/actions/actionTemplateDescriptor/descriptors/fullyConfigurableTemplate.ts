import { TimeSliceDuration } from '../../../constants';
import { MapChoiceActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

// TODO this might just be a MapChoiceActionTemplate instead

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  type: 'FullyConfigurableTemplateDescriptor';
  constructorType: 'FullyConfigurableActionTemplate'; // could be a union type with other constructor types
}

export function createFullyConfigurableTemplate(
  _descriptor: FullyConfigurableTemplateDescriptor
): MapChoiceActionTemplate {
  return new MapChoiceActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    //'move-actor-feedback'
  );
}
