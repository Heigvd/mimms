import { IActivableDescriptor, IDescriptor, Indexed, Typed, Uid } from '../interfaces';
import { LOCATION_ENUM } from '../simulationState/locationState';

export interface BaseMapObject<T, TType extends string> extends Typed, Indexed, IDescriptor {
  type: TType;
  geometry: T;
  parent: Uid;
  label: ITranslatableContent;
  labelOffset: string; // XGO TODO ?? strange typing here
}

export interface PointMapObject extends BaseMapObject<PointLikeObject, 'Point'> {
  type: 'Point';
  geometry: PointLikeObject;
  icon: string;
}

export interface LineMapObject extends BaseMapObject<PointLikeObject[], 'LineString'> {
  type: 'LineString';
  geometry: PointLikeObject[];
}

export interface PolygonMapObject extends BaseMapObject<PointLikeObject[][], 'Polygon'> {
  type: 'Polygon';
  geometry: PointLikeObject[][];
}

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
