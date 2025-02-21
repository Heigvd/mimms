import { HospitalDefinitionOld, HospitalProximity } from '../game/common/evacuation/hospitalType';
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

// Hospital details
export const hospitalInfo: HospitalDefinitionOld[] = [
  {
    hospitalId: 'CH-GE-HUG',
    fullName: 'Hôpitaux universitaires de Genève',
    shortName: 'HUG',
    nameAsDestination: {
      en: 'to HUG',
      fr: 'aux HUG',
    },
    proximity: HospitalProximity.Regional,
    distance: 5,
    units: [
      {
        placeType: {
          typology: 'Caisson hyperbare - assis',
        },
        availableCapacity: 8,
      },
      {
        placeType: {
          typology: 'Caisson hyperbare - couchés',
        },
        availableCapacity: 2,
      },
      {
        placeType: {
          typology: 'Polytraumatisés',
        },
        availableCapacity: 4,
      },
      {
        placeType: {
          typology: 'Traumas simples',
        },
        availableCapacity: 20,
      },
    ],
  },
  {
    hospitalId: 'CH-VD-CHUV',
    fullName: 'Centre hospitalier universitaire vaudois',
    shortName: 'CHUV',
    nameAsDestination: {
      en: 'to CHUV',
      fr: 'au CHUV',
    },
    proximity: HospitalProximity.National,
    distance: 50,
    units: [
      {
        placeType: {
          typology: 'Grand brûlés',
        },
        availableCapacity: 5,
      },
    ],
  },
  {
    hospitalId: 'CH-GE-LA_TOUR',
    fullName: 'Hôpital de La Tour à Meyrin',
    shortName: 'La Tour',
    nameAsDestination: {
      en: 'to La Tour',
      fr: 'à La Tour',
    },
    proximity: HospitalProximity.Regional,
    distance: 7,
    units: [
      {
        placeType: {
          typology: 'Polytraumatisés',
        },
        availableCapacity: 1,
      },
      {
        placeType: {
          typology: 'Traumas simples',
        },
        availableCapacity: 5,
      },
    ],
  },
  {
    hospitalId: 'FR-76-SAINT-JULIEN',
    fullName: 'Centre Hospitalier Intercommunal Sud-Léman Valserine',
    shortName: 'St Julien',
    nameAsDestination: {
      en: 'to Saint-Julien',
      fr: 'à Saint-Julien',
    },
    proximity: HospitalProximity.International,
    distance: 9,
    units: [
      {
        placeType: {
          typology: 'Polytraumatisés',
        },
        availableCapacity: 1,
      },
      {
        placeType: {
          typology: 'Traumas simples',
        },
        availableCapacity: 6,
      },
    ],
  },
];
