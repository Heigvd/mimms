import { MapChoiceActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface MapChoiceTemplateDescriptor extends ITemplateDescriptor {
  type: 'MapChoiceTemplateDescriptor';
  constructorType: 'MapChoiceActionTemplate'; // TODO
}

export function createMapChoiceActionTemplate(
  desc: MapChoiceTemplateDescriptor
): MapChoiceActionTemplate {
  switch (desc.constructorType) {
    case 'MapChoiceActionTemplate':
      return new MapChoiceActionTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        'feedback',
        undefined,
        undefined,
        undefined,
        undefined,
        desc.choices,
        desc.binding
      );
  }
}
