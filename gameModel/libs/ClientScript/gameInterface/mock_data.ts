////////////////////////////////////////////
//                                        //
// MOCK DATA - TO BE DEFINED BY SCENARIST //
//                                        //
////////////////////////////////////////////


// PMA details in action panel
export const pmaDetails = [
  [true, true, 200, "6/10", false, false],
  [false, true, 20, "8/10", true, true],
  [false, false, 40, "9/10", true, true],
];

export enum Proxmity {
  Regional,
  National,
  International,
}

interface PatientUnitType {
  typology: string;
  description?: string;
}

interface PatientUnitDefinition {
  placeType: PatientUnitType;
  availableCapacity: number;
}

interface HospitalDefinition {
  fullName: string;
  shortName: string;
  description?: string;
  proximity: Proxmity;
  distance: number;
  units: PatientUnitDefinition[];
}

// Hospital details
export const hospitalInfo: HospitalDefinition[] = [
  {
    fullName: "Hôpitaux universitaires de Genève",
    shortName: "HUGs",
    proximity: Proxmity.Regional,
    distance: 5,
    units: [
      {
        placeType: {
          typology: "Caisson hyperbare - assis",
        },
        availableCapacity: 30,
      },
      {
        placeType: {
          typology: "Caisson hyperbare - couchés",
        },
        availableCapacity: 10,
      },
      {
        placeType: {
          typology: "Traumas multiples",
        },
        availableCapacity: 50,
      },
      {
        placeType: {
          typology: "Traumas singulier",
        },
        availableCapacity: 1,
      },
    ]
  },
  {
    fullName: "Centre hospitalier universitaire vaudois",
    shortName: "CHUV",
    proximity: Proxmity.National,
    distance: 50,
    units: [
      {
        placeType: {
          typology: "Grand brûlés",
        },
        availableCapacity: 30,
      },
      {
        placeType: {
          typology: "Brûlés - mi-saignant",
        },
        availableCapacity: 20,
      },
      {
        placeType: {
          typology: "Brûlés - bien cuit",
        },
        availableCapacity: 10,
      },
    ]
  },
  {
    fullName: "Hôpital de La Tour à Meyrin",
    shortName: "La Tour",
    proximity: Proxmity.Regional,
    distance: 7,
    units: [
      {
        placeType: {
          typology: "Assurance privés uniquement",
        },
        availableCapacity: 2,
      },
      {
        placeType: {
          typology: "Fractures de fortune",
        },
        availableCapacity: 5,
      },
      {
        placeType: {
          typology: "Entorses des aisés",
        },
        availableCapacity: 30,
      },
    ]
  },
  {
    fullName: "Centre Hospitalier Intercommunal Sud-Léman Valserine",
    shortName: "St Julien",
    proximity: Proxmity.International,
    distance: 9,
    units: [
      {
        placeType: {
          typology: "Bobos kinésiologiques",
        },
        availableCapacity: 5,
      },
      {
        placeType: {
          typology: "Blessures ophtalmologiques",
        },
        availableCapacity: 10,
      },
      {
        placeType: {
          typology: "Brûlures par sèche-cheveux",
        },
        availableCapacity: 30,
      },
    ]
  },
]