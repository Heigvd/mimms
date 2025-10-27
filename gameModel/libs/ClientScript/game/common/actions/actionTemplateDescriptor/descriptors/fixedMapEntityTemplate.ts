import {
  SelectionFixedMapEntityTemplate,
  SelectionParkTemplate,
  SelectionPCFrontTemplate,
  SelectionPCTemplate,
} from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface FixedMapEntityTemplateDescriptor extends ITemplateDescriptor {
  type: 'FixedMapEntityTemplateDescriptor';
  constructorType:
    | 'SelectionFixedMapEntityTemplate'
    | 'SelectionPCTemplate'
    | 'SelectionPCFrontTemplate'
    | 'SelectionParkTemplate';
}

export function createFixedMapEntityTemplate(
  desc: FixedMapEntityTemplateDescriptor
): SelectionFixedMapEntityTemplate {
  // TODO multilang refactoring (figure out the question of hardcoded translation keys)
  // TODO see how feedback should be configured (the scenarists might like to customize depending on the choice)
  // TODO raised flags issue (all the "BUILT" flags are redundant in state => this can be detected in the state)
  // need to figure out where this information is stored (Conditions and Impacts on flags are an option)

  switch (desc.constructorType) {
    case 'SelectionFixedMapEntityTemplate':
      return new SelectionFixedMapEntityTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        {} as any, // FixedMapEntity
        false // replayable
      );
    case 'SelectionPCTemplate':
      return new SelectionPCTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        {} as any, // FixedMapEntity
        false // replayable));
      );
    case 'SelectionPCFrontTemplate':
      return new SelectionPCFrontTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        {} as any, // FixedMapEntity
        false // replayable));
      );
    case 'SelectionParkTemplate':
      return new SelectionParkTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        {} as any, // FixedMapEntity
        'ambulance', // TODO 2 types, figure out where to inject this information
        false
      );
  }
}
