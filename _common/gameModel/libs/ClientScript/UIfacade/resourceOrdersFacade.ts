import { CommMedia } from '../game/common/radio/communicationType';
import { ResourceOrder, SubOrder } from '../game/common/resources/resourceOrdersType';
import { HumanResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getFreeResourcesByTypeLocationAndTask } from '../game/common/simulationState/resourceStateAccess';
import { getTaskByTypeAndLocation } from '../game/common/simulationState/taskStateAccess';
import { TaskBase, TaskType } from '../game/common/tasks/taskBase';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { resourceOrderLogger } from '../tools/logger';

interface ResourceOrdersInterfaceState {
  payload: ResourceOrder;
}

type OrdersContext = {
  state: ResourceOrdersInterfaceState;
  setState: (newCtx: ResourceOrdersInterfaceState) => void;
};

export function getTypedResourceOrderCtx(): OrdersContext {
  return Context.resourceOrderState;
}

export function getInitialResourceOrderState(): ResourceOrdersInterfaceState {
  return {
    payload: {
      orders: [],
      commMedia: getCommMedia(),
    },
  };
}

export function resetOrders(): void {
  getTypedResourceOrderCtx().setState(getInitialResourceOrderState());
}

function getSourceLocation(): LOCATION_ENUM {
  return getTypedInterfaceState().resourceManagementSourceLocation || LOCATION_ENUM.pcFront;
}

function getCommMedia(): CommMedia {
  return getTypedInterfaceState().resourceManagementCommMedia || CommMedia.Radio;
}

/**
 * A suborder holds one source task only, so the batch being edited
 * has as many suborders as the source tasks the resources are taken from.
 *
 * @returns the suborder resources of that source task go into, created if needed
 */
function getOrInitOpenSubOrder(newState: ResourceOrder, task: TaskType): SubOrder {
  const lastSubOrder = newState.orders[newState.orders.length - 1];

  if (lastSubOrder && !isSubOrderComplete(lastSubOrder)) {
    return lastSubOrder;
  }

  const newSubOrder: SubOrder = {
    source: getSourceLocation(),
    sourceTask: task,
    resources: {},
  };
  newState.orders.push(newSubOrder);

  return newSubOrder;
}

/**
 * Complete the batch being edited. All its suborders share the same destination.
 */
export function setOrderDestination(location: LOCATION_ENUM, task: TaskType): void {
  const ctx = getTypedResourceOrderCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  newState.payload.orders
    .filter(order => order.destination === undefined)
    .forEach(order => {
      order.destination = location;
      order.destinationTask = task;
    });
  ctx.setState(newState);
}

export function canSetOrderDestination(): boolean {
  return !isLastSubOrderComplete() && currentOrderSelectedRessources() > 0;
}

export function currentOrderSelectedRessources(): number {
  const ongoing = getOngoingSubOrder();
  if (ongoing) {
    return countResources(ongoing);
  }
  return 0;
}

/**
 *
 * @returns the last incomplete order, if all complete return undefined
 */
export function getOngoingSubOrder(): SubOrder | undefined {
  if (isLastSubOrderComplete()) {
    return undefined;
  }
  const orders = getTypedResourceOrderCtx().state.payload.orders;
  return orders.length === 0 ? undefined : orders[orders.length - 1];
}

function isSubOrderComplete(subOrder: SubOrder): boolean {
  return subOrder.destination !== undefined && subOrder.destinationTask !== undefined;
}

export function isLastSubOrderComplete(): boolean {
  const orders = getTypedResourceOrderCtx().state.payload.orders;
  if (orders.length === 0) {
    return true;
  }
  return isSubOrderComplete(orders[orders.length - 1]!);
}

/**
 * @returns true if the order is ready to be sent
 */
export function canSendOrder(): boolean {
  const orders = getTypedResourceOrderCtx().state.payload.orders;
  return isLastSubOrderComplete() && orders.length > 0;
}

/**
 * Add or remove resources in the current suborder of the given source task
 * a suborder is created if no suborder is ongoing
 */
export function addRemoveSelectedResourceAmount(
  type: HumanResourceType,
  task: TaskType,
  delta: number
): void {
  updateSelectedResourceAmount(type, task, currentAmount => currentAmount + delta);
}

/**
 * Set how many resources of the given type the current suborder of the given source task takes
 * a suborder is created if no suborder is ongoing
 */
export function setSelectedResourceAmount(
  type: HumanResourceType,
  task: TaskType,
  amount: number
): void {
  updateSelectedResourceAmount(type, task, () => amount);
}

function updateSelectedResourceAmount(
  type: HumanResourceType,
  task: TaskType,
  computeAmount: (currentAmount: number) => number
): void {
  const ctx = getTypedResourceOrderCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  const subOrder = getOrInitOpenSubOrder(newState.payload, task);
  if(subOrder.sourceTask === task){
    subOrder.resources[type] = computeAmount(subOrder.resources[type] || 0);
    if(countResources(subOrder) === 0){
      // if the number of selected ressources drop to 0 cancel the whole suborder
      newState.payload.orders.pop();
    }
    ctx.setState(newState);
  }else {
    resourceOrderLogger.error("Cannot add a ressource from task type" + task +", a suborder with resource type " + subOrder.sourceTask + " is already ongoing");
  }
}

/**
 * can the player choose this destination
 * @param location
 * @param task
 * @returns
 */
export function isDestinationValid(location: LOCATION_ENUM, task: TaskType): boolean {
  const order = getOngoingSubOrder();
  if (order) {
    return task !== order.sourceTask || location !== order.source;
  }
  // no destination is valid if no order is ongoing
  return false;
}

/**
 * returns true if a ressource of type and task can be added to the current order
 * @param task
 * @param type
 */
export function canAddRessourceType(task: TaskType, type: HumanResourceType): boolean {
  return countAllocatableResources(task, type) > 0;
}

export function canRemoveRessourceType(task: TaskType, type: HumanResourceType): boolean {
  const ongoing = getOngoingSubOrder();
  if (ongoing === undefined || ongoing.sourceTask !== task) {
    return false;
  }
  return (ongoing.resources[type] || 0) > 0;
}

/**
 * computes if the entered amount is a valid quantity to place an order
 * @param task
 * @param type
 */
export function isResourceNumberValid(
  resourceAmount: number,
  task: TaskType,
  type: HumanResourceType
): boolean {
  const ongoing = getOngoingSubOrder();
  // the amount replaces what the ongoing suborder holds, that share goes back to the pool
  const replacedAmount =
    ongoing !== undefined && ongoing.sourceTask === task ? ongoing.resources[type] || 0 : 0;

  return (
    resourceAmount >= 0 && resourceAmount <= countAllocatableResources(task, type) + replacedAmount
  );
}

function countResources(subOrder: SubOrder): number {
  return Object.values(subOrder.resources).reduce<number>(
    (total, nbResources) => total + (nbResources || 0),
    0
  );
}

/**
 * The whole order is sent at once, so the suborders already completed still hold their share.
 *
 * @returns how many resources of that type the pending suborders take from that source task
 */
function countSelectedResources(task: TaskType, type: HumanResourceType): number {
  const source = getSourceLocation();

  return getTypedResourceOrderCtx()
    .state.payload.orders.filter(order => order.source === source && order.sourceTask === task)
    .reduce((total, order) => total + (order.resources[type] || 0), 0);
}

/**
 * @returns how many resources of that type can still be taken from that source task
 */
function countAllocatableResources(task: TaskType, type: HumanResourceType): number {
  const source = getSourceLocation();
  const state = getCurrentState();
  // typed as a TaskBase but there might be no such task at that location
  const sourceTask: TaskBase | undefined = getTaskByTypeAndLocation(state, task, source);

  if (sourceTask === undefined) {
    return 0;
  }

  return (
    getFreeResourcesByTypeLocationAndTask(state, type, source, sourceTask.Uid).length -
    countSelectedResources(task, type)
  );
}
