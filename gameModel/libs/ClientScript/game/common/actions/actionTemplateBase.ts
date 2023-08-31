import { ActionTemplateId, ActorId, SimDuration, SimTime, TemplateRef, TranslationKey } from "../baseTypes";
import { initBaseEvent } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import { ActionCreationEvent, StandardActionEvent } from "../events/eventTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ActionBase, AskReinforcementAction, DefineMapObjectAction, MethaneAction, GetInformationAction } from "./actionBase";
import { DefineMapObjectEvent, GeometryType, MapFeature, featurePayload } from "../events/defineMapObjectEvent";
import { PlanActionLocalEvent } from "../localEvents/localEventBase";
import { Actor } from "../actors/actor";
import { AskReinforcementEvent } from "../events/askReinforcementEvent";
import { ResourceType } from "../resources/resourcePool";

/**
 * This class is the descriptor of an action, it represents the data of a playable action
 * It is meant to contain the generic information of an action as well as the conditions for this action to available
 * It is an action generator
 */
export abstract class ActionTemplateBase<ActionT extends ActionBase = ActionBase, EventT extends ActionCreationEvent = ActionCreationEvent, UserInput= unknown> {

  private static IdSeed = 1000;

  public readonly Uid: ActionTemplateId;
  public readonly isReplayable: boolean;

  public constructor(protected readonly title: TranslationKey, protected readonly description: TranslationKey, protected readonly replayable: boolean = false) {
	  this.Uid = ActionTemplateBase.IdSeed++;
    this.isReplayable = replayable;
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
  public abstract buildGlobalEvent(timeStamp: SimTime, initiator: Actor, params: UserInput): EventT;

  /**
   * Determines if the action can be launched given the current state of the game and the actor being played
   * @param state the current game state
   * @param actor currently selected actor
   * @returns true if the player can trigger this action
   */
  public abstract isAvailable(state : MainSimulationState, actor : Actor): boolean;

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

}

// TODO move to own file
/**
 * Get some information
 */
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

  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor) : StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public getTemplateRef(): TemplateRef {
    return 'GetInformationTemplate' + '_' + this.title;
  }


  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    const action = state.getInternalStateObject().actions.find((action) => action instanceof GetInformationAction && action.getTemplateId() === this.Uid);
    return action == undefined ? true : this.replayable;
  }

  public getDescription(): string {
	return this.description;
  }
  public getTitle(): string {
    return this.title;
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

  public buildGlobalEvent(timeStamp: number, initiator: Actor, params: unknown): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    const action = state.getInternalStateObject().actions.find((action) => action instanceof MethaneAction && action.getTemplateId() === this.Uid);
    return action == undefined ? true : this.replayable;
  }
  
  public getDescription(): string {
    return this.description;
  }
    
  public getTitle(): string {
    return this.title;
  }

}

// TODO move to own file
/**
 * 
 */
export class DefineMapObjectTemplate extends ActionTemplateBase<DefineMapObjectAction, DefineMapObjectEvent> {
  
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly featureName: string,
    readonly featureType: GeometryType,
  ) {
    super(title, description);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor, payload: featurePayload): DefineMapObjectEvent {
    
	const feature = {
      type: this.featureType,
      name: this.featureName,
      id: payload.id,
      geometry: payload.feature,
    }

    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      feature: feature as MapFeature,
    }
  }

  public getTemplateRef(): string {
    return 'DefineMapObjectTemplate' + '_' + this.title;
  }

  protected createActionFromEvent(event: FullEvent<DefineMapObjectEvent>): DefineMapObjectAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new DefineMapObjectAction(payload.triggerTime, this.duration, this.title, event.id, ownerId, payload.feature, this.Uid));
  }

  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    const action = state.getInternalStateObject().actions.find((action) => action instanceof DefineMapObjectAction && action.getTemplateId() === this.Uid);
    return action == undefined ? true : this.replayable;
  }

  public getDescription(): string {
    return this.description;
  }
  public getTitle(): string {
    return this.title;
  }

}

/**
 * Action template to ask for new resources
 */
export class AskReinforcementActionTemplate extends ActionTemplateBase<AskReinforcementAction, AskReinforcementEvent> {

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

  public getTitle(): TranslationKey {
    return this.title;
  }

  public getDescription(): TranslationKey {
    return this.description;
  }

  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    return true;
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor): AskReinforcementEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  protected createActionFromEvent(event: FullEvent<AskReinforcementEvent>): AskReinforcementAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new AskReinforcementAction(payload.triggerTime, this.duration, this.title, event.id, ownerId,
      this.resourceType, this.nb, this.message, this.Uid);
  }

}
