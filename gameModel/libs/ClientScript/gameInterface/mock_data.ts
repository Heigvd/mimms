import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

////////////////////////////////////////////
//                                        //
// MOCK DATA - TO BE DEFINED BY SCENARIST //
//                                        //
////////////////////////////////////////////

// PMA details in action panel
// used in page 48
export const pmaDetails = [
  [true, true, 200, '6/10', false, false],
  [false, true, 20, '8/10', true, true],
  [false, false, 40, '9/10', true, true],
];

// used in page 48
export const pcDetails = [
  [true, true, 50, '6/10', false, true],
  [false, false, 10, '9/10', false, true],
  [true, false, 15, '3/10', true, false],
];

// TODO implement a more flexible system for custom fields ?
export function getBuildingDetails(location: LOCATION_ENUM) {
  switch (location) {
    case LOCATION_ENUM.PC:
      return pcDetails;
    case LOCATION_ENUM.PMA:
      return pmaDetails;
    default:
      return [];
  }
}
