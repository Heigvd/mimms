// TODO See which translations are OK

/**
 * Functions to which a resources can be assigned.
 */
export const ResourceFunctionArray = [
  'Estafette',
  'Pretrieur',
  'Brancardier',
  'Trieur',
  'SoignantFront',
  'SoignantPMA',
  'SoignantTransport',
  'MedecinFront',
  'MedecinPMA',
  'MedecinTransport',
  'Chauffeur',
] as const;

// infer type from array
export type ResourceFunction = typeof ResourceFunctionArray[number];
