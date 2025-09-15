import { IActivableDescriptor, IDescriptor, Typed, Uid } from '../game/common/interfaces';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { parseObjectDescriptor, saveToObjectDescriptor } from '../tools/WegasHelper';

////// TYPES ///////
// XGO moved to common/mapEntities in MIM-487
export interface BaseMapObject<T> extends Typed{
  //type: 'Point' | 'Line' | 'Polygon';
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
// XGO typing seems ok to me, just a doubt on the genericity parameter, otherwise the integration is likely the same as impacts inside triggers
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

// XGO TODO move to loaders/mapEntitiesLoader MIM-487
// XGO using the generic parameter parseObjectDescriptor<MapEntityDescriptor> should do the trick which would make this function a one liner (see commented return statement)

// TODO Improve or have generic parsing
// Load all descriptors from variable
export function loadMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  const descs = parseObjectDescriptor(Variable.find(gameModel, 'mapEntityDescriptors'));
  for (const [key, value] of Object.entries(descs)) {
    descs[key] = JSON.parse(String(value));
  }

  return descs as Record<string, MapEntityDescriptor>;
  //return parseObjectDescriptor<MapEntityDescriptor>(Variable.find(gameModel, 'mapEntityDescriptors'));

}

// XGO : This will be automated in MapEntitiesController passing the variable key
export function saveMapEntityDescriptors(record: Record<string, MapEntityDescriptor>): void {
  const v = Variable.find(gameModel, 'mapEntityDescriptors');
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    data[key] = JSON.stringify(value);
  }

  saveToObjectDescriptor(v, data);
}

export function reloadMapEntityDescriptors() {
  mapEntityDescriptors = loadMapEntityDescriptors();
  return mapEntityDescriptors;
}

// XGO : not 100% sure but we will likely do lazy loading pattern here
// that is reset to {} with registerEffect (avoiding save script / restart issues)
// and getMapEntityDescriptors() will initialize if needed
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

// XGO those two functions will call the getMapEntityDescriptors() func
export function getMapEntityDescriptor(uid: Uid): MapEntityDescriptor {
  return mapEntityDescriptors[uid]!;
}

export function getMapEntityDescriptorUid(binding: LOCATION_ENUM): MapEntityDescriptor | undefined {
  return Object.values(mapEntityDescriptors).find(med => med.binding === binding);
}

///// ACTIVABLES /////

// XGO TODO => make a function by type of activable
// Type guards could help infer typing here to avoid casting but I see no other elegant solution
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
      // TODO Improve typing to remove assertion
      filtered[uid] = meds[uid]!;
    }
  }

  return filtered;
}
