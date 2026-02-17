import { TimeSliceDuration } from '../../../constants';
import { MoveActorActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../templateDescriptor';

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
