import { VehicleType } from '../../../resources/resourceType';
import { LOCATION_ENUM } from '../../../simulationState/locationState';
import {
  MapChoiceActionTemplate,
  ParkChoiceTemplate,
  PCFrontChoiceTemplate,
  PCChoiceTemplate,
  SimFlag,
} from '../../actionTemplateBase';
import { ITemplateDescriptor } from '../../actionTemplateDescriptor/templateDescriptor';

export interface MapChoiceActionTemplateDescriptor extends ITemplateDescriptor {
  type: 'MapChoiceActionTemplateDescriptor';
  constructorType:
    | 'MapChoiceActionTemplate'
    | 'PCChoiceTemplate'
    | 'PCFrontChoiceTemplate'
    | 'AmbulanceParkChoiceTemplate' | 'HelicopterParkChoiceTemplate';
}

// TODO instead of a constructor type the LocationEnum binding could be used instead to infer the constructor

export function createMapChoiceActionTemplate(
  desc: MapChoiceActionTemplateDescriptor
): MapChoiceActionTemplate {
  // TODO multilang refactoring (figure out the question of hardcoded translation keys)
  // TODO see how feedback should be configured (the scenarists might like to customize depending on the choice) or no feedback ?
  // TODO raised flags issue (all the "BUILT" flags are redundant in state => this can be detected in the state)
  // need to figure out where this information is stored (Conditions and Impacts on flags are an option)


  switch (desc.constructorType) {
    case 'MapChoiceActionTemplate':
      return new MapChoiceActionTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        'figure out feedback',
        desc.repeatable > 1, // TODO replayable refactoring
        undefined, // TODO req flags if any
        [], // raised flags
        undefined, // TODO available to roles ?
        desc.choices,
        LOCATION_ENUM.custom
      );
    case 'PCChoiceTemplate':
      return new PCChoiceTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        'figure out feedback',
        false,
        undefined, // required flags
        [SimFlag.PC_BUILT],
        undefined, // TODO available to roles ?
        desc.choices
      );
    case 'PCFrontChoiceTemplate':
      return new PCFrontChoiceTemplate(
        desc.title,
        desc.description,
        desc.durationSec,
        'figure out feedback',
        false,
        [],
        [SimFlag.PCFRONT_BUILT],
        undefined, // TODO available to roles ?
        desc.choices
      );
    case 'AmbulanceParkChoiceTemplate':
      return createParkTemplate(desc, 'ambulance');
    case 'HelicopterParkChoiceTemplate':
      return createParkTemplate(desc, 'helicopter');
  }
}

function createParkTemplate(desc: MapChoiceActionTemplateDescriptor, vtype: VehicleType): ParkChoiceTemplate{

  const location = vtype === 'ambulance' ? LOCATION_ENUM.ambulancePark : LOCATION_ENUM.helicopterPark;
  const flag = vtype === 'ambulance' ? SimFlag.AMBULANCE_PARK_BUILT : SimFlag.HELICOPTER_PARK_BUILT;
  return new ParkChoiceTemplate(
    desc.title,
    desc.description,
    desc.durationSec,
    'figure out feedback',
    false,
    location,
    vtype,
    undefined,
    [flag],
    undefined, // available to roles ?
    desc.choices
  );
}