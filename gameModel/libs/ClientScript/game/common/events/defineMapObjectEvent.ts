import { ActorId, Position, SimDuration, SimTime } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface featurePayload {
  id?: number | string,
  featureType: GeometryType;
  feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
}

export interface selectPayload {
  id?: number | string,
  featureKey: string,
  featureId: string[],
}

export type MapFeature = CustomFeature | SelectFeature;

export type CustomFeature = PointFeature | StringLineFeature | PolygonFeature | MultiPolygonFeature

export type GeometryType = 'Point' | 'StringLine' | 'Polygon' | 'MultiPolygon' | 'Select';

interface BaseFeature {
  ownerId: ActorId,
  name: string,
  id?: string | number,
  geometryType: GeometryType,
  startTimeSec?: SimTime;
  durationTimeSec?: SimDuration;
}

interface DefineFeature<T> extends BaseFeature {
  geometry: T;
}

export interface PointFeature extends DefineFeature<Position> {
  geometryType: 'Point';
  icon?: string;
}

export interface StringLineFeature extends DefineFeature<Position[]> {
  geometryType: 'StringLine';
}

export interface PolygonFeature extends DefineFeature<Position[][]> {
  geometryType: 'Polygon';
}

export interface MultiPolygonFeature extends DefineFeature<Position[][][]> {
  geometryType: 'MultiPolygon';
}

export interface SelectFeature extends BaseFeature {
  geometryType: 'Select';
  featureKey: string;
  featureIds: string[];
}

export interface DefineMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  feature: CustomFeature;
}

export interface SelectMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  featureKey: string;
  featureId: string[];
}