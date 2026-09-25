import { TaskId } from '../baseTypes';
import { CommMedia } from '../radio/communicationType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { HumanResourceType } from './resourceType';

export interface ResourceOrder {
  orders: SubOrder[];
  /**
   * How the orders are given, radio or face to face
   */
  commMedia: CommMedia;
}

/**
 * The tasks are referred to by their id, the ids being handed out in the order the tasks
 * are built by loadTasks(). A sub-order is persisted in the event log, so reordering or
 * inserting tasks in loadTasks() silently changes what an already sent order points to.
 */
export interface SubOrder {
  source: LOCATION_ENUM;
  sourceTask?: TaskId;
  destination?: LOCATION_ENUM;
  destinationTask?: TaskId;
  resources: Partial<Record<HumanResourceType, number>>;
}
