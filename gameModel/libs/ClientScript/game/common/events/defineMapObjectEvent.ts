import { ActorId, Position, SimDuration, SimTime } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export type PointLikeObjects = PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];

export interface FeaturePayload {
  id?: number | string,
  featureType: GeometryType | 'Select';
  feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
}

export interface SelectPayload {
  id?: number | string,
  featureKey: string,
  featureId: string,
}

export type MapFeature = DefineFeature | SelectFeature;

export type DefineFeature = PointFeature | MultiPointFeature | LineStringFeature | MultiLineString | PolygonFeature | MultiPolygonFeature

export type InteractionType = 'Select' | 'Define'

export type GeometryType = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

interface BaseFeature {
  ownerId: ActorId,
  name: string,
  id?: string | number,
  geometryType: GeometryType | 'Select',
  startTimeSec?: SimTime;
  durationTimeSec?: SimDuration;
}

interface GeometryFeature<T> extends BaseFeature {
  geometry: T;
}

export interface PointFeature extends GeometryFeature<Position> {
  geometryType: 'Point';
  icon?: string;
  rotation?: number;
}

export interface MultiPointFeature extends GeometryFeature<Position[]> {
  geometryType: 'MultiPoint';
  icon?: string;
}

export interface LineStringFeature extends GeometryFeature<Position[]> {
  geometryType: 'LineString';
}

export interface MultiLineString extends GeometryFeature<Position[][]> {
  geometryType: 'MultiLineString';
}

export interface PolygonFeature extends GeometryFeature<Position[][]> {
  geometryType: 'Polygon';
}

export interface MultiPolygonFeature extends GeometryFeature<Position[][][]> {
  geometryType: 'MultiPolygon';
}

export interface SelectFeature extends BaseFeature {
  geometryType: 'Select';
  featureKey: string;
  featureIds: string;
}

export interface DefineMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  feature: DefineFeature;
}

export interface SelectMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  featureKey: string;
  featureId: string;
}