import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { MapEntityDescriptor } from '../mikkWIP/mapEntityDescriptors';

export function getLocationEnumValues(): { label: string; value: string; disabled?: boolean }[] {
  return Object.entries(LOCATION_ENUM).map(([key, value]) => ({
    label: key,
    value: value,
  }));
}

// TODO Add other geometry types and n+1 mapObjects
export function getNewMapEntityDescriptor(): MapEntityDescriptor {
  const uid = String(Date.now());

  return {
    uid: uid,
    type: 'mapEntity',
    activableType: 'mapEntity',
    activeAtStart: false,
    mapObjects: [
      {
        type: 'Point',
        geometry: [0, 0],
      },
    ],
    tag: uid,
    binding: LOCATION_ENUM.custom,
    buildStatus: 'built',
  };
}
