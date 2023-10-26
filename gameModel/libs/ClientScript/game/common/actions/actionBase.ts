import { ActionTemplateId, ActorId, GlobalEventId, SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
import { IClonable } from "../interfaces";
import {
	AddActorLocalEvent,
	AddMapItemLocalEvent,
	AddRadioMessageLocalEvent,
	IncomingResourcesLocalEvent,
	RemoveMapItemLocalEvent,
	ResourcesAllocationLocalEvent,
	TransferResourcesLocalEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceFunction, ResourceFunctionAndNumber } from '../resources/resourceFunction';

export type ActionStatus = 'Uninitialized' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined


/**
 * Instanciated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase implements IClonable{

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

  abstract clone(): this;

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

  public constructor(
    startTimeSec: SimTime, 
    durationSeconds: SimDuration, 
    eventId: GlobalEventId,
    actionNameKey: TranslationKey,
    messageKey: TranslationKey, 
    ownerId: ActorId, 
    uuidTemplate: ActionTemplateId
  ){
    super(startTimeSec, eventId, ownerId, uuidTemplate);
    this.durationSec = durationSeconds;
	  this.actionNameKey = actionNameKey;
    this.messageKey = messageKey;
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

  override clone(): this {
    const clone = new GetInformationAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
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

  override clone(): this {
    const clone = new OnTheRoadAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
  }

}

export class MethaneAction extends StartEndAction {

  constructor (
    startTimeSec: SimTime, 
    durationSeconds: SimDuration, 
    messageKey: TranslationKey, 
    actionNameKey: TranslationKey, 
    eventId: GlobalEventId, 
    ownerId: ActorId, 
    uuidTemplate: ActionTemplateId
  ){
    super(startTimeSec, durationSeconds, eventId, actionNameKey,messageKey, ownerId, uuidTemplate);
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    //likely nothing to do
    this.logger.info('start event MethaneAction');
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    this.logger.info('end event MethaneAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'AL', this.messageKey))
    localEventManager.queueLocalEvent(new AddActorLocalEvent(this.eventId, this.durationSec))
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  clone(): this {
    const clone = new MethaneAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
  }
  
}

export class DefineMapObjectAction extends StartEndAction {

  /**
   * Map feature to be displayed
  */
  public readonly feature: MapFeature;

  constructor(
    startTimeSec: SimTime, 
    durationSeconds: SimDuration,
	  actionNameKey: TranslationKey,
    messageKey: TranslationKey, 
    eventId: GlobalEventId,
    ownerId: ActorId,
    feature: MapFeature,
    uuidTemplate: ActionTemplateId
  ) { 
      super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
      this.feature = feature;
	  this.feature.startTimeSec = this.startTime;
      this.feature.durationTimeSec = this.durationSec;
  }


  protected dispatchInitEvents(state: MainSimulationState): void {
    // dispatch state changes that take place immediatly
    // TODO show grayed out map element
    localEventManager.queueLocalEvent(new AddMapItemLocalEvent(this.eventId, state.getSimTime(), this.feature));
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    // dispatch state changes that take place at the end of the action
    // ungrey the map element
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'AL', this.messageKey))
  }

  // TODO remove corresponding mapFeature
  protected cancelInternal(state: MainSimulationState): void {
	localEventManager.queueLocalEvent(new RemoveMapItemLocalEvent(this.eventId, state.getSimTime(), this.feature as MapFeature));
  }

  clone(): this {
    const clone = new DefineMapObjectAction(
        this.startTime,
        this.durationSec,
        this.actionNameKey,
        this.messageKey,
        this.eventId,
        this.ownerId,
        this.feature,
        this.templateId
    );
    clone.status = this.status;
    return clone as this;
    
  }
}

/**
 * Action to send resources to an actor
 */
export class SendResourcesToActorAction extends StartEndAction {
  public readonly messageKey: TranslationKey;

  public readonly receiverActor: ActorId;

  public readonly sentResources: ResourceTypeAndNumber[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    receiverActor: ActorId,
    sentResources: ResourceTypeAndNumber[]) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
    this.receiverActor = receiverActor;
    this.sentResources = sentResources;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event SendResourcesAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event SendResourcesAction');

    localEventManager.queueLocalEvent(new TransferResourcesLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.receiverActor, this.sentResources,
    ));

    const actionOwnerActor = state.getActorById(this.ownerId)!;

    this.logger.warn("params to send to message " + JSON.stringify(this.sentResources));

    // TODO see how we can send requested resources
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.receiverActor, actionOwnerActor.Role as unknown as TranslationKey, this.messageKey));
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  override clone(): this {
    const clone = new SendResourcesToActorAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId, this.receiverActor, this.sentResources);
    clone.status = this.status;
    return clone as this;
  }
}

/**
 * Action to assign a task to resources
 */
export class AssignTaskToResourcesAction extends StartEndAction {
  public readonly messageKey: TranslationKey;

  public readonly task: ResourceFunction;

  public readonly assignedResources: ResourceTypeAndNumber[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    task: ResourceFunction,
    assignedResources: ResourceTypeAndNumber[]) {
	super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
    this.task = task;
    this.assignedResources = assignedResources;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event AssignTaskToResourcesAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event AssignTaskToResourcesAction');
	this.logger.info('resourcestypeAndNumber:', this.assignedResources);
	this.logger.info('Task:', this.task);

	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'secouriste', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'secouriste')!.nb));
	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'technicienAmbulancier', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'technicienAmbulancier')!.nb));
	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'ambulancier', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'ambulancier')!.nb));
	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'infirmier', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'infirmier')!.nb));
	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'medecinJunior', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'medecinJunior')!.nb));
	localEventManager.queueLocalEvent(new ResourcesAllocationLocalEvent(this.eventId, state.getSimTime(), +this.task, this.ownerId, 'medecinSenior', this.assignedResources.find(resourceTypeAndNumber => resourceTypeAndNumber.type === 'medecinSenior')!.nb));

  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  override clone(): this {
    const clone = new AssignTaskToResourcesAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId, this.task, this.assignedResources);
    clone.status = this.status;
    return clone as this;
  }
}

/**
 * Action to assign a task to resources
 */
export class ReleaseResourcesFromTaskAction extends StartEndAction {
  public readonly messageKey: TranslationKey;

  public readonly task: ResourceFunction;

  public readonly releasedResources: ResourceTypeAndNumber[];

  constructor(
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    globalEventId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId,
    task: ResourceFunction,
    releasedResources: ResourceTypeAndNumber[]) {
    super(startTimeSec, durationSeconds, globalEventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
    this.task = task;
    this.releasedResources = releasedResources;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event FreeResourcesFromTaskAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event FreeResourcesFromTaskAction');

    // TODO
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  override clone(): this {
    const clone = new ReleaseResourcesFromTaskAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId, this.task, this.releasedResources);
    clone.status = this.status;
    return clone as this;
  }
}

/**
 * Action to ask for more resources
 */
// FIXME see if needed to ask for several resources at same time
export class AskReinforcementAction extends StartEndAction {
  public readonly resourceType: ResourceType;
  public readonly nb: number;


  constructor(startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    eventId: GlobalEventId,
    ownerId: ActorId,
    resourceType: ResourceType,
    nb: number,
    messageKey: TranslationKey,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, eventId, actionNameKey, messageKey, ownerId, uuidTemplate);
    this.resourceType = resourceType;
    this.nb = nb;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event AskReinforcementAction');
    //likely nothing to do
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event AskReinforcementAction');
    localEventManager.queueLocalEvent(new IncomingResourcesLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.resourceType, this.nb));
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'CASU', this.messageKey));
  }

  // TODO probably nothing
  protected cancelInternal(state: MainSimulationState): void {
    return;
  }

  override clone(): this {
    const clone = new AskReinforcementAction(this.startTime, this.durationSec, this.actionNameKey, this.eventId, this.ownerId, this.resourceType, this.nb, this.messageKey, this.templateId);
    clone.status = this.status;
    return clone as this;
  }

}
