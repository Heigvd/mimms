import { TimeSliceDuration } from '../../../constants';
import { MoveActorActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface MoveActorTemplateDescriptor extends ITemplateDescriptor {
  // TODO find way to make it bound to its template class
  type: 'MoveActorActionTemplate';
}

// convert descriptor TODO complete implementation

export function buildMoveActorTemplate(
  _descriptor: MoveActorTemplateDescriptor
): MoveActorActionTemplate {
  return new MoveActorActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    'move-actor-feedback'
  );
}
