import { HospitalDefinition, HospitalProximity } from '../game/common/evacuation/hospitalType';

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

// Hospital details
export const hospitalInfo: HospitalDefinition[] = [
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
        availableCapacity: 30,
      },
      {
        placeType: {
          typology: 'Caisson hyperbare - couchés',
        },
        availableCapacity: 10,
      },
      {
        placeType: {
          typology: 'Traumas multiples',
        },
        availableCapacity: 50,
      },
      {
        placeType: {
          typology: 'Traumas singulier',
        },
        availableCapacity: 1,
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
        availableCapacity: 30,
      },
      {
        placeType: {
          typology: 'Brûlés - mi-saignant',
        },
        availableCapacity: 20,
      },
      {
        placeType: {
          typology: 'Brûlés - bien cuit',
        },
        availableCapacity: 10,
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
          typology: 'Assurance privés uniquement',
        },
        availableCapacity: 2,
      },
      {
        placeType: {
          typology: 'Fractures de fortune',
        },
        availableCapacity: 5,
      },
      {
        placeType: {
          typology: 'Entorses des aisés',
        },
        availableCapacity: 30,
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
          typology: 'Bobos kinésiologiques',
        },
        availableCapacity: 5,
      },
      {
        placeType: {
          typology: 'Blessures ophtalmologiques',
        },
        availableCapacity: 10,
      },
      {
        placeType: {
          typology: 'Brûlures par sèche-cheveux',
        },
        availableCapacity: 30,
      },
    ],
  },
];
