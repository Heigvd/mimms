import { ChoiceDescriptor } from '../actions/choiceDescriptor/choiceDescriptor';
import { SimDuration } from '../baseTypes';
import { ActionCreationEvent } from './eventTypes';

export type PointLikeObjects =
  | PointLikeObject
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][];
export type SelectedPositionType =
  | PointLikeObject
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][]
  | undefined;
export type AvailablePositionType =
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][]
  | PointLikeObject[][][][]
  | undefined;

export enum BuildingStatus {
  selection = 'selection',
  inProgress = 'inProgress',
  ready = 'ready',
  removed = 'removed',
}

export interface MapChoiceEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  choice: ChoiceDescriptor;
}
