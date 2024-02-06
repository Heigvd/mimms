import { ActionTemplateId, ActorId, SimDuration, SimTime, TemplateRef, TranslationKey } from "../baseTypes";
import { initBaseEvent } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import {
  ActionCreationEvent,
  ResourceSendingToActorEvent,
  ResourceTaskAssignmentEvent,
  ResourceTaskReleaseEvent,
  StandardActionEvent,
} from '../events/eventTypes';
import { MainSimulationState } from "../simulationState/mainSimulationState";
import {
  ActionBase,
  CasuMessageAction,
  GetInformationAction,
  SendResourcesToActorAction, AssignTaskToResourcesAction, ReleaseResourcesFromTaskAction, SendRadioMessageAction, SelectionFixedMapEntityAction,
} from './actionBase';
import { SelectionFixedMapEntityEvent, FixedMapEntity, createFixedMapEntityInstanceFromAnyObject } from "../events/defineMapObjectEvent";
import { PlanActionLocalEvent } from "../localEvents/localEventBase";
import { Actor } from "../actors/actor";
import { getTranslation } from "../../../tools/translation";
import { ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceFunction } from '../resources/resourceFunction';
import { SimFlag } from "../resources/resourceContainer";
import { CasuMessageActionEvent, CasuMessagePayload } from "../events/casuMessageEvent";
import { RadioMessageActionEvent, RadioMessagePayload } from "../events/radioMessageEvent";
import { ActionType } from "../actionType";

/**
 * This class is the descriptor of an action, it represents the data of a playable action
 * It is meant to contain the generic information of an action as well as the conditions for this action to available
 * It is an action generator
 */
export abstract class ActionTemplateBase<ActionT extends ActionBase = ActionBase, EventT extends ActionCreationEvent = ActionCreationEvent, UserInput= unknown> {

  private static IdSeed = 1000;

  public readonly Uid: ActionTemplateId;

  /**
   * @param title action display title translation key
   * @param description short description of the action
   * @param replayable defaults to false, when true the action can be played multiple times
   * @param flags list of simulation flags that make the action available, undefined or empty array means no flag condition
   */
  public constructor(
	protected readonly title: TranslationKey, 
	protected readonly description: TranslationKey, 
	public replayable: boolean = false,
	private flags: SimFlag[]=[],
  protected readonly category: ActionType = ActionType.ACTION)
  {
	this.Uid = ActionTemplateBase.IdSeed++;
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
  }

  /**
   * a deterministic unique identifier for this template
   */
  public abstract getTemplateRef(): TemplateRef;

  /**
   * Build an instance from an incoming global event
   */
  protected abstract createActionFromEvent(event: FullEvent<EventT>): ActionT;

  /**
   * Generate an event to be broadcasted
   * @param timeStamp current time
   * @param initiator the actor that initiates this action and will be its owner
   */
  public abstract buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, params: UserInput): EventT;

  /**
   * Determines if the action can be launched given the current state of the game and the actor being played
   * To add more conditions, override the isAvailableCustom custom function
   * @param state the current game state
   * @param actor currently selected actor
   * @see isAvailableCustom function
   * @returns true if the player can trigger this action
   */
  public isAvailable(state : Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean
  {
    return this.flagWiseAvailable(state) && this.canPlayAgain(state) && this.isAvailableCustom(state, actor);
  }

  /**
   * Override adds additional conditions for this template action availability
   * @param state 
   * @param actor 
   * @see isAvailable
   */
  protected abstract isAvailableCustom(state : Readonly<MainSimulationState>, actor : Readonly<Actor>) : boolean;

  public isInCategory(category: ActionType) : boolean {
    return category === this.category;
  }

  protected flagWiseAvailable(state: Readonly<MainSimulationState>): boolean {
    if(!this.flags || this.flags.length == 0)
    {
      return true;
    }

    return this.flags.some(f => state.hasFlag(f));
  }

  /**
   * @returns A translation to a short description of the action
   */
  public abstract getDescription(): TranslationKey;
  /**
   * @returns A translation to the title of the action
   */
  public abstract getTitle(): TranslationKey;

  protected initBaseEvent(timeStamp: SimTime, actorId: ActorId) : ActionCreationEvent {
    return {
      ...initBaseEvent(actorId),
      type: 'ActionCreationEvent',
      templateRef: this.getTemplateRef(),
      triggerTime : timeStamp,
    }
  }

  /**
   * Generate a local event to create an action from a broadcasted global event
   * @param globalEvent the broadcasted event
   */
  public buildLocalEvent(globalEvent: FullEvent<EventT>): PlanActionLocalEvent {
    const action = this.createActionFromEvent(globalEvent);
    return new PlanActionLocalEvent(globalEvent.id, globalEvent.payload.triggerTime, action);
  }

  /**
   * If replayable returns true, else returns true if the action has not yet been planned and started
   */
  protected canPlayAgain(state: Readonly<MainSimulationState>): boolean {
    if(this.replayable){
      return true;
    }

    const action = state.getInternalStateObject().actions.find((action) => action.getTemplateId() === this.Uid);
    //either action has not been played or it is planned but can still be cancelled
    return action == undefined || action.startTime === state.getSimTime();
  }

  /**
   * @return true if the action should be created in the timeline right away, 
   * false if some other interaction should take place in between
   */
  public abstract planActionEventOnFirstClick(): boolean;

}

export abstract class StartEndTemplate<ActionT extends ActionBase = ActionBase, EventT extends ActionCreationEvent = ActionCreationEvent, UserInput= unknown> extends ActionTemplateBase<ActionT, EventT, UserInput> {

  public readonly duration: SimDuration;
  public readonly message: TranslationKey;

  constructor(title: TranslationKey, description: TranslationKey,
     duration: SimDuration,  message: TranslationKey, replayable = false, flags: SimFlag[]=[], category: ActionType = ActionType.ACTION) {
    super(title, description, replayable, flags, category);
    this.duration = duration;
    this.message = message;
  }

  /** Default implementation : no custom conditions */
  protected override isAvailableCustom(state : Readonly<MainSimulationState>, actor : Readonly<Actor>) : boolean{
    return true;
  }

}

export class GetInformationTemplate extends StartEndTemplate {

  constructor(title: TranslationKey, description: TranslationKey, 
    duration: SimDuration, message: TranslationKey,
	replayable = false, flags: SimFlag[]=[]) {
    super(title, description, duration, message, replayable, flags);
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): GetInformationAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new GetInformationAction(payload.triggerTime, this.duration, this.message, this.title , event.id, ownerId, this.Uid);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>) : StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public getTemplateRef(): TemplateRef {
    return 'GetInformationTemplate' + '_' + this.title;
  }

  public getDescription(): string {
	return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}

export class CasuMessageTemplate extends StartEndTemplate<CasuMessageAction, CasuMessageActionEvent, CasuMessagePayload> {

  constructor(title: TranslationKey, description: TranslationKey, 
    duration: SimDuration, message: TranslationKey) {
    super(title, description, duration, message, true, [], ActionType.CASU_RADIO);
  }

  public getTemplateRef(): TemplateRef {
    return 'DefineCasuMessageObjectTemplate' + '_' + this.title;
  }
  
  protected createActionFromEvent(event: FullEvent<CasuMessageActionEvent>): CasuMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new CasuMessageAction(payload.triggerTime, this.duration, this.message, 
		this.title , event.id, ownerId, this.Uid, payload.casuMessagePayload);
  }

  public buildGlobalEvent(timeStamp: number, initiator: Readonly<Actor>, params: CasuMessagePayload): CasuMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
      casuMessagePayload : params
    }
  }
  
  public getDescription(): string {
	return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public planActionEventOnFirstClick(): boolean {
    return false;
  }

}

export class SelectionFixedMapEntityTemplate extends StartEndTemplate<SelectionFixedMapEntityAction, SelectionFixedMapEntityEvent> {
  
  public readonly fixedMapEntity: FixedMapEntity;

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
	fixedMapEntity: FixedMapEntity,
	replayable = false, flags: SimFlag[]=[]
  ) {
    super(title, description, duration, message, replayable, flags);
	this.fixedMapEntity = fixedMapEntity;
  }

  public buildGlobalEvent(timeStamp: number, initiator: Readonly<Actor>, payload: FixedMapEntity): SelectionFixedMapEntityEvent {

	//???? payload??
	//Is there a way to keep the original instance class?
	return {
		...this.initBaseEvent(timeStamp, initiator.Uid),
		durationSec: this.duration,
		fixedMapEntity: payload,
	}
	
  }

  public getTemplateRef(): string {
      return 'SelectionFixedMapEntityTemplate' + '_' + this.title;
  }

  protected createActionFromEvent(event: FullEvent<SelectionFixedMapEntityEvent >): SelectionFixedMapEntityAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

  	return new SelectionFixedMapEntityAction(payload.triggerTime, this.duration, this.title, this.message, event.id, ownerId, createFixedMapEntityInstanceFromAnyObject(payload.fixedMapEntity), this.Uid);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description)

  }

  public getTitle(): string {
      return getTranslation('mainSim-actions-tasks', this.title)
  }

  public planActionEventOnFirstClick(): boolean {
      return false;
  }
}

export type SendResourcesToActorActionInput = { receiverActor: ActorId, sentResources: ResourceTypeAndNumber };

/**
 * Action template to create an action to send resources to an actor
 * XGO 25.01.2024 : Has to be replaced by SendToPosition(symbolic position)
 */
export class SendResourcesToActorActionTemplate extends StartEndTemplate<SendResourcesToActorAction, ResourceSendingToActorEvent, SendResourcesToActorActionInput> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
	replayable = true, flags: SimFlag[]=[]
  ) {
    super(title, description, duration, message, replayable, flags);
  }

  public getTemplateRef(): TemplateRef {
    return 'SendResourcesToActorActionTemplate' + '_' + this.title;
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  // XGO 25.01.2024 : Will be availble if more than a single symbolic position is available
  public override isAvailableCustom(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return state.getInternalStateObject().resourceGroups.length > 1;
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, params: SendResourcesToActorActionInput): ResourceSendingToActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      receiverActor: params.receiverActor,
      sentResources: params.sentResources,
    };
  }

  protected createActionFromEvent(event: FullEvent<ResourceSendingToActorEvent>): SendResourcesToActorAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new SendResourcesToActorAction(payload.triggerTime, this.duration, this.message, this.title, event.id, ownerId,
      this.Uid, event.payload.receiverActor, event.payload.sentResources);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}

export type AssignTaskToResourcesActionInput = { task: ResourceFunction, assignedResources: ResourceTypeAndNumber };

/**
 * Action template to create an action to assign a function/task to ressources
 */
export class AssignTaskToResourcesActionTemplate extends StartEndTemplate<AssignTaskToResourcesAction, ResourceTaskAssignmentEvent, AssignTaskToResourcesActionInput> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
	replayable = true, flags: SimFlag[]=[]
  ) {
    super(title, description, duration, message, replayable, flags);
  }

  public getTemplateRef(): TemplateRef {
    return 'AssignTaskToResourcesActionTemplate' + '_' + this.title;
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, params: AssignTaskToResourcesActionInput): ResourceTaskAssignmentEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      task: params.task,
      assignedResources: params.assignedResources,
    };
  }

  protected createActionFromEvent(event: FullEvent<ResourceTaskAssignmentEvent>): AssignTaskToResourcesAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new AssignTaskToResourcesAction(payload.triggerTime, this.duration, this.message, this.title, event.id, ownerId,
      this.Uid, event.payload.task, event.payload.assignedResources);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}

export type ReleaseResourcesFromTaskActionInput = { task: ResourceFunction, releasedResources: ResourceTypeAndNumber };

/**
 * Action template to create an action to request resources from an actor
 */
export class ReleaseResourcesFromTaskActionTemplate extends StartEndTemplate<ReleaseResourcesFromTaskAction, ResourceTaskReleaseEvent, ReleaseResourcesFromTaskActionInput> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    message: TranslationKey,
	replayable = true, flags: SimFlag[]=[]
  ) {
    super(title, description, duration, message, replayable, flags, ActionType.RESOURCES_RADIO);
  }

  public getTemplateRef(): TemplateRef {
    return 'ReleaseResourcesFromTaskActionTemplate' + '_' + this.title;
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, params: ReleaseResourcesFromTaskActionInput): ResourceTaskReleaseEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      task: params.task,
      releasedResources: params.releasedResources,
    };
  }

  protected createActionFromEvent(event: FullEvent<ResourceTaskReleaseEvent>): ReleaseResourcesFromTaskAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new ReleaseResourcesFromTaskAction(payload.triggerTime, this.duration, this.message, this.title, event.id, ownerId,
      this.Uid, event.payload.task, event.payload.releasedResources);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}

export class SendRadioMessage extends StartEndTemplate {

  constructor(title: TranslationKey, description: TranslationKey, 
    duration: SimDuration, message: TranslationKey,
	replayable = true, flags: SimFlag[]=[]) {
    super(title, description, duration, message, replayable, flags, ActionType.ACTORS_RADIO);
  }

  protected createActionFromEvent(event: FullEvent<RadioMessageActionEvent>): SendRadioMessageAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new SendRadioMessageAction(payload.triggerTime, this.duration, this.message, 
		this.title , event.id, ownerId, this.Uid, payload.radioMessagePayload);
  }

  public buildGlobalEvent(timeStamp: number, initiator: Readonly<Actor>, params: RadioMessagePayload): RadioMessageActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
      radioMessagePayload : params
    }
  }


  public getTemplateRef(): TemplateRef {
    return 'SendRadioMessageTemplate' + '_' + this.title;
  }

  public getDescription(): string {
	return'SendRadioMessageTemplateDescription';
  }

  public getTitle(): string {
    return 'SendRadioMessageTemplateTitle';
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}
