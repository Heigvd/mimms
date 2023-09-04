import { Position, SimDuration, SimTime } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface featurePayload {
  id?: number | string,
  featureType: GeometryType;
  feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
}

export type MapFeature = PointFeature | StringLineFeature | PolygonFeature | MultiPolygonFeature;

export type GeometryType = 'Point' | 'StringLine' | 'Polygon' | 'MultiPolygon';

interface BaseFeature<T> {
  geometryType: GeometryType,
  name: string,
  id?: number | string;
  geometry: T;
  startTimeSec?: SimTime;
  durationTimeSec?: SimDuration;
}

export interface PointFeature extends BaseFeature<Position> {
  geometryType: 'Point';
  icon?: string;
}

export interface StringLineFeature extends BaseFeature<Position[]> {
  geometryType: 'StringLine'
}

export interface PolygonFeature extends BaseFeature<Position[][]> {
  geometryType: 'Polygon'
}

export interface MultiPolygonFeature extends BaseFeature<Position[][][]> {
  geometryType: 'MultiPolygon'
}

export interface DefineMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  feature: MapFeature;
}