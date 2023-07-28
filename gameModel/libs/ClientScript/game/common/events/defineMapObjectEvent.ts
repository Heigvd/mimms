import { Position, SimDuration } from "../baseTypes";
import { ActionEvent } from "./eventTypes";

export type MapFeature = PointFeature | LineFeature;

interface BaseFeature<T> {
  type: string;
  name: string,
  id: number | string | undefined;
  geometry: T;
}

interface PointFeature extends BaseFeature<Position> {
  type: 'Point';
}

interface LineFeature extends BaseFeature<Position[]> {
  type: 'Line'
}

export interface DefineMapObjectEvent extends ActionEvent {
  durationSec: SimDuration;
  feature: MapFeature;
}