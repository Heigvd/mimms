import { ActionId, ActorId, GlobalEventId, ResourceId, SimTime, TaskId } from '../baseTypes';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from '../resources/resource';
import { resourceLogger } from '../../../tools/logger';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { ResourceType } from '../resources/resourceType';
import { getIdleTaskUid } from '../tasks/taskLogic';
import * as ResourceLogic from '../resources/resourceLogic';
import { LocalEventBase, SourceType } from './localEventBase';

export class ReserveResourcesLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
      readonly actionId: ActionId;
    }
  ) {
    super({ ...props, type: 'ReserveResourcesLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.reserveResources(state, this.props.resourcesId, this.props.actionId);
  }
}

export class UnReserveResourcesLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
    }
  ) {
    super({ ...props, type: 'UnReserveResourcesLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.unReserveResources(state, this.props.resourcesId);
  }
}

abstract class MoveResourcesLocalEventBase extends LocalEventBase {
  constructor(
    private readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly type: string;
      readonly ownerUid: ActorId;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({ ...props });
  }

  abstract getInvolvedResources(state: MainSimulationState): Resource[];

  applyStateUpdate(state: MainSimulationState): void {
    // TODO Replace with canMoveToLocation2
    if (!canMoveToLocation(state, 'Resources', this.props.targetLocation)) {
      resourceLogger.warn('The resources could not be moved as the target location is invalid');
      return;
    }

    const resources = this.getInvolvedResources(state);
    ResourceState.sendResourcesToLocation(resources, this.props.targetLocation);
  }
}

export class MoveResourcesLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly resourcesId: ResourceId[];
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({ ...extensionProps, type: 'MoveResourcesLocalEvent' });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return this.extensionProps.resourcesId.map(resourceId =>
      ResourceState.getResourceById(state, resourceId)
    );
  }
}

export class MoveFreeHumanResourcesByLocationLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly sourceLocation: LOCATION_ENUM;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({
      ...extensionProps,
      type: 'MoveFreeHumanResourcesByLocationLocalEvent',
    });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeHumanResourcesByLocation(state, this.extensionProps.sourceLocation);
  }
}

export class MoveFreeWaitingResourcesByTypeLocalEvent extends MoveResourcesLocalEventBase {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly resourceType: ResourceType;
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({
      ...extensionProps,
      type: 'MoveFreeWaitingResourcesByTypeLocalEvent',
    });
  }

  override getInvolvedResources(state: MainSimulationState): Resource[] {
    return ResourceState.getFreeWaitingResourcesByType(state, this.extensionProps.resourceType);
  }
}

export class MoveResourcesAtArrivalLocationLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesIds: ResourceId[];
    }
  ) {
    super({ ...props, type: 'MoveResourcesAtArrivalLocationLocalEvent' });
  }

  override applyStateUpdate(state: MainSimulationState) {
    this.props.resourcesIds.forEach(resourceId => {
      const resource: Resource = ResourceState.getResourceById(state, resourceId);
      const location = ResourceLogic.resourceArrivalLocationResolution(state, resource.type);
      ResourceState.sendResourcesToLocation([resource], location);
    });
  }
}

export class AssignResourcesToTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
      readonly taskId: TaskId;
    }
  ) {
    super({ ...props, type: 'AssignResourcesToTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.props.resourcesId, this.props.taskId);
  }
}

export class AssignResourcesToWaitingTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
    }
  ) {
    super({ ...props, type: 'AssignResourcesToWaitingTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.assignResourcesToTask(state, this.props.resourcesId, getIdleTaskUid(state));
  }
}

export class ReleaseResourcesFromTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly taskId: TaskId;
    }
  ) {
    super({ ...props, type: 'ReleaseResourcesFromTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const involvedResources: Resource[] = ResourceState.getFreeResourcesByTask(
      state,
      this.props.taskId
    );
    const involvedResourcesId: ResourceId[] = involvedResources.map(
      (resource: Resource) => resource.Uid
    );
    let location: LOCATION_ENUM = LOCATION_ENUM.entreeChantier;
    if ((involvedResources[0]?.currentLocation === LOCATION_ENUM.PMA)) {
      location = LOCATION_ENUM.PMA;
    }

    ResourceState.assignResourcesToTask(state, involvedResourcesId, getIdleTaskUid(state));
    ResourceState.sendResourcesToLocation(involvedResources, location);
  }
}
