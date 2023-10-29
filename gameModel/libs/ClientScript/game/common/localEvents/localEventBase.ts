import { HumanBody } from "../../../HUMAn/human";
import { getTranslation } from "../../../tools/translation";
import { getEnv } from "../../../tools/WegasHelper";
import { ActionBase, OnTheRoadAction } from "../actions/actionBase";
import { Actor, InterventionRole, sortByHierarchyLevel } from "../actors/actor";
import { ActorId, GlobalEventId, SimDuration, SimTime, TaskId, TemplateId, TranslationKey } from "../baseTypes";
import { TimeSliceDuration } from "../constants";
import { MapFeature } from "../events/defineMapObjectEvent";
import { computeNewPatientsState } from "../patients/handleState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";
import { TaskStatus } from "../tasks/taskBase";
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceContainerDefinition, ResourceContainerDefinitionId } from "../resources/resourceContainer";
import { getContainerDef, resolveResourceRequest } from "../resources/emergencyDepartment";
import { getOrCreateResourceGroup } from "../resources/resourceGroup";
import { localEventManager } from "../localEvents/localEventManager";
import { entries } from "../../../tools/helper";
import { Resource } from "../resources/resource";
import { MethanePayload } from "../events/methaneEvent";

export type EventStatus = 'Pending' | 'Processed' | 'Cancelled' | 'Erroneous'

export interface LocalEvent {
  type: string;
  parentEventId: GlobalEventId;
  simTimeStamp: SimTime
}

export abstract class LocalEventBase implements LocalEvent{

  private static eventCounter = 0;

  /**
   * Used for ordering
   */
  public readonly eventNumber: number;

  protected constructor(
    readonly parentEventId: GlobalEventId, 
    readonly type: string, 
    readonly simTimeStamp: number){
      this.eventNumber = LocalEventBase.eventCounter++;
  }

  /**
   * Applies the effects of this event to the state
   * @param state In this function, state changes are allowed
   */
  abstract applyStateUpdate(state: MainSimulationState): void;

}

/**
 * @param e1 
 * @param e2 
 * @returns true if e1 precedes e2
 */
export function compareLocalEvents(e1 : LocalEventBase, e2: LocalEventBase): boolean {
  if(e1.simTimeStamp === e2.simTimeStamp){
    return e1.eventNumber < e2.eventNumber;
  }
  return e1.simTimeStamp < e2.simTimeStamp;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// TODO move in own file
// immutable
/**
 * Creates an action to be inserted in the timeline and inits it
 */
export class PlanActionLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly action: ActionBase){
    super(parentEventId, 'PlanActionEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.actions.push(this.action);
    // init action
    this.action.update(state);
  }

}

// Update status of action
export class CancelActionLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly templateId: TemplateId, readonly actorUid: ActorId, readonly planTime: SimTime){
    super(parentEventId, 'CancelActionEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
      const so = state.getInternalStateObject();

      const action = so.actions.find(a => a.getTemplateId() === this.templateId && a.ownerId === this.actorUid);

      if (action && action.startTime === this.planTime) {
		// We remove the action and place it in cancelled actions
        so.actions.splice(so.actions.indexOf(action), 1);
        so.cancelledActions.push(action);
        action.cancel(state);
      } else {
        // err.log
      }

  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// time
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------


/////////// TODO in own file
// TODO dynamic time progression (continue advancing until something relevant happens)
export class TimeForwardLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly timeJump: number){
    super(parentEventId, 'TimeForwardEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.incrementSimulationTime(this.timeJump);
    const so = state.getInternalStateObject();

    // update patients
    this.updatePatients(so.patients, this.timeJump);

    // update all actions =>
    this.updateActions(state);

    // update all tasks
    this.updateTasks(state);
  }

  updatePatients(patients: Readonly<HumanBody[]>, timeJump: number) {
    computeNewPatientsState(patients as HumanBody[], timeJump, getEnv());
  }

  updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  updateTasks(state: MainSimulationState) {
    TaskState.getAllTasks(state).forEach(t => t.update(state, this.timeJump));
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// map items
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/////////// TODO in own file
export class AddMapItemLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly feature: MapFeature){
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.push(this.feature);
  }

}

export class RemoveMapItemLocalEvent extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly feature: MapFeature) {
		super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const so = state.getInternalStateObject();
		so.mapLocations.splice(so.mapLocations.findIndex(f => f.name === this.feature.name && f.ownerId === this.feature.ownerId), 1);
	}
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// actors
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------


export class AddActorLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, private role: InterventionRole, private travelTime: SimDuration){
    super(parentEventId, 'AddActorLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {

	const actor = new Actor(this.role);
	state.getInternalStateObject().actors.push(actor);

	const travelAction = new OnTheRoadAction(state.getSimTime(), this.travelTime, 'methane-acs-arrived', 'on-the-road', 0, actor.Uid, 0);
	state.getInternalStateObject().actions.push(travelAction);

	// the resource pool assignation is delayed to the arrival time of the actor
	localEventManager.queueLocalEvent(new ResourceGroupBinding(this.parentEventId, state.getSimTime() + this.travelTime, actor.Uid));

	  /*
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "ACS" ) == undefined) {
      const acs = new Actor('ACS', 'actor-acs', 'actor-acs-long');
      state.getInternalStateObject().actors.push(acs);
      const acsAction = new OnTheRoadAction(state.getSimTime(), TimeSliceDuration * 3, 'methane-acs-arrived', 'on-the-road', 0, acs.Uid, 0);
      state.getInternalStateObject().actions.push(acsAction);
    }
    if (state.getInternalStateObject().actors.find((actor) => actor.Role == "MCS" ) == undefined) {
      const mcs = new Actor('MCS', 'actor-mcs', 'actor-mcs-long');
      state.getInternalStateObject().actors.push(mcs);
      const mcsAction = new OnTheRoadAction(state.getSimTime(), TimeSliceDuration * 3, 'methane-mcs-arrived', 'on-the-road', 0, mcs.Uid, 0);
      state.getInternalStateObject().actions.push(mcsAction);
    }*/
  }

}

/**
 * Binds an actor to its resource group
 */
export class ResourceGroupBinding extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, private ownerId: ActorId){
		super(parentEventId, 'AddActorLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		// create resource group if not present
		getOrCreateResourceGroup(state, this.ownerId);
	}

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// radio
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class AddRadioMessageLocalEvent extends LocalEventBase {

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId, 
    public readonly emitter: TranslationKey,
    public readonly message: TranslationKey)
  {
      super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
	
    state.getInternalStateObject().radioMessages.push({
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp,
      emitter: this.emitter,
      message: getTranslation('mainSim-actions-tasks', this.message),
    })
  }

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// tasks and resources
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Local event to transfer resources from an actor to another
 */
export class TransferResourcesLocalEvent extends LocalEventBase {
  constructor(parentId: GlobalEventId,
              timeStamp: SimTime,
              public readonly senderActor: ActorId,
              public readonly receiverActor: ActorId,
              public readonly sentResources: ResourceTypeAndNumber,
  ) {
    super(parentId, 'TransferResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.transferResourcesBetweenActors(state, this.senderActor, this.receiverActor, this.sentResources);
  }
}

/**
 * Local event to receive new resources for an actor.
 */
/*
export class IncomingResourcesLocalEvent extends LocalEventBase {

  constructor(parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly actorId: ActorId,
    public readonly resourceType: ResourceType,
    public readonly nb: number) {
      super(parentId, 'IncomingResourcesLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.addIncomingResourcesToActor(state, this.actorId, this.resourceType, this.nb);
  }

}
*/

/**
 * Spawned when the emergency dept sends resource containers
 */
export class ResourceMobilizationEvent extends LocalEventBase {

	constructor(parentId: GlobalEventId,
	timeStamp: SimTime,
	public readonly departureTime: SimTime,
	public readonly travelTime: SimDuration,
	public readonly containerType: ResourceContainerDefinitionId,
	public readonly amount: number) {
		super(parentId, 'RessourcesArrivalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const containerDef = getContainerDef(this.containerType);
		// We assume that containers are well configured
		// and thus that there are no duplicates

		// actors are created right away (they need to appear in the timeline)
		containerDef.roles.forEach(r => {
			const evt = new AddActorLocalEvent(this.parentEventId, this.departureTime, r, this.travelTime);
			localEventManager.queueLocalEvent(evt);
		});

		// create resource arrival event
		// TODO forced actor binding if any ?? (typically if PMA leader comes with other guys ?)
		const evt = new ResourcesArrivalLocalEvent(this.parentEventId, this.departureTime + this.travelTime, this.containerType, this.amount);
		localEventManager.queueLocalEvent(evt);
	}

}
/**
 * Resources arrival on site
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {

	constructor(parentId: GlobalEventId,
	timeStamp: SimTime,
	public readonly containerType: ResourceContainerDefinitionId,
	public readonly amount: number) {
		super(parentId, 'RessourcesArrivalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		
		const containerDef = getContainerDef(this.containerType);
		// we assume there is always at least one actor
		const recipient : Actor = sortByHierarchyLevel(state.getAllActors())[0];
		const resourceGroup = getOrCreateResourceGroup(state, recipient.Uid);

		entries(containerDef.resources).filter(([_,qt]) => qt && qt > 0).forEach(([rType, qty]) =>  {
			const n = qty! * this.amount;
			ResourceState.addIncomingResourcesToActor(state, resourceGroup, rType, n);
		})
	}

}

/**
 * Local event to allocate resources to a task.
 */
export class ResourcesAllocationLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly actorId: ActorId,
    readonly resourceType: ResourceType,
    readonly nb: number) {
    super(parentEventId, 'ResourcesAllocationLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.allocateResourcesToTask(state, this.taskId, this.actorId, this.resourceType, this.nb);
  }

}

/**
 * Local event to release (deallocate) resources from a task.
 */
export class ResourcesReleaseLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly actorId: ActorId,
    readonly resourceType: ResourceType,
    readonly nb: number) {
    super(parentEventId, 'ResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.releaseResourcesFromTask(state, this.taskId, this.actorId, this.resourceType, this.nb);
  }

}

export class AllResourcesReleaseLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId) {
    super(parentEventId, 'AllResourcesReleaseLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    ResourceState.releaseAllResourcesFromTask(state, this.taskId);
  }

}

export class TaskStatusChangeLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly status: TaskStatus) {
      super(parentEventId, 'TaskStatusChangeLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    TaskState.changeTaskStatus(state, this.taskId, this.status);
  }

}

/**
 * Takes a player formulated request in parameter and resolves it given
 * the emergency center available resources
 */
export class ResourceRequestResolutionEvent extends LocalEventBase {

	constructor(
		parentEventId: GlobalEventId,
    	timeStamp: SimTime,
		private request: MethanePayload
	){
		super(parentEventId, 'ResourceRequestResolutionLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		resolveResourceRequest(this.parentEventId, this.request.resourceRequest, state);
	}

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// patients
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/*export class CategorizePatientLocalEvent extends LocalEventBase {
  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
	timeJump: Number) {
    super(parentEventId, 'CategorizePatientLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    PatientState.categorizeOnePatient(state, this.zone)
  }

}*/
