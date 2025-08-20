import { IActivableDescriptor, IDescriptor, Typed, Uid } from '../game/common/interfaces';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { parseObjectDescriptor } from '../tools/WegasHelper';

////// TYPES ///////

export interface BaseMapObject<T> {
  type: 'Point' | 'Line' | 'Polygon';
  geometry: T;
}

export interface PointMapObject extends BaseMapObject<PointLikeObject> {
  type: 'Point';
  geometry: PointLikeObject;
}

export interface LineMapObject extends BaseMapObject<PointLikeObject[]> {
  type: 'Line';
  geometry: PointLikeObject[];
}

export interface PolygonMapObject extends BaseMapObject<PointLikeObject[][]> {
  type: 'Polygon';
  geometry: PointLikeObject[][];
}

export type MapObject = PointMapObject | LineMapObject | PolygonMapObject;

export type BuildStatus = 'pending' | 'built';

export interface MapEntityDescriptor extends IActivableDescriptor, IDescriptor, Typed {
  type: 'mapEntity';
  activableType: 'mapEntity';
  // parent: Uid, TODO ?
  mapObjects: MapObject[];
  binding: LOCATION_ENUM;
  activeAtStart: boolean;
  buildStatus: BuildStatus;
}

export function getTestMapEntityDescriptor(): MapEntityDescriptor {
  return {
    uid: 'lekkim_active',
    type: 'mapEntity',
    activableType: 'mapEntity',
    activeAtStart: true,
    mapObjects: [{ type: 'Point', geometry: [2500100, 1118500] }],
    tag: 'mainIncident',
    binding: LOCATION_ENUM.custom,
    buildStatus: 'built',
  };
}

///// MAP ENTITY DESCRIPTORS /////

// TODO Improve or have generic parsing
// Load all descriptors from variable
export function loadMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  const descs = parseObjectDescriptor(Variable.find(gameModel, 'mapEntityDescriptors'));
  for (const [key, value] of Object.entries(descs)) {
    descs[key] = JSON.parse(String(value));
  }

  return descs as Record<string, MapEntityDescriptor>;
}

/**
 * Singleton, used to load mapObjects. Readonly !
 */
export let mapEntityDescriptors: Record<string, MapEntityDescriptor> = {};

Helpers.registerEffect(() => {
  mapEntityDescriptors = loadMapEntityDescriptors();
});

export function getMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  return mapEntityDescriptors;
}

export function getMapEntityDescriptor(uid: Uid): MapEntityDescriptor {
  return mapEntityDescriptors[uid];
}

export function getMapEntityDescriptorUid(binding: LOCATION_ENUM): MapEntityDescriptor | undefined {
  return Object.values(mapEntityDescriptors).find(med => med.binding === binding);
}

///// ACTIVABLES /////

/**
 * Get all mapActivables
 */
export function getMapActivables(): MapEntityActivable[] {
  const activables = getCurrentState().getInternalStateObject().activables;
  // TODO Avoid casting type ?
  return Object.values(activables).filter(
    activable => activable.activableType === 'mapEntity'
  ) as MapEntityActivable[];
}

/**
 * Get mapActivable with given uid or undefined
 */
export function getMapActivable(uid: Uid): MapEntityActivable | undefined {
  return getMapActivables().find(a => a.uid === uid);
}

/**
 * Get all active mapActivables
 */
export function getActiveMapActivables(): MapEntityActivable[] {
  return getMapActivables().filter(activable => activable.active);
}

///// MAP OBJECTS /////

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
