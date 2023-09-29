import { ActionTemplateId, ActorId, GlobalEventId, SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { MapFeature } from "../events/defineMapObjectEvent";
import { IClonable } from "../interfaces";
import { AddActorLocalEvent, AddMapItemLocalEvent, AddRadioMessageLocalEvent, IncomingResourcesLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ResourceType } from '../resources/resourceType';

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
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      this.logger.warn('This action was cancelled already');
    }else if(this.status === 'Completed'){
      this.logger.error('This action is completed, it cannot be cancelled');
      return false;
    }
    this.status = 'Cancelled';
    return true;
  }

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

  public constructor(startTimeSec: SimTime, durationSeconds: SimDuration, evtId: GlobalEventId,actionNameKey: TranslationKey, ownerId: ActorId, uuidTemplate: ActionTemplateId){
    super(startTimeSec, evtId, ownerId, uuidTemplate);
    this.durationSec = durationSeconds;
	  this.actionNameKey = actionNameKey
  }

  protected abstract dispatchInitEvents(state: MainSimulationState): void;
  protected abstract dispatchEndedEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {

    const simTime = state.getSimTime();
    switch(this.status){
      case 'Cancelled':
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

  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;

  constructor (
	  startTimeSec: SimTime,
	  durationSeconds: SimDuration,
	  messageKey: TranslationKey,
	  actionNameKey: TranslationKey,
	  evtId: GlobalEventId,
	  ownerId: ActorId,
	  uuidTemplate: ActionTemplateId
	  ){
    super(startTimeSec, durationSeconds, evtId, actionNameKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event GetInformationAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event GetInformationAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'ACS', this.messageKey))
  }

  override clone(): this {
    const clone = new GetInformationAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
  }

}

export class OnTheRoadgAction extends StartEndAction {

  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;

  constructor (
    startTimeSec: SimTime,
    durationSeconds: SimDuration,
    messageKey: TranslationKey,
    actionNameKey: TranslationKey,
    evtId: GlobalEventId,
    ownerId: ActorId,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, evtId, actionNameKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event OnTheRoadgAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event OnTheRoadgAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'ACS', this.messageKey))
  }

  override clone(): this {
    const clone = new OnTheRoadgAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
  }

}

export class MethaneAction extends StartEndAction {

  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;

  constructor (startTimeSec: SimTime, durationSeconds: SimDuration, messageKey: TranslationKey, actionNameKey: TranslationKey, evtId: GlobalEventId, ownerId: ActorId, uuidTemplate: ActionTemplateId){
    super(startTimeSec, durationSeconds, evtId, actionNameKey, ownerId, uuidTemplate);
    this.messageKey = messageKey;
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

  clone(): this {
    const clone = new MethaneAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId, this.templateId);
    clone.status = this.status;
    return clone as this;
  }
  
}

export class DefineMapObjectAction extends StartEndAction {

  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;
  /**
   * Map feature to be displayed
  */
  public readonly feature: MapFeature;

  constructor(
    startTimeSec: SimTime, 
    durationSeconds: SimDuration,
	  actionNameKey: TranslationKey,
    messageKey: TranslationKey, 
    evtId: GlobalEventId,
    ownerId: ActorId,
    feature: MapFeature,
    uuidTemplate: ActionTemplateId
  ) { 
      super(startTimeSec, durationSeconds, evtId, actionNameKey, ownerId, uuidTemplate);
      this.messageKey = messageKey;
      this.feature = feature;
	    this.feature.startTimeSec = this.startTime;
      this.feature.durationTimeSec = this.durationSec;
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

}

/**
 * Action to ask for more resources
 */
// FIXME see if needed to ask for several resources at same time
export class AskReinforcementAction extends StartEndAction {
  public readonly resourceType: ResourceType;
  public readonly nb: number;

  public readonly feedbackAtEnd: TranslationKey;

  constructor(startTimeSec: SimTime,
    durationSeconds: SimDuration,
    actionNameKey: TranslationKey,
    evtId: GlobalEventId,
    ownerId: ActorId,
    resourceType: ResourceType,
    nb: number,
    feedbackAtEnd: TranslationKey,
    uuidTemplate: ActionTemplateId
  ) {
    super(startTimeSec, durationSeconds, evtId, actionNameKey, ownerId, uuidTemplate);
    this.resourceType = resourceType;
    this.nb = nb;
    this.feedbackAtEnd = feedbackAtEnd;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('start event AskReinforcementAction');
    //likely nothing to do
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event AskReinforcementAction');
    localEventManager.queueLocalEvent(new IncomingResourcesLocalEvent(this.eventId, state.getSimTime(), this.ownerId, this.resourceType, this.nb));
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, state.getSimTime(), this.ownerId, 'CASU', this.feedbackAtEnd));
  }

  override clone(): this { 
    const clone = new AskReinforcementAction(this.startTime, this.durationSec, this.actionNameKey, this.eventId, this.ownerId, this.resourceType, this.nb, this.feedbackAtEnd, this.templateId);
    clone.status = this.status;
    return clone as this;
  }

}
