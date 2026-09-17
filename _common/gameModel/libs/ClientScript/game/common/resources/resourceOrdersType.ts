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

export interface SubOrder {
  source: LOCATION_ENUM;
  sourceTask?: TaskId;
  destination?: LOCATION_ENUM;
  destinationTask?: TaskId;
  resources: Partial<Record<HumanResourceType, number>>;
}


export function isSubOrderComplete(subOrder: SubOrder): boolean {
  return subOrder.destination !== undefined && subOrder.destinationTask !== undefined;
}

/**
 * Computes the duration of an action that places this order (in minutes)
 * @param order
 * @returns
 */
export function computeOrderDurationMinutes(order: ResourceOrder | undefined): number {

  const n = (order?.orders || []).filter(sub => isSubOrderComplete(sub)).length;
  return n > 2 ? 2 : 1;

}