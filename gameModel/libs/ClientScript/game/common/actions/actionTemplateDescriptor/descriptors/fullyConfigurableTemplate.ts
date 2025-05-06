import { TimeSliceDuration } from '../../../constants';
import { MoveActorActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  type: 'FullyConfigurableTemplateDescriptor';
  constructorType: 'FullyConfigurableActionTemplate'; // could be a union type with other constructor types
}

export function buildFullyConfigurableTemplate(
  _descriptor: FullyConfigurableTemplateDescriptor
): MoveActorActionTemplate {
  // TODO implement the real class
  return new MoveActorActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    'move-actor-feedback'
  );
}
