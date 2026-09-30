import { ActorId, GlobalEventId, ResourceId, SimTime, TaskId } from '../baseTypes';
import { canMoveToLocation, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from '../resources/resource';
import { resourceLogger } from '../../../tools/logger';
import { getIdleTaskUid } from '../tasks/taskLogic';
import { LocalEventBase, SourceType } from './localEventBase';
import {
  getResourceById,
  sendResourcesToLocation,
  assignResourcesToTask,
} from '../simulationState/resourceStateAccess';

export class MoveResourcesLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly ownerUid: ActorId;
      readonly resourcesId: ResourceId[];
      readonly targetLocation: LOCATION_ENUM;
    }
  ) {
    super({ ...props, type: 'MoveResourcesLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    if (!canMoveToLocation(state, 'Resources', this.props.targetLocation)) {
      resourceLogger.warn('The resources could not be moved as the target location is invalid');
      return;
    }

    const resources = this.props.resourcesId.map(rid => getResourceById(state, rid));
    sendResourcesToLocation(resources, this.props.targetLocation);
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
    assignResourcesToTask(state, this.props.resourcesId, this.props.taskId);
  }
}

export class ReleaseResourcesFromTaskLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly resourcesId: ResourceId[];
    }
  ) {
    super({ ...props, type: 'ReleaseResourcesFromTaskLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    for (const resourceId of this.props.resourcesId) {
      const resource: Resource = getResourceById(state, resourceId);

      const location: LOCATION_ENUM =
        resource.currentLocation === LOCATION_ENUM.PMA
          ? LOCATION_ENUM.PMA
          : LOCATION_ENUM.entreeChantier;

      const idleTaskUid: TaskId | undefined = getIdleTaskUid(state, location);

      if (idleTaskUid == undefined) {
        resourceLogger.error(
          `Resources cannot wait for orders at ${location}, so resource ${resourceId} stays on its task`
        );
        continue;
      }

      sendResourcesToLocation([resource], location);
      assignResourcesToTask(state, [resourceId], idleTaskUid);
    }
  }
}
