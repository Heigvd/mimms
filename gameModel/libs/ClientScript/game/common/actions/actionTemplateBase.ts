import { ActorId, SimDuration, SimTime, TemplateRef, TranslationKey } from "../baseTypes";
import { initBaseEvent } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import { ActionCreationEvent, EventPayload } from "../events/eventTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ActionBase, DefineMapObjectAction, GetInformationAction } from "./actionBase";
import { GetInformationEvent } from "../events/getInformationEvent";
import { DefineMapObjectEvent, MapFeature } from "../events/defineMapObjectEvent";
import { PlanActionLocalEvent } from "../localEvents/localEventBase";
import { Actor } from "../actors/actor";


/**
 * This class is the descriptor of an action, it represents the data of a playable action
 * It is meant to contain the generic information of an action as well as the conditions for this action to available
 * It is an action generator
 */
export abstract class ActionTemplateBase<ActionT extends ActionBase = ActionBase, EventT extends ActionCreationEvent = ActionCreationEvent, UserInput= unknown> {

  public constructor(protected readonly title: TranslationKey, protected readonly description: TranslationKey) {}

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
export class GetInformationTemplate extends ActionTemplateBase<GetInformationAction, GetInformationEvent, undefined> {
  
  constructor(title: TranslationKey, description: TranslationKey, 
    readonly duration: SimDuration, readonly message: TranslationKey) {
    super(title, description);
  }

  protected createActionFromEvent(event: FullEvent<GetInformationEvent>): GetInformationAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new GetInformationAction(payload.triggerTime, this.duration, this.message, this.title , event.id, ownerId);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor) : GetInformationEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public getTemplateRef(): TemplateRef {
    return 'GetInformationTemplate' + '_' + this.title;
  }


  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    return true;
    throw new Error("Method not implemented.");
  }
  public getDescription(): string {
    throw new Error("Method not implemented.");
  }
  public getTitle(): string {
    throw new Error("Method not implemented.");
  }

}

/**
 * 
 */
export class DefineMapObjectTemplate extends ActionTemplateBase<DefineMapObjectAction, DefineMapObjectEvent> {
  
  //@Mikkel : the feature is not known in the template, this template is only a generator of actions
  // however the type of feature might be known.
  constructor(
    title: TranslationKey,
    description: TranslationKey,
    readonly duration: SimDuration,
    readonly feature: MapFeature
  ) {
    super(title, description);
  }

  // @ Mikkel the feature should be built here from user input coordinates for example
  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor, featureData: any): DefineMapObjectEvent {
    // TODO build feature here from user input
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      feature: this.feature,
    }
  }

  public getTemplateRef(): string {
    return 'DefineMapObjectTemplate' + '_' + this.title;
  }

  protected createActionFromEvent(event: FullEvent<DefineMapObjectEvent>): DefineMapObjectAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    // @Mikkel the feature will be parsed from the event payload 
    // (suppose I created a geometry on my interface and you receive the payload that describes it)
    return new DefineMapObjectAction(payload.triggerTime, this.duration, event.id, ownerId, this.feature);
  }

  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    throw new Error("Method not implemented.");
  }
  public getDescription(): string {
    throw new Error("Method not implemented.");
  }
  public getTitle(): string {
    throw new Error("Method not implemented.");
  }

}