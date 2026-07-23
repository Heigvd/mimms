import { TimeSliceDuration } from '../../../constants';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';
import { MoveActorActionTemplate } from '../../actionTemplate/actionTemplateActors';

export interface MoveActorTemplateDescriptor extends ITemplateDescriptor {
  type: 'MoveActorTemplateDescriptor';
  constructorType: 'MoveActorActionTemplate';
}

// convert descriptor TODO complete implementation

export function createMoveActorTemplate(
  descriptor: MoveActorTemplateDescriptor
): MoveActorActionTemplate {
  return new MoveActorActionTemplate(
    descriptor.uid,
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration
  );
}
