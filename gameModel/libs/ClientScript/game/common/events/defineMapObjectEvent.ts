import { Position, SimDuration } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export interface featurePayload {
  id?: number | string,
  featureType: GeometryType;
  feature: PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
}

export type MapFeature = PointFeature | StringLineFeature | PolygonFeature | MultiPolygonFeature;

export type GeometryType = 'Point' | 'StringLine' | 'Polygon' | 'MultiPolygon';

interface BaseFeature<T> {
  type: GeometryType,
  name: string,
  id?: number | string;
  geometry: T;
}

interface PointFeature extends BaseFeature<Position> {
  type: 'Point';
}

interface StringLineFeature extends BaseFeature<Position[]> {
  type: 'StringLine'
}

interface PolygonFeature extends BaseFeature<Position[][]> {
  type: 'Polygon'
}

interface MultiPolygonFeature extends BaseFeature<Position[][][]> {
  type: 'MultiPolygon'
}

export interface DefineMapObjectEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  feature: MapFeature;
}