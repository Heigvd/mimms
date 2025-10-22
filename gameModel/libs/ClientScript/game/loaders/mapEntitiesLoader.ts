import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { Uid } from '../common/interfaces';
import { MapEntityDescriptor } from '../common/mapEntities/mapEntityDescriptor';
import { MapEntityActivable } from '../common/simulationState/activableState';
import { LOCATION_ENUM } from '../common/simulationState/locationState';
import { getCurrentState } from '../mainSimulationLogic';

export function loadMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  return parseObjectDescriptor<MapEntityDescriptor>(Variable.find(gameModel, 'map_entity_data'));
}

// Singleton implementation, TODO other solution
let mapEntityDescriptors: Record<string, MapEntityDescriptor> | undefined = {};

Helpers.registerEffect(() => {
  mapEntityDescriptors = undefined;
});

// MAP ENTITIES GETTERS

// TODO Should this live here or elsewhere ?
export function getMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  if (!mapEntityDescriptors) {
    mapEntityDescriptors = loadMapEntityDescriptors();
  }
  return mapEntityDescriptors;
}

export function getMapEntityDescriptor(uid: Uid): MapEntityDescriptor {
  return getMapEntityDescriptors()[uid]!;
}

export function getMapEntityDescriptorUid(binding: LOCATION_ENUM): MapEntityDescriptor | undefined {
  return Object.values(getMapEntityDescriptors()).find(med => med.binding === binding);
}

export function getMapActivables(): MapEntityActivable[] {
  const activables = getCurrentState().getInternalStateObject().activables;

  return Object.values(activables).filter(
    a => a.activableType === 'mapEntity'
  ) as MapEntityActivable[];
}

export function getMapActivable(uid: Uid): MapEntityActivable | undefined {
  return getMapActivables().find(ma => ma.uid === uid);
}

export function getActiveMapActivables(): MapEntityActivable[] {
  return getMapActivables().filter(a => a.active);
}

export function getActiveMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  const activeUids = getActiveMapActivables().map(ma => ma.uid);
  const meds = getMapEntityDescriptors();

  const filtered: Record<string, MapEntityDescriptor> = {};
  for (const uid of activeUids) {
    if (uid in meds) {
      filtered[uid] = meds[uid];
    }
  }

  return filtered;
}
