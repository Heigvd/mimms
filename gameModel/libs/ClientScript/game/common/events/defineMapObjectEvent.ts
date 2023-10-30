import { ActorId, Position, SimDuration, SimTime } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface FeaturePayload {
  id?: number | string,
  featureType: GeometryType;
  feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
}

export interface SelectPayload {
  id?: number | string,
  featureKey: string,
  featureId: string,
}

export type MapFeature = CustomFeature | SelectFeature;

export type CustomFeature = PointFeature | LineStringFeature | PolygonFeature | MultiPolygonFeature

export type InteractionType = 'Select' | 'Define'

export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | 'Select';

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

export interface LineStringFeature extends DefineFeature<Position[]> {
  geometryType: 'LineString';
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
  featureIds: string;
}

export interface DefineMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  feature: CustomFeature;
}

export interface SelectMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  featureKey: string;
  featureId: string;
}