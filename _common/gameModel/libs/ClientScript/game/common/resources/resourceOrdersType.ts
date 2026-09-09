import { CommMedia } from '../radio/communicationType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { TaskType } from '../tasks/taskBase';
import { HumanResourceType } from './resourceType';

export interface ResourceOrder {
  orders: SubOrder[];
  /**
   * How the orders are given, radio or face to face
   */
  commMedia: CommMedia;
}

export interface SubOrder {
  source: LOCATION_ENUM;
  sourceTask?: TaskType;
  destination?: LOCATION_ENUM;
  destinationTask?: TaskType;
  resources: Partial<Record<HumanResourceType, number>>;
}
