import { TimeSliceDuration } from '../../../constants';
import { MoveActorActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface FullyConfigurableTemplateDescriptor extends ITemplateDescriptor {
  // TODO find way to make it bound to its template class without genericity
  type: 'FullyConfigurableActionTemplate';
}

// TODO convert descriptor to class here

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
