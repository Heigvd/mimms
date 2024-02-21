import { ActionTemplateId, ActorId, GlobalEventId, SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { BuildingStatus, FixedMapEntity} from "../events/defineMapObjectEvent";
import {
  AddRadioMessageLocalEvent,
  AddFixedEntityLocalEvent,
  RemoveFixedEntityLocalEvent,
  CompleteBuildingFixedEntityLocalEvent,
  ResourceRequestResolutionLocalEvent,
  ResourcesAllocationLocalEvent,
  ResourcesReleaseLocalEvent,
  MoveActorLocalEvent,
  TransferResourcesToLocationLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ResourceTypeAndNumber, ResourcesArray } from '../resources/resourceType';
import { ResourceFunction } from '../resources/resourceFunction';
import { CasuMessagePayload } from "../events/casuMessageEvent";
import { RadioMessagePayload } from "../events/radioMessageEvent";
import { entries } from "../../../tools/helper";
import { ActionType } from "../actionType";
import { SimFlag } from "./actionTemplateBase";
import { LOCATION_ENUM } from "../simulationState/locationState";

export type ActionStatus = 'Uninitialized' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined


/**
 * Instanciated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase {

  protected static slogger = Helpers.getLogger("actions-logger");

  protected readonly logger = ActionBase.slogger;

  protected status : ActionStatus;

  protected readonly templateId;

  public constructor(
    readonly startTime : SimTime,
    protected readonly eventId: GlobalEventId,
    public readonly ownerId: ActorId,
    protected readonly uuidTemplate: ActionTemplateId = -1)
  {
    this.status = 'Uninitialized';
    this.templateId = uuidTemplate;
  }

  /**
   * Will update the given status
   * @param state the current state that will be updated
   * @param simTime
   */
  public abstract update(state: Readonly<MainSimulationState>): void;

  public abstract duration(): SimDuration;

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  public cancel(state: MainSimulationState): boolean {
    if(this.status === "Cancelled") {
      this.logger.warn('This action was already cancelled');
    }else if(this.status === 'Completed'){
      this.logger.error('This action is completed, it cannot be cancelled');
      return false;
    }
    this.status = 'Cancelled';
    this.cancelInternal(state);

    return true;
  }

  protected abstract cancelInternal(state: MainSimulationState): void;

  public getStatus(): ActionStatus {
    return this.status;
  }

  public getTemplateId(): ActionTemplateId {
    return this.templateId;
  }
}


/**
 * An action that has a fixed duration and only start and finish effects
 */
export abstract class StartEndAction extends ActionBase {

  protected readonly durationSec;
  /**
   * Translation key for the name of the action (displayed in the timeline)
   */
  public readonly actionNameKey: TranslationKey;
  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;
  /**
   * Adds SimFlags values to state at the end of the action
   */
  public provideFlagsToState: SimFlag[];

  public constructor(
    startTimeSec: SimTime, 
    durationSeconds: SimDuration, 
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey, 
    ownerId: ActorId, 
    uuidTemplate: ActionTemplateId,
	provideFlagsToState: SimFlag[] = []
  ){
    super(startTimeSec, eventId, ownerId, uuidTemplate);
    this.durationSec = durationSeconds;
    this.actionNameKey = actionNameKey;
    this.messageKey = messageKey;
	this.provideFlagsToState = provideFlagsToState;
  }

  protected abstract dispatchInitEvents(state: MainSimulationState): void;
  protected abstract dispatchEndedEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {

    const simTime = state.getSimTime();
    switch(this.status){
      case 'Cancelled': // should action do something ?
      case 'Completed':

        return;
      case 'Uninitialized': {
        if(simTime >= this.startTime){ // if action did start
          this.logger.debug('dispatching start events...');
          this.dispatchInitEvents(state);
          this.status = "OnGoing";
        }
      }
      break;
      case 'OnGoing': { 
        if(simTime >= this.startTime + this.duration()){ // if action did end
          this.logger.debug('dispatching end events...');
		  // update flags in state as provided when action completes
		  this.provideFlagsToState.map(flag => state.getInternalStateObject().flags[flag] = true);
		  //execute dispatched events
          this.dispatchEndedEvents(state);
          this.status = "Completed";
        }
      }
      break;
      default:
        this.logger.error('Undefined status cannot update action')
    }

  }

  public duration(): number {
    return this.durationSec;
  }

  public getTitle(): string {
	return this.actionNameKey;
  }

}

export class GetInformationAction extends StartEndAction {

  constructor (
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId
    ){
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event GetInformationAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event GetInformationAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'ACS', this.messageKey))
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
      return;
  }

}

export class OnTheRoadAction extends StartEndAction {

  constructor (
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event OnTheRoadAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event OnTheRoadAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'ACS', this.messageKey))
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

}

export class CasuMessageAction extends StartEndAction {

  constructor (
    startTimeSec: SimTime, 
    durationSeconds: SimDuration, 
    messageKey: TranslationKey, 
    actionNameKey: TranslationKey, 
    eventId: GlobalEventId, 
    ownerId: ActorId, 
    uuidTemplate: ActionTemplateId,
	private casuMessagePayload: CasuMessagePayload
  ){
    super(startTimeSec, durationSeconds, eventId, actionNameKey,messageKey, ownerId, uuidTemplate);
  }

  private computeCasuMessage(message: CasuMessagePayload): string {
    let casuMessage = '';
    if (message.major) {
      casuMessage += `M - ${message.major} \n`;
    }
    if (message.exact) {
      casuMessage += `E - ${message.exact} \n`;
    }
    if (message.incidentType) {
      casuMessage += `T - ${message.incidentType} \n`;
    }
    if (message.hazards) {
      casuMessage += `H - ${message.hazards} \n`;
    }
    if (message.access) {
      casuMessage += `A - ${message.access} \n`;
    }
    if (message.victims) {
      casuMessage += `N - ${message.victims} \n`;
    }
    if (message.resourceRequest) {
      let requestResource = 'E - ';
      entries(message.resourceRequest).filter(([_,a]) => a > 0).forEach(([typeId, requestedAmount]) => {
        requestResource += `${typeId}: ${requestedAmount} \n`;
      })
      casuMessage += requestResource;
    }

    return casuMessage;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    //likely nothing to do
    this.logger.info('start event CasuMessageAction');
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event CasuMessageAction');
	const now = state.getSimTime();
	// TODO filter when we get a full METHANE message
	localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, state.getActorById(this.ownerId)?.FullName || '', this.computeCasuMessage(this.casuMessagePayload), ActionType.CASU_RADIO, true, true));
	if(this.casuMessagePayload.resourceRequest){
		const dispatchEvent = new ResourceRequestResolutionLocalEvent(this.eventId, now, state.getAllActors().find(actor => actor.Role == 'CASU')?.Uid || this.ownerId, this.casuMessagePayload);
		localEventManager.queueLocalEvent(dispatchEvent);
	}
  }

  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  public override getTitle(): string {
    return this.actionNameKey + '-' + this.casuMessagePayload.messageType;
  }
  
}

/**
 * Action to select a FixedMapEntity
 */
export class SelectionFixedMapEntityAction extends StartEndAction {

  public readonly fixedMapEntity: FixedMapEntity;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
	fixedMapEntity: FixedMapEntity,
    uuidTemplate: ActionTemplateId,
	provideFlagsToState: SimFlag[] = []
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate, provideFlagsToState);
    this.fixedMapEntity = fixedMapEntity;
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
	this.fixedMapEntity.buildingStatus = BuildingStatus.inProgress;
    localEventManager.queueLocalEvent(new AddFixedEntityLocalEvent(this.eventId, state.getSimTime(), this.fixedMapEntity));
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    // ungrey the map element
	localEventManager.queueLocalEvent(new CompleteBuildingFixedEntityLocalEvent(this.eventId, state.getSimTime(), this.fixedMapEntity));
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'AL', this.messageKey))
  }

  protected cancelInternal(state: MainSimulationState): void {
    localEventManager.queueLocalEvent(new RemoveFixedEntityLocalEvent(this.eventId, state.getSimTime(), this.fixedMapEntity));
  }

}

/**
 * Action to move actor from one location to another
 */
export class MoveActorAction extends StartEndAction {

	public readonly location: LOCATION_ENUM;

	constructor(
		startTimeSec: SimTime,
		durationSeconds: SimDuration,
		actionNameKey: TranslationKey,
		messageKey: TranslationKey,
		eventId: GlobalEventId,
		ownerId: ActorId,
		uuidTemplate: ActionTemplateId,
		provideFlagsToState: SimFlag[] = [],
		location: LOCATION_ENUM,
	) {
		super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate, provideFlagsToState);
		this.location = location;
	}

	protected dispatchInitEvents(state: MainSimulationState): void {
	}

	protected dispatchEndedEvents(state: MainSimulationState): void {
		localEventManager.queueLocalEvent(new MoveActorLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.location));
	}

	protected cancelInternal(state: MainSimulationState): void {
		return;
	}
}

///
/**
 * Action to send resources to a location
 */
export class SendResourcesToLocationAction extends StartEndAction {

  public readonly sourceLocation: LOCATION_ENUM;
  public readonly destinationLocation: LOCATION_ENUM;

  public readonly sentResources: ResourceTypeAndNumber;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
	sourceLocation: LOCATION_ENUM,
    destinationLocation: LOCATION_ENUM,
    sentResources: ResourceTypeAndNumber) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
	this.sourceLocation = sourceLocation;
    this.destinationLocation = destinationLocation;
    this.sentResources = sentResources;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event SendResourcesToLocationAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event SendResourcesToLocationAction');

    localEventManager.queueLocalEvent(new TransferResourcesToLocationLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.sourceLocation, this.destinationLocation, this.sentResources));

    const actionOwnerActor = state.getActorById(this.ownerId)!;

    this.logger.warn("params to send to message " + JSON.stringify(this.sentResources));

    // TODO see how we can send requested resources
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, actionOwnerActor.Role as unknown as TranslationKey, this.messageKey));
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

}
///


/**
 * Action to assign a task to resources
 */
export class AssignTaskToResourcesAction extends StartEndAction {

  public readonly task: ResourceFunction;
  public readonly sourceLocation: LOCATION_ENUM;
  public readonly assignedResources: ResourceTypeAndNumber;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    task: ResourceFunction,
	sourceLocation: LOCATION_ENUM,
    assignedResources: ResourceTypeAndNumber) 
  {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.task = task;
	this.sourceLocation = sourceLocation;
    this.assignedResources = assignedResources;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event AssignTaskToResourcesAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event AssignTaskToResourcesAction');
    this.logger.info('resourcestypeAndNumber:', this.assignedResources);
    this.logger.info('Task:', this.task);

    // TODO one single event with all the changes at once
    ResourcesArray.forEach((res) => {
      const nbRes = this.assignedResources[res] || 0;
      if(nbRes > 0){
        localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, this.sourceLocation, res, nbRes));
      }
    })
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

}

/**
 * Action to assign a task to resources
 */
export class ReleaseResourcesFromTaskAction extends StartEndAction {

  public readonly task: ResourceFunction;

  public readonly releasedResources: ResourceTypeAndNumber;

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    task: ResourceFunction,
    releasedResources: ResourceTypeAndNumber) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.task = task;
    this.releasedResources = releasedResources;
  }

	protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
		this.logger.info('start event ReleaseResourcesFromTaskAction');
	}

	protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
		this.logger.info('end event ReleaseResourcesFromTaskAction');
		this.logger.info('resourcesTypeAndNumber:', this.releasedResources);
		this.logger.info('Task:', this.task);

		// TODO one single event with all the changes at once
		ResourcesArray.forEach(res => {
			const nbRes = this.releasedResources[res] || 0;
			if (nbRes > 0) {
				localEventManager.queueLocalEvent(
					new ResourcesReleaseLocalEvent(
						this.eventId,
						state.getSimTime(),
						+this.task,
						this.ownerId,
						res,
						nbRes,
					),
				);
			}
		});
	}

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

}

export class SendRadioMessageAction extends StartEndAction {

  constructor (
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    private radioMessagePayload: RadioMessagePayload
    )
  {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event SendRadioMessageAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event SendRadioMessageAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.radioMessagePayload.actorId, state.getActorById(this.radioMessagePayload.actorId)?.FullName || '', this.radioMessagePayload.message, this.radioMessagePayload.channel, true, true));
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

}
