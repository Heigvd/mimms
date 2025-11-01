import { scenarioEditionLogger } from '../../../../../tools/logger';
import { getMapEntityDescriptor } from '../../../../loaders/mapEntitiesLoader';
import { MapChoiceActionTemplate } from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface MapChoiceTemplateDescriptor extends ITemplateDescriptor {
  type: 'MapChoiceTemplateDescriptor';
  constructorType: 'MapChoiceActionTemplate'; // TODO
}

export function createMapChoiceActionTemplate(
  desc: MapChoiceTemplateDescriptor
): MapChoiceActionTemplate {
  validateDescriptorBinding(desc);

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

// TODO Add error handling depending on case
/**
 * Validate that the template binding matches the choices'
 */
function validateDescriptorBinding(desc: MapChoiceTemplateDescriptor) {
  for (const choice of desc.choices) {
    // TODO Avoid non-null assertion, maybe extend choiceDescriptor to mapChoiceDescriptor with placeholder
    const mapDescriptor = getMapEntityDescriptor(choice.placeholder!);

    if (!mapDescriptor) {
      // TODO Handle undefined case, see comment above
      scenarioEditionLogger.warn(
        `ChoiceDescriptor for ChoiceDescriptor ${choice.placeholder} could not be found.`
      );
    } else if (!mapDescriptor.binding) {
      scenarioEditionLogger.warn(
        `ChoiceDescriptor ${choice.uid} has no binding for MapEntityDescriptor ${mapDescriptor.uid}.`
      );
    } else if (mapDescriptor.binding !== desc.binding) {
      scenarioEditionLogger.warn(
        `Choice binding conflict: MapChoiceTemplateDescriptor "${desc.uid}" and ChoiceDescriptor "${choice.uid}" both use conflicting bindings ("${desc.binding}" vs "${mapDescriptor.binding}").`
      );
    }
  }
}
