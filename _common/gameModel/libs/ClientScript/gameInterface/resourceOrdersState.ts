import { HumanResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { TaskType } from '../game/common/tasks/taskBase';

export interface ResourceOrderState {
  orders: SubOrder[];
  /**
   * -1 means no order started
   */
  current: number;
}

export interface SubOrder {
  source: LOCATION_ENUM;
  destination?: LOCATION_ENUM;
  destinationTask?: TaskType;
  ressources: Partial<Record<TaskType, Partial<Record<HumanResourceType, number>>>>;
}
