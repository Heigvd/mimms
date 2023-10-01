import { ActionTemplateId, ActorId, SimDuration, SimTime, TemplateRef, TranslationKey } from "../baseTypes";
import { initBaseEvent } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import {
  ActionCreationEvent,
  ResourceRequestFromActorEvent,
  ResourceSendingToActorEvent,
  StandardActionEvent,
} from '../events/eventTypes';
import { MainSimulationState } from "../simulationState/mainSimulationState";
import {
  ActionBase,
  AskReinforcementAction,
  DefineMapObjectAction,
  MethaneAction,
  GetInformationAction,
  RequestResourcesFromActorAction, SendResourcesToActorAction,
} from './actionBase';
import { DefineMapObjectEvent, GeometryType, MapFeature, featurePayload } from "../events/defineMapObjectEvent";
import { PlanActionLocalEvent } from "../localEvents/localEventBase";
import { Actor } from "../actors/actor";
import { getTranslation } from "../../../tools/translation";
import { ResourceType, ResourceTypeAndNumber } from '../resources/resourceType';
import { ResourceFunctionAndNumber } from '../resources/resourceFunction';

/**
 * This class is the descriptor of an action, it represents the data of a playable action
 * It is meant to contain the generic information of an action as well as the conditions for this action to available
 * It is an action generator
 */
export abstract class ActionTemplateBase<ActionT extends ActionBase = ActionBase, EventT extends ActionCreationEvent = ActionCreationEvent, UserInput= unknown> {

  private static IdSeed = 1000;

  public readonly Uid: ActionTemplateId;
  public readonly replayable: boolean;

  public constructor(protected readonly title: TranslationKey, protected readonly description: TranslationKey, replayable: boolean = false) {
	  this.Uid = ActionTemplateBase.IdSeed++;
    this.replayable = replayable;
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
   * @param state the current game state
   * @param actor currently selected actor
   * @returns true if the player can trigger this action
   */
  public abstract isAvailable(state : Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean;

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

  protected checkIfAlreadyUsedAndCouldReplay(state: Readonly<MainSimulationState>): boolean {
	  const action = state.getInternalStateObject().actions.find((action) => action.getTemplateId() === this.Uid);
    return action == undefined ? true : this.replayable;
  }

  /**
   * @return true if the action should be created in the timeline right away, 
   * false if some other interaction should take place in between
   */
  public abstract planActionEventOnFirstClick(): boolean;

}


export class GetInformationTemplate extends ActionTemplateBase<GetInformationAction, StandardActionEvent, undefined> {

  constructor(title: TranslationKey, description: TranslationKey, 
    readonly duration: SimDuration, readonly message: TranslationKey) {
    super(title, description);
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


  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
	  return this.checkIfAlreadyUsedAndCouldReplay(state);
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

export class MethaneTemplate extends ActionTemplateBase<MethaneAction, StandardActionEvent> {

  constructor(title: TranslationKey, description: TranslationKey, 
    readonly duration: SimDuration, readonly message: TranslationKey) {
    super(title, description);
  }

  public getTemplateRef(): TemplateRef {
    return 'DefineMethaneObjectTemplate' + '_' + this.title;
  }
  
  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): MethaneAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new MethaneAction(payload.triggerTime, this.duration, this.message, this.title , event.id, ownerId, this.Uid);
  }

  public buildGlobalEvent(timeStamp: number, initiator: Readonly<Actor>, params: unknown): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return this.checkIfAlreadyUsedAndCouldReplay(state);
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


export class DefineMapObjectTemplate extends ActionTemplateBase<DefineMapObjectAction, DefineMapObjectEvent> {
  
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly feedback: TranslationKey,
    readonly featureDescription: {
      geometryType: GeometryType,
      name: string,
      icon?: string,
	  feature?: MapFeature,
    }
  ) {
    super(title, description);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, payload: featurePayload): DefineMapObjectEvent {
    
  const feature = {
    geometryType: this.featureDescription.geometryType,
    name: this.featureDescription.name,
    geometry: this.featureDescription.feature?.geometry || payload.feature,
    ...this.featureDescription.icon && {icon: this.featureDescription.icon}
  }

    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      feature: feature as unknown as MapFeature,
    }
  }

  public getTemplateRef(): string {
    return 'DefineMapObjectTemplate' + '_' + this.title;
  }

  protected createActionFromEvent(event: FullEvent<DefineMapObjectEvent>): DefineMapObjectAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new DefineMapObjectAction(payload.triggerTime, this.duration, this.title, this.feedback, event.id, ownerId, payload.feature, this.Uid);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return this.checkIfAlreadyUsedAndCouldReplay(state);
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

export type RequestResourceFromActorActionInput = { recipientActor: ActorId, requestedResources: ResourceFunctionAndNumber[] };

/**
 * Action template to create an action to request resources from an actor
 */
export class RequestResourcesFromActorActionTemplate extends ActionTemplateBase<RequestResourcesFromActorAction, ResourceRequestFromActorEvent, RequestResourceFromActorActionInput> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly message: TranslationKey,
  ) {
    super(title, description);
  }

  public getTemplateRef(): TemplateRef {
    return 'RequestResourcesFromActorActionTemplate' + '_' + this.title;
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return true; // we don't want it to be done only once, so do not this.checkIfAlreadyUsedAndCouldReplay(state);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>, params: RequestResourceFromActorActionInput): ResourceRequestFromActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      recipientActor: params.recipientActor,
      requestedResources: params.requestedResources,
    };
  }

  protected createActionFromEvent(event: FullEvent<ResourceRequestFromActorEvent>): RequestResourcesFromActorAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId;
    return new RequestResourcesFromActorAction(payload.triggerTime, this.duration, this.message, this.title, event.id, ownerId,
      this.Uid, event.payload.recipientActor, event.payload.requestedResources);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}

export type SendResourcesToActorActionInput = { receiverActor: ActorId, sentResources: ResourceTypeAndNumber[] };

/**
 * Action template to create an action to request resources from an actor
 */
export class SendResourcesToActorActionTemplate extends ActionTemplateBase<SendResourcesToActorAction, ResourceSendingToActorEvent, SendResourcesToActorActionInput> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly message: TranslationKey,
  ) {
    super(title, description);
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

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return true; // we don't want it to be done only once, so do not this.checkIfAlreadyUsedAndCouldReplay(state);
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

/**
 * Action template to ask for new resources
 */
export class AskReinforcementActionTemplate extends ActionTemplateBase<AskReinforcementAction, StandardActionEvent> {

  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly resourceType: ResourceType,
    readonly nb : number,
    readonly message: TranslationKey,
  ) {
    super(title, description);
  }

  public getTemplateRef(): TemplateRef {
    return 'AskReinforcementActionTemplate' + '_' + this.title;
  }

  public getDescription(): string {
	return getTranslation('mainSim-actions-tasks', this.description);
  }

  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor: Readonly<Actor>): boolean {
    return true; // we don't want it to be done only once, so do not this.checkIfAlreadyUsedAndCouldReplay(state);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Readonly<Actor>): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): AskReinforcementAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new AskReinforcementAction(payload.triggerTime, this.duration, this.title, event.id, ownerId,
      this.resourceType, this.nb, this.message, this.Uid);
  }

  public planActionEventOnFirstClick(): boolean {
    return true;
  }

}
