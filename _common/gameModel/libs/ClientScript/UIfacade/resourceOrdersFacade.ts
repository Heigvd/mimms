import { TaskId } from '../game/common/baseTypes';
import { CommMedia } from '../game/common/radio/communicationType';
import { ResourceOrder, SubOrder } from '../game/common/resources/resourceOrdersType';
import { HumanResourceType } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { runActionButton } from '../gameInterface/actionsButtonLogic';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { resourceOrderLogger } from '../tools/logger';
import { uniqueActionTemplates } from '../UIfacade/actionFacade';
import { getResourceCountForTaskAndType } from './resourceFacade';

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

/**
 * Expects the main interface state to be present in context
 * gets the source location of the order
 */
function getSourceLocation(): LOCATION_ENUM {
  return getTypedInterfaceState()?.resourceManagementSourceLocation || LOCATION_ENUM.pcFront;
}

/**
 * Expects the main interface state to be present in context
 * Gets the type of communication used
 */
function getCommMedia(): CommMedia {
  return getTypedInterfaceState()?.resourceManagementCommMedia || CommMedia.Radio;
}

/**
 * @returns whether the current actor is giving orders by radio at the given location
 * (i.e. it is the order's source location, and the actor isn't physically there)
 */
export function isGivingRadioOrderAtLocation(location: LOCATION_ENUM): boolean {
  return getSourceLocation() === location && getCommMedia() === CommMedia.Radio;
}

/**
 * A suborder holds one source task only, so the batch being edited
 * has as many suborders as the source tasks the resources are taken from.
 *
 * @returns the suborder resources of that source task go into, created if needed
 */
function getOrInitOpenSubOrder(newState: ResourceOrder, task: TaskId): SubOrder {
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
export function setOrderDestination(location: LOCATION_ENUM, task: TaskId): void {
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

/**
 * @returns whether the given task is where the resources of the ongoing suborder were selected from
 */
export function isResourceSourceTask(task: TaskId): boolean {
  return getOngoingSubOrder()?.sourceTask === task;
}

export function currentOrderSelectedRessources(): number {
  const ongoing = getOngoingSubOrder();
  if (ongoing) {
    return countSubOrderResources(ongoing);
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

export function anyOrderPresent(): boolean {
  return getTypedResourceOrderCtx().state.payload.orders.length > 0;
}

export function isTaskValidSource(location: LOCATION_ENUM, task: TaskId): boolean {
  const ongoing = getOngoingSubOrder();
  if (ongoing) {
    return ongoing.source === location && ongoing.sourceTask === task;
  }
  return location === getSourceLocation();
}

/**
 * Add or remove resources in the current suborder of the given source task
 * a suborder is created if no suborder is ongoing
 */
export function addRemoveSelectedResourceAmount(
  task: TaskId,
  type: HumanResourceType,
  delta: number
): void {
  updateSelectedResourceAmount(task, type, currentAmount => currentAmount + delta);
}

/**
 * Set how many resources of the given type the current suborder of the given source task takes
 * a suborder is created if no suborder is ongoing
 */
export function setSelectedResourceAmount(
  task: TaskId,
  type: HumanResourceType,
  amount: number
): void {
  const source = getSourceLocation();
  const present = getResourceCountForTaskAndType(task, source, type);
  const previousOrdersCount = countCompleteSubordersSelectedResources(task, type);
  const available = present - previousOrdersCount;

  const sanitized = Math.min(Math.max(0, amount), available);
  updateSelectedResourceAmount(task, type, () => sanitized);
}

function updateSelectedResourceAmount(
  task: TaskId,
  type: HumanResourceType,
  computeAmount: (currentAmount: number) => number
): void {
  const ctx = getTypedResourceOrderCtx();
  const newState = Helpers.cloneDeep(ctx.state);
  const subOrder = getOrInitOpenSubOrder(newState.payload, task);
  if (subOrder.sourceTask === task) {
    subOrder.resources[type] = computeAmount(subOrder.resources[type] || 0);
    if (countSubOrderResources(subOrder) === 0) {
      // if the number of selected ressources drop to 0 cancel the whole suborder
      newState.payload.orders.pop();
    }
    ctx.setState(newState);
  } else {
    resourceOrderLogger.error(
      'Cannot add a ressource from task ' +
        task +
        ', a suborder from task ' +
        subOrder.sourceTask +
        ' is already ongoing'
    );
  }
}

export function getOngoingSuborderResourceCount(task: TaskId, type: HumanResourceType): number {
  const onGoing = getOngoingSubOrder();
  if (onGoing?.sourceTask === task) {
    return onGoing.resources[type] || 0;
  }
  return 0;
}

/**
 * Gets the selected resources count (selected in the current suborder)
 */
export function getOnGoingSuborderResourceCountForLocation(
  location: LOCATION_ENUM,
  task: TaskId,
  type: HumanResourceType
): number {
  if (getSourceLocation() === location) {
    return getOngoingSuborderResourceCount(task, type);
  }
  return 0;
}

/**
 * can the player choose this destination
 * @param location
 * @param task
 * @returns
 */
export function isDestinationValid(location: LOCATION_ENUM, task: TaskId): boolean {
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
export function canAddRessourceType(task: TaskId, type: HumanResourceType): boolean {
  return countAllocatableResources(getSourceLocation(), task, type) > 0;
}

export function canRemoveRessourceType(task: TaskId, type: HumanResourceType): boolean {
  const ongoing = getOngoingSubOrder();
  if (ongoing === undefined || ongoing.sourceTask !== task) {
    return false;
  }
  return (ongoing.resources[type] || 0) > 0;
}

export function isResourceLineHidden(
  location: LOCATION_ENUM,
  task: TaskId,
  type: HumanResourceType
): boolean {
  const present = getResourceCountForTaskAndType(task, location, type);
  const assigned = assignedRessourcesCount(location, task, type);
  return present + assigned <= 0;
}

/**
 * computes if the entered amount is valid (enough resources)
 * @param task
 * @param type
 */
export function isResourceNumberValid(
  resourceAmount: number,
  task: TaskId,
  type: HumanResourceType
): boolean {
  const source = getSourceLocation();

  const present = getResourceCountForTaskAndType(task, source, type);
  const previousOrdersCount = countCompleteSubordersSelectedResources(task, type);
  return resourceAmount >= 0 && resourceAmount <= present - previousOrdersCount;
}

function countSubOrderResources(subOrder: SubOrder): number {
  return Object.values(subOrder.resources).reduce<number>(
    (total, nbResources) => total + (nbResources || 0),
    0
  );
}

/**
 * @returns how many resources of that type all pending suborders have taken from that source task
 */
function countCumulatedSelectedResources(task: TaskId, type: HumanResourceType): number {
  const source = getSourceLocation();

  return getTypedResourceOrderCtx()
    .state.payload.orders.filter(order => order.source === source && order.sourceTask === task)
    .reduce((total, order) => total + (order.resources[type] || 0), 0);
}

/**
 * @returns how many resources of that type all assigned suborders have taken from that source task
 * excludes the ongoing suborder
 */
export function countCompleteSubordersSelectedResources(
  task: TaskId,
  type: HumanResourceType
): number {
  const source = getSourceLocation();

  return getTypedResourceOrderCtx()
    .state.payload.orders.filter(
      order => isSubOrderComplete(order) && order.source === source && order.sourceTask === task
    )
    .reduce((total, order) => total + (order.resources[type] || 0), 0);
}

/**
 * @returns how many resources of that type can still be taken from that source task.
 * that is, present ressources minus all the preallocated in order
 */
export function countAllocatableResources(
  location: LOCATION_ENUM,
  task: TaskId,
  type: HumanResourceType
): number {
  const count = getResourceCountForTaskAndType(task, location, type);
  return count - countCumulatedSelectedResources(task, type);
}

/**
 * Counts the ressources of all complete suborders
 */
export function assignedRessourcesCount(
  destination: LOCATION_ENUM,
  task: TaskId,
  type: HumanResourceType
): number {
  const orders = getTypedResourceOrderCtx().state.payload.orders;
  let count = 0;
  orders
    .filter(o => o.destination === destination && o.destinationTask === task)
    .forEach(o => (count += o.resources[type] || 0));
  return count;
}

/**
 * @returns true if the order is ready to be sent
 */
export function canSendOrder(): boolean {
  const orders = getTypedResourceOrderCtx().state.payload.orders;
  return isLastSubOrderComplete() && orders.length > 0;
}

export function sendOrder(): void {
  if (canSendOrder()) {
    const template = uniqueActionTemplates()?.MoveResourcesAssignTaskActionTemplate;
    runActionButton(template);
    resetOrders();
  }
}

/**
 * Generates a n times data structure for foreach components
 */
export function foreachHelper(n: number): { id: number }[] {
  return Array.from({ length: n }, (_, i) => ({ id: i }));
}
