import { HumanResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { TaskType } from '../game/common/tasks/taskBase';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { ResourceOrderState } from '../gameInterface/resourceOrdersState';

type OrdersContext = {
  state: ResourceOrderState;
  setState: (newCtx: ResourceOrderState) => void;
};

export function getTypedResourceOrderCtx(): OrdersContext {
  return Context.resourceOrderState;
}

export function getInitialResourceOrderState(): ResourceOrderState {
  return {
    current: -1,
    orders: [],
  };
}

export function resetOrders(): void {
  getTypedResourceOrderCtx().setState(getInitialResourceOrderState());
}

function getSourceLocation(): LOCATION_ENUM {
  return getTypedInterfaceState().resourceManagementSourceLocation || LOCATION_ENUM.pcFront;
}

function initNewOrder(newState: ResourceOrderState): void {
  newState.current++;
  newState.orders.push({
    source: getSourceLocation(),
    ressources: {},
  });
}

export function setOrderDestination(location: LOCATION_ENUM, task: TaskType): void {
  const ctx = getTypedResourceOrderCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  const lastOrder = newState.orders[newState.current]!;
  lastOrder.destination = location;
  lastOrder.destinationTask = task;
  ctx.setState(newState);
}

export function isLastOrderComplete(): boolean {
  const state = getTypedResourceOrderCtx().state;
  if (state.current == -1) {
    return true;
  }
  return state.orders[state.current]?.destination !== undefined;
}

/**
 * Add or remove resources in current suborder
 */
export function changeSelectedResourceAmount(
  type: HumanResourceType,
  task: TaskType,
  delta: number
): void {
  const ctx = getTypedResourceOrderCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  if (isLastOrderComplete()) {
    initNewOrder(newState);
  }
  const order = newState.orders[newState.current];
  if (order) {
    if (!order.ressources[task]) {
      order.ressources[task] = {};
    }
    if (!order.ressources[task]![type]) {
      order.ressources[task]![type] = 0;
    }
    order.ressources[task]![type]! += delta;
  }
  ctx.setState(newState);
}
