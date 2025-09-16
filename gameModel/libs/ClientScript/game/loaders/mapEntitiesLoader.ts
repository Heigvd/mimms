// XGO TODO

// XGO using the generic parameter parseObjectDescriptor<MapEntityDescriptor> should do the trick which would make this function a one liner (see commented return statement)

// TODO Improve or have generic parsing
// Load all descriptors from variable
/*
export function loadMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  const descs = parseObjectDescriptor(Variable.find(gameModel, 'mapEntityDescriptors'));
  for (const [key, value] of Object.entries(descs)) {
    descs[key] = JSON.parse(String(value));
  }

  return descs as Record<string, MapEntityDescriptor>;
  //return parseObjectDescriptor<MapEntityDescriptor>(Variable.find(gameModel, 'mapEntityDescriptors'));

}
*/
