import { getFilteredAsArray } from '../../../../../tools/helper';
import { mainSimLoaderLogger } from '../../../../../tools/logger';
import { getMapEntityDescriptor } from '../../../../loaders/mapEntitiesLoader';
import { VehicleType } from '../../../resources/resourceType';
import { LOCATION_ENUM } from '../../../simulationState/locationState';
import { SimFlag } from '../../actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from '../../choiceDescriptor/choiceDescriptor';
import { ITemplateDescriptor } from '../templateDescriptor';
import {
  MapChoiceActionTemplate,
  ParkChoiceTemplate,
  PCChoiceTemplate,
  PCFrontChoiceTemplate,
} from '../../actionTemplate/actionTemplateMap';

export interface MapChoiceActionTemplateDescriptor extends ITemplateDescriptor {
  type: 'MapChoiceActionTemplateDescriptor';
  constructorType:
    | 'MapChoiceActionTemplate'
    | 'PMAChoiceTemplate'
    | 'PCChoiceTemplate'
    | 'PCFrontChoiceTemplate'
    | 'AmbulanceParkChoiceTemplate'
    | 'HelicopterParkChoiceTemplate';
}

// TODO instead of a constructor type the LocationEnum binding could be used instead to infer the constructor ?

export function createMapChoiceActionTemplate(
  desc: MapChoiceActionTemplateDescriptor
): MapChoiceActionTemplate {
  // TODO multilang refactoring (figure out the question of hardcoded translation keys)
  // TODO see how feedback should be configured (the scenarists might like to customize depending on the choice) or no feedback ?
  // TODO raised flags issue (all the "BUILT" flags are redundant in state => this can be detected in the state)
  // need to figure out where this information is stored (Conditions and Impacts on flags are an option)

  validateDescriptorBinding(desc);

  switch (desc.constructorType) {
    case 'MapChoiceActionTemplate':
      return new MapChoiceActionTemplate(
        desc.uid,
        desc.title,
        desc.description,
        desc.durationSec,
        undefined, // required flags
        [], // raised flags
        getFilteredAsArray(desc.availableToRoles),
        desc.choices,
        desc.binding || LOCATION_ENUM.custom // TODO is that ok ?
      );
    case 'PMAChoiceTemplate':
      return new MapChoiceActionTemplate(
        desc.uid,
        desc.title,
        desc.description,
        desc.durationSec,
        undefined, // required flags
        [SimFlag.PMA_BUILT],
        getFilteredAsArray(desc.availableToRoles),
        desc.choices,
        LOCATION_ENUM.PMA
      );
    case 'PCChoiceTemplate':
      return new PCChoiceTemplate(
        desc.uid,
        desc.title,
        desc.description,
        desc.durationSec,
        LOCATION_ENUM.PC,
        undefined, // required flags
        [SimFlag.PC_BUILT], // raised flags
        getFilteredAsArray(desc.availableToRoles),
        desc.choices
      );
    case 'PCFrontChoiceTemplate':
      return new PCFrontChoiceTemplate(
        desc.uid,
        desc.title,
        desc.description,
        desc.durationSec,
        LOCATION_ENUM.pcFront,
        [],
        [SimFlag.PCFRONT_BUILT], // raised flags
        getFilteredAsArray(desc.availableToRoles),
        desc.choices
      );
    case 'AmbulanceParkChoiceTemplate':
      return createParkTemplate(desc, 'ambulance');
    case 'HelicopterParkChoiceTemplate':
      return createParkTemplate(desc, 'helicopter');
  }
}

function createParkTemplate(
  desc: MapChoiceActionTemplateDescriptor,
  vtype: VehicleType
): ParkChoiceTemplate {
  const location =
    vtype === 'ambulance' ? LOCATION_ENUM.ambulancePark : LOCATION_ENUM.helicopterPark;
  const flag = vtype === 'ambulance' ? SimFlag.AMBULANCE_PARK_BUILT : SimFlag.HELICOPTER_PARK_BUILT;
  return new ParkChoiceTemplate(
    desc.uid,
    desc.title,
    desc.description,
    desc.durationSec,
    location,
    vtype,
    undefined,
    [flag],
    getFilteredAsArray(desc.availableToRoles),
    desc.choices
  );
}

function stringifyChoiceOrAction(
  desc: ChoiceDescriptor | MapChoiceActionTemplateDescriptor
): string {
  return `(uid : ${desc?.uid}, tag : ${desc.tag}, title : ${I18n.translate(desc.title)})`;
}

// TODO Add error handling depending on case
/**
 * Validate that the template binding matches the choices'
 */
function validateDescriptorBinding(desc: MapChoiceActionTemplateDescriptor) {
  if (!desc.binding) {
    mainSimLoaderLogger.warn(
      `MapChoiceActionTemplateDescriptor ${stringifyChoiceOrAction(desc)} has no location binding`
    );
  }
  for (const choice of desc.choices) {
    // TODO Avoid non-null assertion, maybe extend choiceDescriptor to mapChoiceDescriptor with displayedMapEntity
    const mapDescriptor = getMapEntityDescriptor(choice.displayedMapEntity!);
    if (!mapDescriptor) {
      // TODO Handle undefined case, see comment above
      mainSimLoaderLogger.warn(
        `ChoiceDescriptor ${stringifyChoiceOrAction(
          choice
        )} has a missing MapEntityDescriptor reference, ${
          choice.displayedMapEntity
        } could not be found.`
      );
    } else if (!mapDescriptor.binding) {
      mainSimLoaderLogger.warn(
        `ChoiceDescriptor ${stringifyChoiceOrAction(choice)} is bound to a MapEntityDescriptor ${
          mapDescriptor.uid
        } that has no location binding`
      );
    } else if (mapDescriptor.binding !== desc.binding) {
      mainSimLoaderLogger.warn(
        `Choice binding conflict: MapChoiceActionTemplateDescriptor "${
          desc.uid
        }" and ChoiceDescriptor "${stringifyChoiceOrAction(
          choice
        )}" have conflicting location bindings ("${desc.binding}" vs "${mapDescriptor.binding}").`
      );
    }
  }
}
