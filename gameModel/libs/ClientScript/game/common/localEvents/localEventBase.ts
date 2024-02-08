import { getTranslation } from "../../../tools/translation";
import { getEnv } from "../../../tools/WegasHelper";
import { ActionBase, OnTheRoadAction } from "../actions/actionBase";
import { Actor, InterventionRole, sortByHierarchyLevel } from "../actors/actor";
import { ActorId, GlobalEventId, SimDuration, SimTime, TaskId, TemplateId, TranslationKey } from "../baseTypes";
import { computeNewPatientsState } from "../patients/handleState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { changePatientPosition, PatientState } from "../simulationState/patientState";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";
import { TaskStatus } from "../tasks/taskBase";
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceContainerDefinitionId } from "../resources/resourceContainer";
import { getContainerDef, resolveResourceRequest } from "../resources/emergencyDepartment";
import { getOrCreateResourceGroup, ResourceGroup } from "../resources/resourceGroup";
import { localEventManager } from "../localEvents/localEventManager";
import { entries } from "../../../tools/helper";
import { CasuMessagePayload } from "../events/casuMessageEvent";
import { resourceLogger } from "../../../tools/logger";
import { LOCATION_ENUM } from "../simulationState/locationState";
import { ActionType } from "../actionType";
import { BuildingStatus, FixedMapEntity } from "../events/defineMapObjectEvent";
import { SimFlag } from "../actions/actionTemplateBase";

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
 * @returns true if e1 precedes e2, ordering by timestamps (trigger time) 
 * if equal creation order (eventCounter) is used instead
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
    const now = state.getSimTime();
    const action = so.actions.find(a => a.getTemplateId() === this.templateId && a.ownerId === this.actorUid && a.startTime == now);

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

export class ProvideFlagsToState extends LocalEventBase {

   constructor(parentEventId: GlobalEventId, timeStamp: SimTime, private provideFlagsToState: SimFlag[]){
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
	this.provideFlagsToState.map(flag => so.flags[flag] = true);
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

  updatePatients(patients: Readonly<PatientState[]>, timeJump: number) {
    computeNewPatientsState(patients as PatientState[], timeJump, getEnv());
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

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly fixedMapEntity: FixedMapEntity){
    super(parentEventId, 'AddMapItemLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.mapLocations.push(this.fixedMapEntity);
  }

}

export class RemoveMapItemLocalEvent extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly fixedMapEntity: FixedMapEntity) {
		super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const so = state.getInternalStateObject();
		so.mapLocations.splice(so.mapLocations.findIndex(f => f.name === this.fixedMapEntity.name && f.ownerId === this.fixedMapEntity.ownerId), 1);
	}
}

export class CompleteBuildingMapItemLocalEvent extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, readonly fixedMapEntity: FixedMapEntity) {
		super(parentEventId, 'RemoveMapItemLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const so = state.getInternalStateObject();
		so.mapLocations.filter(mapEntity => mapEntity.id === this.fixedMapEntity.id).map(mapEntity => mapEntity.buildingStatus = BuildingStatus.ready);
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

	const now = state.getSimTime();
	const travelAction = new OnTheRoadAction(now, this.travelTime, 'actor-arrival', 'on-the-road', 0, actor.Uid, 0);
	state.getInternalStateObject().actions.push(travelAction);

	// the resource pool creation/assignation is delayed to the arrival time of the actor
	localEventManager.queueLocalEvent(new ResourceGroupBinding(this.parentEventId, now + this.travelTime, actor.Uid));
  }

}

/**
 * Binds an actor to its resource group
 */
export class ResourceGroupBinding extends LocalEventBase {

	constructor(parentEventId: GlobalEventId, timeStamp: SimTime, private ownerId: ActorId){
		super(parentEventId, 'ResourceGroupBinding', timeStamp);
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

  private static UidSeed = 1;

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId, 
    public readonly emitter: TranslationKey,
    public readonly message: TranslationKey,
    public readonly channel: ActionType | undefined = undefined,
    public readonly isRadioMessage: boolean = false,
    private readonly omitTranslation: boolean = false)
  {
      super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
	
    const msg = this.omitTranslation ? this.message 
      : getTranslation('mainSim-actions-tasks', this.message);

    state.getInternalStateObject().radioMessages.push({
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp,
      emitter: this.emitter,
      message: msg,
      uid : AddRadioMessageLocalEvent.UidSeed++,
      isRadioMessage: this.isRadioMessage,
      channel: this.channel
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

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// EMERGENCY DEPARTMENT
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Takes a player formulated request and resolves it given
 * the emergency center's available resources
 */
export class ResourceRequestResolutionLocalEvent extends LocalEventBase {

	constructor(
		parentEventId: GlobalEventId,
    timeStamp: SimTime,
		private actorUid: ActorId,
		private request: CasuMessagePayload
	){
		super(parentEventId, 'ResourceRequestResolutionLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		if(this.request.resourceRequest){
			resolveResourceRequest(this.parentEventId, this.request.resourceRequest, this.actorUid, state);
		}
	}

}

/**
 * Spawned when the emergency dept sends resource containers
 */
export class ResourceMobilizationEvent extends LocalEventBase {

	constructor(parentId: GlobalEventId,
	timeStamp: SimTime,
	public readonly actorId: ActorId,
	public readonly departureTime: SimTime,
	public readonly travelTime: SimDuration,
	public readonly containerDef: ResourceContainerDefinitionId,
	public readonly amount: number,
	public readonly configName: string) {
		super(parentId, 'ResourceMobilizationEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		const containerDef = getContainerDef(this.containerDef);
		// We assume that containers are well configured
		// and thus that there are no duplicates

		// actors are created right away (they need to appear in the timeline)
		// Note : Actor creation ignores the "amount" value
		containerDef.roles.forEach(role => {
			const evt = new AddActorLocalEvent(this.parentEventId, this.departureTime, role, this.travelTime);
			localEventManager.queueLocalEvent(evt);
		});

		// schedule messages when the emergency center has new ressources that are sent
		const dptEvt = new ResourcesDepartureLocalEvent(this.parentEventId, this.departureTime, this.actorId, this.containerDef, this.travelTime, this.amount, this.configName);
		localEventManager.queueLocalEvent(dptEvt);

		if(Object.keys(containerDef.resources).length > 0 || Object.keys(containerDef.flags).length > 0){
			// schedule resource arrival event
			// TODO forced actor binding if any ?? (typically if PMA leader comes with other guys ?)
			const evt = new ResourcesArrivalLocalEvent(this.parentEventId, this.departureTime + this.travelTime, this.containerDef, this.amount);
			localEventManager.queueLocalEvent(evt);
		}

	}

}


/**
 * Spawned when the emergeny center has a resource available and sends it to the incident site
 */
export class ResourcesDepartureLocalEvent extends LocalEventBase {
	
	constructor(
	parentId: GlobalEventId,
	timeStamp: SimTime,
	public readonly senderId: ActorId,
	public readonly containerDef: ResourceContainerDefinitionId,
	public readonly travelTime: SimDuration,
	public readonly amount: number,
	public readonly configName: string
	) {
		super(parentId, 'ResourcesDepartureLocalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {
		
		const t = Math.round(this.travelTime / 60);
		const msg = this.buildRadioText(t);
		const evt = new AddRadioMessageLocalEvent(this.parentEventId, this.simTimeStamp, this.senderId, 'CASU', msg, ActionType.CASU_RADIO,true, true);
		localEventManager.queueLocalEvent(evt);
	}

	private buildRadioText(time: number): string {
		const c = getContainerDef(this.containerDef);
		const parts : string []= [];
		parts.push(getTranslation('mainSim-resources', 'sending'));
		//parts.push(this.amount + '');
		parts.push(this.configName);// Specific name (e.g. AMB002)
		parts.push('(' + getTranslation('mainSim-resources', c.name) + ')');// type
		parts.push(getTranslation('mainSim-resources', 'arrival-in', false));
		parts.push(time + '');
		parts.push(getTranslation('mainSim-resources', 'minutes', false));
		return parts.join(' ');
	}

}

/**
 * Resources arrival on site
 * Resources are assigned to the highest hierarchy level present by default
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {

	constructor(parentId: GlobalEventId,
	timeStamp: SimTime,
	public readonly containerDef: ResourceContainerDefinitionId,
	public readonly amount: number) {
		super(parentId, 'RessourcesArrivalEvent', timeStamp);
	}

	applyStateUpdate(state: MainSimulationState): void {

		const containerDef = getContainerDef(this.containerDef);
		// add flags to state if any
		if(containerDef.flags){
			containerDef.flags.forEach(f => state.getInternalStateObject().flags[f] = true);
		}
		const actors = sortByHierarchyLevel(state.getAllActors());
		// find highest hierarchy group
		let resourceGroup : ResourceGroup | undefined = undefined;
		if(actors.length === 1){ // AL case create group if not existant
			resourceGroup = getOrCreateResourceGroup(state, actors[0].Uid);
		}else {
			// multiple actors present but some might be traveling
			resourceGroup = actors.map(a => state.getResourceGroupByActorId(a.Uid)).find(rg => rg !== undefined);
			if(!resourceGroup){
				resourceLogger.error('No valid resource group found in existing actor list', actors);
			}
		}
		entries(containerDef.resources).filter(([_,qt]) => qt && qt > 0).forEach(([rType, qty]) =>  {
			const n = qty! * this.amount;
			ResourceState.addIncomingResourcesToActor(state, resourceGroup!, rType, n);
		})
	}

}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// RESOURCE ASSIGNATION
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------


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

export class PatientMovedLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId,
    timeStamp: SimTime,
    readonly taskId: TaskId,
    readonly patientId: string,
	readonly location: LOCATION_ENUM) {
      super(parentEventId, 'PatientMovedLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    changePatientPosition(state, this.patientId, this.location);
  }

}
