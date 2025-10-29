import { IActivableDescriptor, IDescriptor, Indexed, Typed } from '../interfaces';
import { LOCATION_ENUM } from '../simulationState/locationState';

export interface BaseMapObject<T> extends Typed, Indexed, IDescriptor {
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

export interface MapEntityDescriptor extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  type: 'mapEntity';
  activableType: 'mapEntity';
  mapObjects: MapObject[];
  binding: LOCATION_ENUM;
  activeAtStart: boolean;
  buildStatus: BuildStatus;
}
